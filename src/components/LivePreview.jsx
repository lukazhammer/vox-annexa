import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Circle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';

export default function LivePreview({ formData, highlightedField, transformedIntroduction }) {
  const [activeTab, setActiveTab] = useState('privacy');
  const [copiedDoc, setCopiedDoc] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasContent = formData.company_name || formData.product_description;

  const handleTabChange = (value) => {
    setActiveTab(value);
    base44.analytics.track({
      eventName: 'launch_kit_document_previewed',
      properties: { document: value }
    });
  };

  const calculateCompletion = (docType) => {
    const requirements = {
      privacy: ['company_name', 'product_description', 'country', 'cookie_level', 'services_used'],
      terms: ['company_name', 'country', 'contact_email'],
      about: ['company_name', 'product_description', 'company_lead'],
      support: ['company_name', 'contact_email']
    };

    const fields = requirements[docType] || [];
    const completed = fields.filter(field => formData[field]?.toString().trim()).length;
    const percentage = Math.round((completed / fields.length) * 100);
    
    return { percentage, completed, total: fields.length };
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 80) {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    } else if (percentage >= 20) {
      return <span className="text-yellow-500 text-lg leading-none">⋯</span>;
    } else {
      return <Circle className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const handleCopy = (docType, content) => {
    navigator.clipboard.writeText(content);
    setCopiedDoc(docType);
    setTimeout(() => setCopiedDoc(null), 2000);
    
    base44.analytics.track({
      eventName: 'launch_kit_document_copied',
      properties: { document: docType }
    });
  };

  const getLegalFooter = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `

  ---

  *Prepared by Annexa (Vox Animus OÜ) • Template v1.2.3 • Prepared: ${currentDate} • Review recommended before use*`;
  };

  const generatePrivacyPolicy = () => {
    const name = formData.company_name || '*Your product name*';
    const description = formData.product_description || '*What does your product do? Fill this in the Foundation section above*';
    const country = formData.country || '*Your country*';
    const email = formData.contact_email || '*your@email.com*';
    const services = formData.services_used || '';

    // Use AI-transformed introduction if available, otherwise use simple template
    const introductionSection = transformedIntroduction || 
      `${name} ("we", "our", or "us") operates ${description}. This Privacy Policy explains how we collect, use, and protect your information when you use our service.`;

    // Parse services into array
    const serviceList = services ? services.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // Service details mapping
    const serviceDetails = {
      'Stripe': { 
        data: 'Payment information, billing address, transaction history', 
        purpose: 'Handle subscriptions and payment processing',
        privacy: 'stripe.com/privacy'
      },
      'Google Analytics': { 
        data: 'Usage patterns, page views, device information, geographic location', 
        purpose: 'Understand how users interact with our product',
        privacy: 'policies.google.com/privacy'
      },
      'Supabase': { 
        data: 'User authentication data, database records, API usage logs', 
        purpose: 'Backend database and authentication services',
        privacy: 'supabase.com/privacy'
      },
      'Resend': { 
        data: 'Email addresses, delivery metrics, email content', 
        purpose: 'Send transactional emails and notifications',
        privacy: 'resend.com/legal/privacy-policy'
      },
      'Vercel': { 
        data: 'Page performance metrics, visitor analytics, deployment logs', 
        purpose: 'Host application and monitor site performance',
        privacy: 'vercel.com/legal/privacy-policy'
      },
      'Plausible': { 
        data: 'Page views, visitor sources, device types (no personal data)', 
        purpose: 'Privacy-friendly website analytics',
        privacy: 'plausible.io/privacy'
      },
      'Mailgun': { 
        data: 'Email addresses, delivery status, email engagement metrics', 
        purpose: 'Send and track transactional emails',
        privacy: 'mailgun.com/legal/privacy-policy'
      },
      'SendGrid': { 
        data: 'Email addresses, delivery status, click and open rates', 
        purpose: 'Send marketing and transactional emails',
        privacy: 'sendgrid.com/policies/privacy'
      },
      'Vercel Analytics': { 
        data: 'Page performance, visitor metrics, Core Web Vitals', 
        purpose: 'Monitor site performance and user experience',
        privacy: 'vercel.com/legal/privacy-policy'
      },
      'Mixpanel': { 
        data: 'User actions, feature usage, conversion events, user properties', 
        purpose: 'Track product analytics and user behavior',
        privacy: 'mixpanel.com/legal/privacy-policy'
      },
      'Posthog': { 
        data: 'Session recordings, feature flags, user events, product analytics', 
        purpose: 'Analyze product usage and run experiments',
        privacy: 'posthog.com/privacy'
      },
      'Amplitude': { 
        data: 'User behavior, retention metrics, cohort analysis', 
        purpose: 'Understand user journeys and engagement',
        privacy: 'amplitude.com/privacy'
      },
      'Segment': { 
        data: 'Customer data routing, event tracking, user profiles', 
        purpose: 'Centralize data collection and route to other tools',
        privacy: 'segment.com/legal/privacy'
      },
      'Mailchimp': { 
        data: 'Email addresses, campaign engagement, subscriber preferences', 
        purpose: 'Send marketing emails and newsletters',
        privacy: 'mailchimp.com/legal/privacy'
      },
      'Intercom': { 
        data: 'User profiles, chat history, support tickets, behavioral data', 
        purpose: 'Provide customer support and messaging',
        privacy: 'intercom.com/legal/privacy'
      },
      'Crisp': { 
        data: 'Chat conversations, user information, support interactions', 
        purpose: 'Live chat support and customer messaging',
        privacy: 'crisp.chat/en/privacy'
      },
      'Sentry': { 
        data: 'Error logs, stack traces, device info, performance metrics', 
        purpose: 'Monitor and fix technical issues',
        privacy: 'sentry.io/privacy'
      },
      'LogRocket': { 
        data: 'Session recordings, console logs, network requests, user interactions', 
        purpose: 'Debug issues and improve user experience',
        privacy: 'logrocket.com/privacy'
      },
      'Hotjar': { 
        data: 'Heatmaps, session recordings, surveys, feedback responses', 
        purpose: 'Understand user behavior through visual analytics',
        privacy: 'hotjar.com/legal/policies/privacy'
      }
    };

    const cookieText = formData.cookie_level === 'none' 
      ? 'We do not use cookies or tracking technologies on our platform.'
      : formData.cookie_level === 'analytics'
      ? `We use essential and analytics cookies to understand how users interact with ${name}. These help us identify areas for improvement and ensure the product works reliably.`
      : `We use essential, analytics, and marketing cookies. Analytics cookies help us understand user behavior, while marketing cookies enable us to deliver personalized experiences and relevant content.`;

    // Jurisdiction-specific rights
    let jurisdictionRights = '';
    
    if (formData.jurisdiction === 'eu') {
      jurisdictionRights = `

### European Residents (GDPR)

Under the General Data Protection Regulation (GDPR), you have enhanced rights:

- **Right to Access**: Request a copy of all personal data we hold about you
- **Right to Rectification**: Correct any inaccurate or incomplete personal data
- **Right to Erasure**: Request deletion of your data ("right to be forgotten")
- **Right to Restrict Processing**: Limit how we process your data in certain circumstances
- **Right to Data Portability**: Receive your data in a structured, machine-readable format
- **Right to Object**: Object to processing based on legitimate interests or direct marketing
- **Right to Withdraw Consent**: Withdraw consent at any time where we rely on consent
- **Right to Lodge a Complaint**: File a complaint with your local data protection authority

**Legal Basis**: We process your data based on consent, contractual necessity, legal obligations, and legitimate interests.

**Data Protection Authority**: You may contact your local supervisory authority if you have concerns about how we handle your data.`;
    } else if (formData.jurisdiction === 'california') {
      jurisdictionRights = `

### California Residents (CCPA/CPRA)

Under the California Consumer Privacy Act and California Privacy Rights Act, you have:

- **Right to Know**: Request disclosure of personal information we've collected, used, or shared
- **Right to Delete**: Request deletion of your personal information
- **Right to Correct**: Request correction of inaccurate personal information
- **Right to Opt-Out**: Opt out of sale or sharing of personal information (we do not sell data)
- **Right to Limit**: Limit use of sensitive personal information
- **Right to Non-Discrimination**: Exercise your rights without discriminatory treatment

**Verification**: To protect your privacy, we verify your identity before processing requests.

**Authorized Agents**: You may designate an authorized agent to make requests on your behalf.`;
    } else if (formData.jurisdiction === 'uk') {
      jurisdictionRights = `

### UK Residents (UK GDPR)

Under UK GDPR and the Data Protection Act 2018, you have:

- **Right to Access**: Obtain a copy of your personal data we process
- **Right to Rectification**: Correct inaccurate or incomplete personal data
- **Right to Erasure**: Request deletion of your personal data in certain circumstances
- **Right to Restrict Processing**: Limit how we use your data
- **Right to Data Portability**: Receive your data in a portable format
- **Right to Object**: Object to processing based on legitimate interests or direct marketing
- **Right to Withdraw Consent**: Withdraw consent where we rely on it for processing

**ICO**: You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you're unhappy with how we handle your data.`;
    } else if (formData.jurisdiction === 'canada') {
      jurisdictionRights = `

### Canadian Residents (PIPEDA)

Under the Personal Information Protection and Electronic Documents Act (PIPEDA), you have:

- **Right to Access**: Request access to your personal information
- **Right to Correction**: Request correction of inaccurate personal information
- **Right to Withdraw Consent**: Withdraw consent for data collection and use
- **Right to Challenge Compliance**: Challenge our compliance with PIPEDA principles

**Privacy Commissioner**: You may file a complaint with the Office of the Privacy Commissioner of Canada.`;
    } else if (formData.jurisdiction === 'australia') {
      jurisdictionRights = `

### Australian Residents (Privacy Act)

Under the Australian Privacy Principles (APPs), you have:

- **Right to Access**: Request access to your personal information
- **Right to Correction**: Request correction of inaccurate personal information
- **Right to Complain**: Lodge a complaint about privacy breaches

**OAIC**: You may file a complaint with the Office of the Australian Information Commissioner (OAIC).`;
    } else if (formData.jurisdiction === 'brazil') {
      jurisdictionRights = `

### Brazilian Residents (LGPD)

Under the Lei Geral de Proteção de Dados (LGPD), you have:

- **Right to Confirmation**: Confirm whether we process your data
- **Right to Access**: Access your personal data
- **Right to Correction**: Correct incomplete or inaccurate data
- **Right to Deletion**: Request deletion of your data
- **Right to Portability**: Request data portability to another provider
- **Right to Information**: Know which entities we share your data with

**ANPD**: You may file a complaint with Brazil's National Data Protection Authority (ANPD).`;
    } else if (formData.jurisdiction === 'generic' && formData.country) {
      jurisdictionRights = `

### Your Privacy Rights

Regardless of your location, we respect your privacy rights:

- **Right to Access**: Request information about the personal data we hold about you
- **Right to Correction**: Request correction of inaccurate personal information
- **Right to Deletion**: Request deletion of your personal data where applicable
- **Right to Opt-Out**: Opt out of marketing communications at any time
- **Right to Complain**: Raise concerns about how we handle your data

**Data Protection**: We comply with applicable data protection laws in your jurisdiction.`;
    }

    return `# Privacy Policy

**Last updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

## 1. Introduction

${introductionSection}

We are committed to protecting your privacy and handling your personal information transparently and securely.

This Privacy Policy explains:
- What information we collect
- How we use your information
- Your rights and choices
- How we protect your data

By using ${name}, you agree to the collection and use of information in accordance with this policy.

---

## 2. Information We Collect

### Information You Provide

We collect information you directly provide to us:

- **Account Information**: Email address, name, and profile details
- **Communications**: Messages you send us, support requests, and feedback
- **Payment Information**: Processed securely through our payment processor (we do not store credit card details)

### Automatically Collected Information

When you use ${name}, we automatically collect:

- **Usage Data**: Pages visited, features used, time spent, and interaction patterns
- **Device Information**: Browser type, operating system, IP address, device identifiers
- **Location Data**: General location based on IP address (country/region level)

---

## 3. How We Use Your Information

We use the information we collect to:

- **Provide and Maintain Service**: Operate ${name} and deliver core functionality
- **Process Transactions**: Handle payments and send transaction confirmations
- **Communicate**: Send important updates, security alerts, and support messages
- **Improve Product**: Analyze usage patterns to enhance features and fix issues
- **Personalize Experience**: Customize content and recommendations based on your preferences
- **Security**: Detect and prevent fraud, abuse, and security incidents

**Legal Basis for Processing** (where applicable): We process your data based on:
- Performance of a contract with you
- Legitimate business interests
- Your consent (which you can withdraw at any time)
- Compliance with legal obligations

---

## 4. Third-Party Services

${serviceList.length > 0 ? `We work with trusted third-party service providers to operate ${name}. Each service has its own privacy policy and data handling practices.

${serviceList.map(service => {
  const details = serviceDetails[service];
  if (details) {
    return `### ${service}
- **Processes**: ${details.data}
- **Purpose**: ${details.purpose}
- **Privacy policy**: [${details.privacy}](https://${details.privacy})`;
  }
  return `### ${service}
- Third-party service integrated with ${name}`;
}).join('\n\n')}

These services process data on our behalf and are contractually obligated to protect your information.` : `**Select your tech stack in the Legal Basics section above to see detailed third-party service information here.**

We may use third-party services to operate ${name}. When we do, we ensure they meet our privacy and security standards.`}

---

## 5. Cookies and Tracking Technologies

${cookieText}

### Types of Cookies We Use

${formData.cookie_level !== 'none' ? `- **Essential Cookies**: Required for ${name} to function (authentication, security)
${formData.cookie_level === 'analytics' || formData.cookie_level === 'marketing' ? '- **Analytics Cookies**: Help us understand usage patterns and improve the product' : ''}
${formData.cookie_level === 'marketing' ? '- **Marketing Cookies**: Enable personalized content and measure campaign effectiveness' : ''}

You can control cookies through your browser settings. Note that disabling certain cookies may limit functionality.` : 'Since we do not use cookies, no cookie preferences need to be configured.'}

---

## 6. Data Retention

We retain your personal information for as long as necessary to:
- Provide our services
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements

When you delete your account, we remove or anonymize your personal data within 30 days, except where we must retain it for legal or security purposes.

---

## 7. Your Privacy Rights

You have the following rights regarding your personal data:

- **Access**: Request a copy of the personal information we hold about you
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your personal data
- **Opt-Out**: Unsubscribe from marketing communications at any time
- **Data Portability**: Receive your data in a structured, machine-readable format

To exercise these rights, contact us at ${formData.contact_email ? email : '*your@email.com*'}.${jurisdictionRights || '\n\n*Select your jurisdiction to see applicable rights*'}

---

## 8. Data Security

We implement industry-standard security measures to protect your information:

- Encryption in transit (TLS/SSL)
- Secure data storage
- Access controls and authentication
- Regular security audits
- Employee training on data protection

However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.

---

## 9. International Data Transfers

${formData.country ? `${name} is based in ${country}. If we transfer data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.` : `${name} is based in *Your country*. If we transfer data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.`}

---

## 10. Children's Privacy

${name} is not intended for users under the age of 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.

---

## 11. Changes to This Policy

We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes by:
- Posting the updated policy on our website
- Updating the "Last updated" date
- Sending an email notification for material changes

Your continued use of ${name} after changes take effect constitutes acceptance of the updated policy.

---

## 12. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:

**Email:** ${formData.contact_email ? email : '[Your contact email]'}
${formData.company_lead ? `**Data Protection Officer:** ${formData.company_lead}` : ''}

We will respond to your inquiry within 30 days.

---

*This Privacy Policy was Prepared by Annexa (Vox Animus OÜ) and should be reviewed by legal counsel before use.*${getLegalFooter()}`;
  };

  const generateTerms = () => {
    const name = formData.company_name || '*Product Name*';
    const country = formData.country || '*Country*';
    const email = formData.contact_email || '*contact email*';

    return `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

## Agreement to Terms

By accessing or using ${name}, you agree to be bound by these Terms of Service and all applicable laws and regulations.

## Use License

We grant you a non-exclusive, non-transferable, revocable license to use ${name} for its intended purposes, subject to these terms.

You may not:
- Modify or copy the materials
- Use the materials for commercial purposes without authorization
- Attempt to reverse engineer any software
- Remove any copyright or proprietary notations

## Limitations

${name} and its suppliers will not be liable for any damages arising from the use or inability to use the service, even if we have been notified of the possibility of such damages.

## Accuracy of Materials

The materials on ${name} may include technical, typographical, or photographic errors. We do not warrant that any materials are accurate, complete, or current.

## Service Modifications

We reserve the right to modify or discontinue ${name} (or any part thereof) at any time without notice.

## Termination

We may terminate or suspend your access immediately, without prior notice, for any reason, including breach of these Terms.

Upon termination, your right to use ${name} will immediately cease.

## Governing Law

These Terms shall be governed by the laws of ${formData.country ? country : '*Your country*'}, without regard to its conflict of law provisions.

## Contact Information

For questions about these Terms, contact us at: ${formData.contact_email ? email : '*your@email.com*'}

---

*Prepared by Annexa (Vox Animus OÜ)*${getLegalFooter()}`;
  };

  const generateAbout = () => {
    const name = formData.company_name || '*Product Name*';
    const description = formData.product_description || '*Tell us what your product does to complete this section*';
    const lead = formData.company_lead || '*Who runs this*';
    const email = formData.contact_email || '*contact email*';

    return `# About ${name}

## What We Do

${description}

## Our Mission

At ${name}, we're committed to delivering a product that solves real problems and creates value for our users.

## Who We Are

${name} is built and maintained by ${lead}.

## Our Values

- **Transparency**: We believe in honest, open communication
- **Quality**: We're committed to building the best possible product
- **User-First**: Your needs guide our decisions

## Get in Touch

Have questions or feedback? We'd love to hear from you.

Email: ${formData.contact_email ? email : '*your@email.com*'}

---

*Prepared by Annexa (Vox Animus OÜ)*${getLegalFooter()}`;
  };

  const generateSupport = () => {
    const name = formData.company_name || '*Product Name*';
    const email = formData.contact_email || '*contact email*';

    return `# Support

## Getting Help

Need assistance with ${name}? We're here to help.

## Contact Support

The fastest way to get help is to email us at: ${formData.contact_email ? email : '*your@email.com*'}

We typically respond within 24-48 hours during business days.

## Common Issues

**Q: How do I reset my password?**
A: Click the "Forgot Password" link on the login page and follow the instructions.

**Q: How do I update my billing information?**
A: Go to Settings > Billing to update your payment details.

**Q: How do I cancel my account?**
A: Contact us at ${formData.contact_email ? email : '*your@email.com*'} and we'll help you with the cancellation process.

## Feature Requests

Have an idea to make ${name} better? We'd love to hear it! Send your suggestions to ${formData.contact_email ? email : '*your@email.com*'}.

## Report a Bug

If you encounter a technical issue, please email us with:
- A description of the problem
- Steps to reproduce the issue
- Screenshots if applicable

We'll investigate and get back to you as soon as possible.

---

*Prepared by Annexa (Vox Animus OÜ)*${getLegalFooter()}`;
  };



  const currentCompletion = calculateCompletion(activeTab);

  const highlightText = (children, term) => {
    if (!term || typeof children !== 'string') return children;
    const parts = children.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() 
        ? <span key={i} className="bg-yellow-500/30 animate-pulse px-1 rounded">{part}</span>
        : part
    );
  };

  return (
    <div className="lg:sticky lg:top-6 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Mobile: Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="md:hidden w-full flex items-center justify-between p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-300">
          <FileText className="w-4 h-4" />
          <span className="text-base font-medium">Preview Documents</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
            {hasContent ? 'Draft' : 'Empty'}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Desktop: Always visible header */}
      <div className="hidden md:flex border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-zinc-300">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Live Preview</span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
            {hasContent ? 'Draft' : 'Empty'}
          </span>
        </div>
      </div>

      <div className={`${isExpanded ? 'block' : 'hidden md:block'}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto bg-zinc-900 border-b border-zinc-800">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto rounded-none inline-flex gap-0">
              <TabsTrigger 
                value="privacy" 
                className="data-[state=active]:bg-[#C24516]/10 data-[state=active]:text-[#C24516] data-[state=active]:border-b-2 data-[state=active]:border-[#C24516] data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-200 text-base whitespace-nowrap px-6 py-4 transition-all border-b-2 border-transparent"
              >
                <span className="hidden sm:inline">Privacy Policy</span>
                <span className="sm:hidden">Privacy</span>
                <span className="text-zinc-500 text-sm ml-2">{calculateCompletion('privacy').percentage}%</span>
              </TabsTrigger>
              <TabsTrigger 
                value="terms"
                className="data-[state=active]:bg-[#C24516]/10 data-[state=active]:text-[#C24516] data-[state=active]:border-b-2 data-[state=active]:border-[#C24516] data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-200 text-base whitespace-nowrap px-6 py-4 transition-all border-b-2 border-transparent"
              >
                <span>Terms</span>
                <span className="text-zinc-500 text-sm ml-2">{calculateCompletion('terms').percentage}%</span>
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="data-[state=active]:bg-[#C24516]/10 data-[state=active]:text-[#C24516] data-[state=active]:border-b-2 data-[state=active]:border-[#C24516] data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-200 text-base whitespace-nowrap px-6 py-4 transition-all border-b-2 border-transparent"
              >
                <span>About</span>
                <span className="text-zinc-500 text-sm ml-2">{calculateCompletion('about').percentage}%</span>
              </TabsTrigger>
              <TabsTrigger 
                value="support"
                className="data-[state=active]:bg-[#C24516]/10 data-[state=active]:text-[#C24516] data-[state=active]:border-b-2 data-[state=active]:border-[#C24516] data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-200 text-base whitespace-nowrap px-6 py-4 transition-all border-b-2 border-transparent"
              >
                <span>Support</span>
                <span className="text-zinc-500 text-sm ml-2">{calculateCompletion('support').percentage}%</span>
              </TabsTrigger>
            </TabsList>
          </div>

        <div className="px-6 sm:px-8 py-4 sm:py-6 max-h-[60vh] md:max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#C24516] [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#C24516_transparent]">
          <TabsContent value="privacy" className="mt-0 animate-in fade-in duration-200">
            <div className="max-w-[600px] mx-auto" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
              <ReactMarkdown
                components={{
                   blockquote: ({ children }) => (
                     <blockquote className="border-l-4 border-[#C24516] bg-[rgba(194,69,22,0.1)] pl-4 py-2 my-4 text-[#C24516] rounded-r" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                       {children}
                     </blockquote>
                   ),
                   h1: ({ children }) => (
                      <h1 className="text-[28px] font-bold text-white mt-0 mb-8" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{highlightedField === 'company_name' && formData.company_name ? highlightText(children, formData.company_name) : children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-[18px] font-bold text-white mt-12 mb-5" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{highlightedField === 'company_name' && formData.company_name ? highlightText(children, formData.company_name) : children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-[16px] font-semibold text-white mt-6 mb-3" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[16px] leading-[1.6] text-zinc-300 mb-4" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{highlightedField === 'company_name' && formData.company_name ? highlightText(children, formData.company_name) : children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-3 mb-6 ml-8 list-disc text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-3 mb-6 ml-8 list-decimal text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[16px] leading-[1.6] pl-2" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{highlightedField === 'company_name' && formData.company_name ? highlightText(children, formData.company_name) : children}</li>
                    ),
                   hr: () => (
                     <hr className="border-zinc-700 my-8" />
                   ),
                   strong: ({ children }) => (
                     <strong className="font-semibold text-white" style={{ fontFamily: 'inherit', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</strong>
                   ),
                   code: ({ inline, children }) => (
                     inline ? <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>{children}</code> : <code style={{ fontFamily: 'Poppins, sans-serif' }}>{children}</code>
                   ),
                 }}
               >
                 {generatePrivacyPolicy()}
              </ReactMarkdown>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('privacy', generatePrivacyPolicy())}
              className="mt-4 bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
            >
              {copiedDoc === 'privacy' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Document
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="terms" className="mt-0 animate-in fade-in duration-200">
            <div className="max-w-[600px] mx-auto" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
              <ReactMarkdown
                components={{
                   blockquote: ({ children }) => (
                     <blockquote className="border-l-4 border-[#C24516] bg-[rgba(194,69,22,0.1)] pl-4 py-2 my-4 text-[#C24516] rounded-r" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                       {children}
                     </blockquote>
                   ),
                   h1: ({ children }) => (
                     <h1 className="text-[28px] font-bold text-white mt-0 mb-8" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h1>
                   ),
                   h2: ({ children }) => (
                     <h2 className="text-[18px] font-bold text-white mt-12 mb-5" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h2>
                   ),
                   h3: ({ children }) => (
                     <h3 className="text-[16px] font-semibold text-white mt-6 mb-3" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h3>
                   ),
                   p: ({ children }) => (
                     <p className="text-[16px] leading-[1.6] text-zinc-300 mb-4" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</p>
                   ),
                   ul: ({ children }) => (
                     <ul className="space-y-3 mb-6 ml-8 list-disc text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ul>
                   ),
                   ol: ({ children }) => (
                     <ol className="space-y-3 mb-6 ml-8 list-decimal text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ol>
                   ),
                   li: ({ children }) => (
                     <li className="text-[16px] leading-[1.6] pl-2" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</li>
                   ),
                   hr: () => (
                     <hr className="border-zinc-700 my-8" />
                   ),
                   strong: ({ children }) => (
                     <strong className="font-semibold text-white" style={{ fontFamily: 'inherit', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</strong>
                   ),
                   code: ({ inline, children }) => (
                     inline ? <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>{children}</code> : <code style={{ fontFamily: 'Poppins, sans-serif' }}>{children}</code>
                   ),
                   }}
                   >
                   {generateTerms()}
              </ReactMarkdown>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('terms', generateTerms())}
              className="mt-4 bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
            >
              {copiedDoc === 'terms' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Document
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="about" className="mt-0 animate-in fade-in duration-200">
            <div className="max-w-[600px] mx-auto" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
              <ReactMarkdown
                components={{
                   blockquote: ({ children }) => (
                     <blockquote className="border-l-4 border-[#C24516] bg-[rgba(194,69,22,0.1)] pl-4 py-2 my-4 text-[#C24516] rounded-r" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                       {children}
                     </blockquote>
                   ),
                   h1: ({ children }) => (
                     <h1 className="text-[28px] font-bold text-white mt-0 mb-8" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h1>
                   ),
                   h2: ({ children }) => (
                     <h2 className="text-[18px] font-bold text-white mt-12 mb-5" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h2>
                   ),
                   h3: ({ children }) => (
                     <h3 className="text-[16px] font-semibold text-white mt-6 mb-3" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h3>
                   ),
                   p: ({ children }) => (
                     <p className="text-[16px] leading-[1.6] text-zinc-300 mb-4" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</p>
                   ),
                   ul: ({ children }) => (
                     <ul className="space-y-3 mb-6 ml-8 list-disc text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ul>
                   ),
                   ol: ({ children }) => (
                     <ol className="space-y-3 mb-6 ml-8 list-decimal text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ol>
                   ),
                   li: ({ children }) => (
                     <li className="text-[16px] leading-[1.6] pl-2" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</li>
                   ),
                   hr: () => (
                     <hr className="border-zinc-700 my-8" />
                   ),
                   strong: ({ children }) => (
                     <strong className="font-semibold text-white" style={{ fontFamily: 'inherit', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</strong>
                   ),
                   code: ({ inline, children }) => (
                     inline ? <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>{children}</code> : <code style={{ fontFamily: 'Poppins, sans-serif' }}>{children}</code>
                   ),
                 }}
               >
                 {generateAbout()}
              </ReactMarkdown>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('about', generateAbout())}
              className="mt-4 bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
            >
              {copiedDoc === 'about' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Document
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="support" className="mt-0 animate-in fade-in duration-200">
            <div className="max-w-[600px] mx-auto" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
              <ReactMarkdown
                components={{
                   blockquote: ({ children }) => (
                     <blockquote className="border-l-4 border-[#C24516] bg-[rgba(194,69,22,0.1)] pl-4 py-2 my-4 text-[#C24516] rounded-r" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                       {children}
                     </blockquote>
                   ),
                   h1: ({ children }) => (
                     <h1 className="text-[28px] font-bold text-white mt-0 mb-8" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h1>
                   ),
                   h2: ({ children }) => (
                     <h2 className="text-[18px] font-bold text-white mt-12 mb-5" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h2>
                   ),
                   h3: ({ children }) => (
                     <h3 className="text-[16px] font-semibold text-white mt-6 mb-3" style={{ fontFamily: 'Caudex, serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</h3>
                   ),
                   p: ({ children }) => (
                     <p className="text-[16px] leading-[1.6] text-zinc-300 mb-4" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</p>
                   ),
                   ul: ({ children }) => (
                     <ul className="space-y-3 mb-6 ml-8 list-disc text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ul>
                   ),
                   ol: ({ children }) => (
                     <ol className="space-y-3 mb-6 ml-8 list-decimal text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</ol>
                   ),
                   li: ({ children }) => (
                     <li className="text-[16px] leading-[1.6] pl-2" style={{ fontFamily: 'Poppins, sans-serif', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{children}</li>
                   ),
                   hr: () => (
                     <hr className="border-zinc-700 my-8" />
                   ),
                   strong: ({ children }) => (
                     <strong className="font-semibold text-white" style={{ fontFamily: 'inherit', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{children}</strong>
                   ),
                   code: ({ inline, children }) => (
                     inline ? <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>{children}</code> : <code style={{ fontFamily: 'Poppins, sans-serif' }}>{children}</code>
                   ),
                 }}
               >
                 {generateSupport()}
              </ReactMarkdown>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy('support', generateSupport())}
              className="mt-4 bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
            >
              {copiedDoc === 'support' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Document
                </>
              )}
            </Button>
          </TabsContent>
        </div>
        </Tabs>
      </div>
    </div>
  );
}
