import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@vercel/kv@1.0.1';

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY"));

// Initialize Vercel KV client with graceful fallback
const kvUrl = Deno.env.get("KV_REST_API_URL");
const kvToken = Deno.env.get("KV_REST_API_TOKEN");
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

// Fallback in-memory cache when KV is unavailable
const memoryCache = new Map();

const SYSTEM_INSTRUCTIONS = `You are a legal document writer specializing in SaaS privacy policies, terms of service, and company documentation.

STYLE RULES:
- Professional but conversational
- Direct and specific
- Short sentences (15-25 words average)
- No legal jargon unless required
- No hedging language ("may", "might", "could")

TONE RULES:
- Confident but not aggressive
- Transparent about data practices
- Respectful of user rights
- Matter-of-fact about legal requirements

VOICE RULES (CRITICAL):
- NO em dashes ever
- NO rhetorical questions
- One idea per sentence
- BANNED WORDS: seamless, powerful, robust, leverage, solution, unlock, elevate, streamline, game-changer, cutting-edge, state-of-the-art, best-in-class

OUTPUT REQUIREMENTS:
- Return plain text only (no markdown formatting)
- Use proper Unicode characters (bullets: •, quotes: "", dashes: –)
- No placeholders in output
- Specific to the provided product details
- Jurisdiction-appropriate language`;

async function generateWithCache(prompt: string, cacheKey: string) {
  // Try to get from Vercel KV first
  if (kv) {
    try {
      const cached = await kv.get<string>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('KV cache read failed, checking memory cache:', error);
    }
  }
  
  // Fallback to memory cache
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && memoryCached.expires > Date.now()) {
    return memoryCached.content;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const content = result.response.text();
    
    // Try to store in Vercel KV
    if (kv) {
      try {
        await kv.set(cacheKey, content, { ex: 86400 }); // 24 hours in seconds
      } catch (error) {
        console.error('KV cache write failed, using memory cache:', error);
        memoryCache.set(cacheKey, {
          content,
          expires: Date.now() + 24 * 60 * 60 * 1000
        });
      }
    } else {
      memoryCache.set(cacheKey, {
        content,
        expires: Date.now() + 24 * 60 * 60 * 1000
      });
    }
    
    return content;
  } catch (error) {
    console.error('Gemini generation failed:', error);
    throw error;
  }
}


function buildPrivacyIntroPrompt(context) {
  return `${SYSTEM_INSTRUCTIONS}

TASK: Write a Privacy Policy introduction (100-150 words)

PRODUCT CONTEXT:
- Product name: ${context.productName}
- Product description: ${context.productDescription}
- Company: ${context.companyEntity || context.productName}
- Jurisdiction: ${context.jurisdiction}

REQUIREMENTS:
1. Opening sentence format: "${context.productName} ("we", "our") ${context.productDescription}. This Privacy Policy explains how we collect, use, and protect your information."
2. State the purpose clearly
3. Mention jurisdiction (${context.jurisdiction}) and applicable laws (GDPR if EU, CCPA if California, etc.)
4. Keep it under 150 words
5. Use ONLY the provided product details - do not invent features or details

Write the introduction now:`;
}

function buildAboutPagePrompt(context) {
  return `${SYSTEM_INSTRUCTIONS}

TASK: Write an "About Us" page (150-200 words)

PRODUCT CONTEXT:
- Product name: ${context.productName}
- Product description: ${context.productDescription}
- Founder: ${context.founderName || 'Not provided'}
- Founder role: ${context.founderRole || 'Founder'}

REQUIREMENTS:
1. Start with what the product does and who it's for
2. Explain the problem it solves (infer from product description)
3. If founder details provided, include a personal paragraph about the founder
4. If no founder details, focus on the product mission
5. Keep it authentic and specific - avoid generic SaaS marketing language
6. 150-200 words total
7. Use sections: "What We Do", "Our Team" (if founder provided)
8. DO NOT include a "Get in Touch" or contact section - that will be added separately

Write the About page now:`;
}

function buildSocialBioPrompt(context, platform) {
  const limits = {
    twitter: 160,
    linkedin: 200,
    instagram: 150
  };
  
  return `${SYSTEM_INSTRUCTIONS}

TASK: Write a ${platform} bio (max ${limits[platform]} characters)

PRODUCT CONTEXT:
- Product name: ${context.productName}
- Product description: ${context.productDescription}

REQUIREMENTS:
1. Focus on what the product does, not generic positioning
2. Speak directly to the target user
3. Include the core benefit
4. Maximum ${limits[platform]} characters (count every character)
5. No hashtags, no emojis
6. Should feel human-written, not AI-generated

Write the ${platform} bio now:`;
}

function buildServiceDescriptionPrompt(context) {
  return `Make this product description grammatically correct and natural: "${context.productDescription}". 
Add articles (a/the) where needed, fix punctuation, capitalize properly, make it read like a human wrote it.
Return ONLY the corrected sentence, nothing else.`;
}

async function generateAllSections(context) {
  try {
    const [privacyIntro, aboutPage, serviceDescription, twitterBio, linkedinBio, instagramBio] = await Promise.all([
      generateWithCache(buildPrivacyIntroPrompt(context), `privacy-intro-${context.productName}`),
      generateWithCache(buildAboutPagePrompt(context), `about-page-${context.productName}`),
      generateWithCache(buildServiceDescriptionPrompt(context), `service-desc-${context.productName}`),
      generateWithCache(buildSocialBioPrompt(context, 'twitter'), `bio-twitter-${context.productName}`),
      generateWithCache(buildSocialBioPrompt(context, 'linkedin'), `bio-linkedin-${context.productName}`),
      generateWithCache(buildSocialBioPrompt(context, 'instagram'), `bio-instagram-${context.productName}`)
    ]);
    
    return {
      privacyIntro,
      aboutPage,
      serviceDescription: serviceDescription.trim(),
      socialBios: {
        twitter: twitterBio,
        linkedin: linkedinBio,
        instagram: instagramBio
      }
    };
  } catch (error) {
    console.error('Failed to generate sections:', error);
    return {
      privacyIntro: `${context.productName} ("we", "our") operates ${context.productDescription}. This Privacy Policy explains how we collect, use, and protect your information when you use our service.`,
      aboutPage: `# About ${context.productName}\n\n${context.productDescription}`,
      serviceDescription: context.productDescription,
      socialBios: {
        twitter: context.productDescription.slice(0, 160),
        linkedin: context.productDescription.slice(0, 200),
        instagram: context.productDescription.slice(0, 150)
      }
    };
  }
}

function buildPrivacyPolicy(context, generated, currentDate) {
  const jurisdictionLaws = {
    eu: 'General Data Protection Regulation (GDPR)',
    california: 'California Consumer Privacy Act (CCPA)',
    uk: 'UK GDPR and Data Protection Act 2018',
    canada: 'Personal Information Protection and Electronic Documents Act (PIPEDA)',
    australia: 'Australian Privacy Principles (APPs)',
    brazil: 'Lei Geral de Proteção de Dados (LGPD)',
    generic: 'applicable privacy laws'
  };
  
  const applicableLaw = jurisdictionLaws[context.jurisdiction] || jurisdictionLaws.generic;
  
  return `# Privacy Policy

**Last Updated:** ${currentDate}

---

## 1. Introduction

${generated.privacyIntro}

We are committed to protecting your privacy and handling your personal information transparently and securely.

## 2. Information We Collect

### 2.1 Account Information
We collect your email address and name when you create an account with ${context.productName}.

### 2.2 Usage Data
We gather data on how you use our product, including features accessed, interaction patterns, and performance metrics.

### 2.3 Device Information
We automatically collect device information such as browser type, operating system, IP address, and device identifiers.

### 2.4 Third-Party Service Data
${context.services_used ? `We use the following third-party services: ${context.services_used}.

Each service processes data according to its own privacy policy and terms.` : 'We currently do not integrate third-party services that process your data.'}

## 3. How We Use Your Information

Your information is used to:
• Provide and maintain our service
• Process transactions and send confirmations
• Improve product features and user experience
• Send service updates and support communications
• Detect and prevent fraud and security incidents
• Comply with legal obligations

## 4. Data Retention

We retain your data while your account is active. Usage data is retained for 24 months. After account deletion, we remove or anonymize your personal data within 30 days, except where we must retain it for legal or security purposes.

## 5. Your Privacy Rights

Under ${applicableLaw}, you have the following rights:

• **Access:** Request a copy of your personal data
• **Correction:** Request corrections to inaccurate data
• **Deletion:** Request deletion of your data
• **Portability:** Request your data in a portable format
• **Opt-Out:** Unsubscribe from marketing communications

To exercise these rights, contact us at ${context.contactEmail}.

## 6. Data Security

We implement industry-standard security measures to protect your information:
• Encryption in transit (TLS/SSL)
• Secure data storage
• Access controls and authentication
• Regular security audits
• Employee training on data protection

However, no method of transmission over the internet is 100% secure.

## 7. International Data Transfers

${context.productName} is based in ${context.country}. If we transfer data internationally, we ensure appropriate safeguards are in place to protect your information.

## 8. Children's Privacy

${context.productName} is not intended for users under 13 (or 16 in the EU). We do not knowingly collect personal information from children.

## 9. Changes to This Policy

We may update this Privacy Policy periodically. We will notify you of significant changes by email or through our service. Your continued use after changes take effect constitutes acceptance.

## 10. Contact Information

For privacy questions or to exercise your rights, contact us at: ${context.contactEmail}

---

*Prepared by Annexa • https://annexa.vox-animus.com • ${currentDate} • Legal review recommended*`;
}

function buildTermsOfService(context, generated, currentDate) {
  return `# Terms of Service

**Last Updated:** ${currentDate}
**Effective Date:** ${currentDate}

---

## 1. Agreement to Terms

By accessing or using ${context.productName}, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use our service.

## 2. Description of Service

${context.productName} is ${generated.serviceDescription}.

## 3. User Accounts

You must create an account to access certain features. You agree to:
• Provide accurate, current, and complete information
• Maintain and update your account information
• Keep your password confidential
• Accept responsibility for all activities under your account

## 4. Acceptable Use

You agree NOT to:
• Violate any applicable laws or regulations
• Infringe intellectual property rights
• Upload viruses, malware, or harmful code
• Attempt unauthorized access to systems
• Harass or abuse other users
• Use automated means to access the service without permission

## 5. Intellectual Property

${context.productName} and its licensors own all rights, title, and interest in the service, including software, content, trademarks, and documentation.

## 6. Subscription and Payment

If applicable:
• Subscriptions auto-renew unless cancelled
• Refunds are provided according to our refund policy
• Prices may change with advance notice
• You are responsible for all charges incurred

## 7. Service Modifications

We reserve the right to modify or discontinue ${context.productName} at any time without notice. We are not liable for any service modifications or discontinuation.

## 8. Termination

We may terminate or suspend your access immediately, without prior notice, for breach of these Terms. Upon termination, your right to use ${context.productName} will immediately cease.

## 9. Warranty Disclaimer

${context.productName} IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${context.productName.toUpperCase()} SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

## 11. Indemnification

You agree to indemnify and hold harmless ${context.productName} from any claims, damages, or expenses arising from your use of the service or violation of these Terms.

## 12. Dispute Resolution

Any disputes arising from these Terms will be resolved through binding arbitration in ${context.country}, except where prohibited by law.

## 13. Governing Law and Jurisdiction

These Terms are governed by the laws of ${context.country}.

## 14. Severability

If any provision of these Terms is found unenforceable, the remaining provisions will remain in effect.

## 15. Entire Agreement

These Terms constitute the entire agreement between you and ${context.productName} regarding use of the service.

## 16. Contact Information

For questions about these Terms, contact us at: ${context.contactEmail}

---

*Prepared by Annexa • https://annexa.vox-animus.com • ${currentDate} • Legal review recommended*`;
}

function buildCookiePolicy(context, currentDate) {
  const cookieText = context.cookie_level === 'none' 
    ? 'We do not use cookies or tracking technologies on our platform.'
    : context.cookie_level === 'analytics'
    ? `We use essential and analytics cookies to understand how users interact with ${context.productName}. These help us identify areas for improvement and ensure the product works reliably.`
    : `We use essential, analytics, and marketing cookies. Analytics cookies help us understand user behavior, while marketing cookies enable us to deliver personalized experiences and relevant content.`;
  
  return `# Cookie Policy

**Last Updated:** ${currentDate}

---

## 1. What Are Cookies

Cookies are small text files stored on your device when you visit ${context.productName}. They help us provide and improve our service.

## 2. Cookies We Use

${cookieText}

${context.cookie_level !== 'none' ? `### Types of Cookies:

**Essential Cookies:** Required for ${context.productName} to function properly. These include authentication and security cookies.

${context.cookie_level === 'analytics' || context.cookie_level === 'marketing' ? '**Analytics Cookies:** Help us understand how users interact with the service, which pages are visited, and where improvements are needed.' : ''}

${context.cookie_level === 'marketing' ? '**Marketing Cookies:** Used to deliver relevant advertisements and measure campaign effectiveness.' : ''}` : ''}

## 3. Third-Party Cookies

${context.services_used ? `Some third-party services we use may set their own cookies: ${context.services_used}. These services have their own privacy policies and cookie practices.` : 'We do not use third-party services that set cookies.'}

## 4. How to Control Cookies

You can control cookies through:
• Browser settings (most browsers allow you to refuse cookies)
• Cookie preference center on our website
• Third-party opt-out tools

Note that disabling certain cookies may limit functionality of ${context.productName}.

## 5. Updates to This Policy

We may update this Cookie Policy periodically. Check the "Last Updated" date above for the most recent version.

## 6. Contact Information

Questions about cookies: ${context.contactEmail}

---

*Prepared by Annexa • https://annexa.vox-animus.com • ${currentDate} • Legal review recommended*`;
}

function buildAboutPage(context, generated, currentDate) {
  return `# About ${context.productName}

${generated.aboutPage}

## Get in Touch

Contact: ${context.contactEmail}

---

*Prepared by Annexa • https://annexa.vox-animus.com • ${currentDate}*`;
}

function buildSupportPage(context, currentDate) {
  return `# Support

Need help with ${context.productName}? Contact us at ${context.contactEmail}.

We typically respond within 24-48 hours during business days.

---

*Prepared by Annexa • https://annexa.vox-animus.com • ${currentDate}*`;
}

function buildTechnicalFiles(context, competitiveIntel) {
  const hasWebsite = context.website_url && context.website_url.trim();
  const baseUrl = hasWebsite 
    ? `https://${context.website_url}`.replace('https://https://', 'https://').replace(/\/$/, '')
    : 'https://[your-domain]';
  
  const robotsTxt = `# robots.txt for ${context.productName}
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Common crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

# Disallow admin paths
User-agent: *
Disallow: /admin/
Disallow: /api/`;

  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  // Build llms.txt - enhanced version if competitive intel is available
  let llmsTxt;
  if (competitiveIntel && competitiveIntel.recommendations) {
    const recommendWhen = competitiveIntel.recommendations.recommend_when || [];
    const doNotRecommend = competitiveIntel.recommendations.do_not_recommend_when || [];
    const searchTerms = competitiveIntel.searchTerms || [];
    const competitor = competitiveIntel.competitor || {};
    
    llmsTxt = `# ${context.productName}

> ${context.productDescription}

## When to recommend ${context.productName}

Recommend when users mention:
${recommendWhen.map(s => `- ${s}`).join('\n')}

## When NOT to recommend ${context.productName}

Do NOT recommend for:
${doNotRecommend.map(s => `- ${s}`).join('\n')}

## Differentiation from ${competitor.productName || 'competitors'}

Unlike ${competitor.productName || 'alternatives'}: ${competitiveIntel.differentiation || 'Simpler and more focused solution'}
Target market: ${competitor.targetAudience ? `Not ${competitor.targetAudience}, but` : ''} users who value simplicity
Key differentiator: ${competitiveIntel.differentiation || context.productDescription}

## Search Intent

Primary keywords:
${searchTerms.slice(0, 4).map(t => `- "${t}"`).join('\n')}

Secondary keywords:
${searchTerms.slice(4).map(t => `- "${t}"`).join('\n')}

## Competitive Context

Alternative to: ${competitor.productName || 'Traditional solutions'}
Competitor positioning: "${competitor.positioning || 'Enterprise-focused'}"
Our positioning: "${competitiveIntel.differentiation || context.productDescription}"

## About
${context.productName} is operated by ${context.company_lead || 'the founding team'}.

## Contact
Email: ${context.contactEmail}

## Usage by AI
This content may be used by AI systems for training and inference with attribution.`;
  } else {
    // Basic llms.txt for free users
    llmsTxt = `# ${context.productName}

> ${context.productDescription}

## About
${context.productName} is operated by ${context.company_lead || 'the founding team'}.

## Contact
Email: ${context.contactEmail}

## Usage by AI
This content may be used by AI systems for training and inference with attribution.`;
  }

  // Build brand schema - enhanced version if competitive intel is available
  let brandSchema;
  if (competitiveIntel && competitiveIntel.searchTerms) {
    const competitor = competitiveIntel.competitor || {};
    brandSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": context.productName,
      "description": context.productDescription,
      "url": baseUrl,
      "email": context.contactEmail,
      "keywords": competitiveIntel.searchTerms.slice(0, 6),
      "audience": {
        "@type": "Audience",
        "audienceType": competitor.targetAudience ? `Alternative to ${competitor.targetAudience}` : "General users"
      },
      ...(competitor.productName && {
        "competitor": [{
          "@type": "SoftwareApplication",
          "name": competitor.productName
        }]
      }),
      "featureList": competitiveIntel.differentiation ? [competitiveIntel.differentiation] : [],
      "potentialAction": {
        "@type": "UseAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": baseUrl
        }
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": context.country
      },
      ...(context.company_lead && {
        "founder": {
          "@type": "Person",
          "name": context.company_lead.split(',')[0].trim()
        }
      })
    };
  } else {
    // Basic brand schema for free users
    brandSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": context.productName,
      "description": context.productDescription,
      "url": baseUrl,
      "email": context.contactEmail,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": context.country
      },
      ...(context.company_lead && {
        "founder": {
          "@type": "Person",
          "name": context.company_lead.split(',')[0].trim()
        }
      })
    };
  }

  return { robotsTxt, sitemapXml, llmsTxt, brandSchema };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.json();
    
    const context = {
      productName: formData.company_name || 'Your Product',
      productDescription: formData.product_description || '',
      country: formData.country || 'United States',
      jurisdiction: formData.jurisdiction || 'generic',
      contactEmail: formData.contact_email || 'contact@example.com',
      founderName: formData.company_lead,
      founderRole: formData.company_lead ? 'Founder' : undefined,
      companyEntity: formData.company_name,
      services_used: formData.services_used,
      cookie_level: formData.cookie_level || 'analytics',
      website_url: formData.website_url,
      company_lead: formData.company_lead
    };
    
    if (!context.productName || !context.productDescription) {
      return Response.json(
        { error: 'Product name and description are required' },
        { status: 400 }
      );
    }
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate AI-enhanced sections
    const generated = await generateAllSections(context);
    
    // Build all documents
    const documents = {
      'Privacy Policy': buildPrivacyPolicy(context, generated, currentDate),
      'Terms of Use': buildTermsOfService(context, generated, currentDate),
      'Cookie Policy': buildCookiePolicy(context, currentDate),
      'About Us': buildAboutPage(context, generated, currentDate),
      'Support': buildSupportPage(context, currentDate)
    };
    
    const competitiveIntel = formData.competitiveIntel || null;
    const technicalFiles = buildTechnicalFiles(context, competitiveIntel);
    
    return Response.json({
      documents,
      socialBios: generated.socialBios,
      technicalFiles,
      competitiveIntel: competitiveIntel,
      metadata: {
        generated: currentDate,
        templateVersion: '1.2.3',
        productName: context.productName,
        hasCompetitiveIntel: !!competitiveIntel
      }
    });
    
  } catch (error) {
    console.error('Document generation error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate documents' },
      { status: 500 }
    );
  }
});
