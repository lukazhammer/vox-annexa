import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const USER_AGENT = 'Annexa-Bot/1.0 (Legal Document Generator; +https://annexa.app)';

function extractBusinessName(html: string): string {
  // Try og:site_name
  const ogMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1].trim();

  // Try title, strip common suffixes
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].split(/[-|–—]/)[0].trim();
  }

  // Try first h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  return '';
}

function extractDescription(html: string): string {
  // Try meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) return descMatch[1].trim();

  // Try og:description
  const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1].trim();

  return '';
}

function extractEmail(html: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex);
  if (!matches) return '';

  // Filter out common placeholder/system emails
  const filtered = matches.filter(email =>
    !email.includes('example.com') &&
    !email.includes('test.com') &&
    !email.includes('noreply') &&
    !email.includes('wixpress') &&
    !email.includes('sentry.io') &&
    !email.includes('schema.org') &&
    !email.endsWith('.png') &&
    !email.endsWith('.jpg')
  );

  return filtered[0] || '';
}

function extractPhone(html: string): string {
  // International phone patterns
  const phoneRegex = /(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
  const matches = html.match(phoneRegex);
  if (!matches) return '';

  // Filter out numbers that are too short or clearly not phone numbers
  const filtered = matches.filter(p => p.replace(/\D/g, '').length >= 7);
  return filtered[0] || '';
}

function extractAddress(html: string): Record<string, string> {
  const address: Record<string, string> = {};

  // Schema.org structured data
  const streetMatch = html.match(/["']streetAddress["']\s*:\s*["']([^"']+)["']/);
  if (streetMatch) address.street = streetMatch[1];

  const cityMatch = html.match(/["']addressLocality["']\s*:\s*["']([^"']+)["']/);
  if (cityMatch) address.city = cityMatch[1];

  const countryMatch = html.match(/["']addressCountry["']\s*:\s*["']([^"']+)["']/);
  if (countryMatch) address.country = countryMatch[1];

  const postalMatch = html.match(/["']postalCode["']\s*:\s*["']([^"']+)["']/);
  if (postalMatch) address.postalCode = postalMatch[1];

  return address;
}

function detectThirdPartyServices(html: string): string[] {
  const services: string[] = [];

  const servicePatterns: Record<string, RegExp> = {
    'Google Analytics': /google-analytics\.com|gtag|googletagmanager|ga\.js|analytics\.js/i,
    'Facebook Pixel': /facebook\.net\/.*fbevents|fbq\(|connect\.facebook/i,
    'Stripe': /js\.stripe\.com/i,
    'Mailchimp': /mailchimp\.com|list-manage\.com/i,
    'HubSpot': /hubspot\.com|hs-scripts/i,
    'Intercom': /intercom\.io|intercomcdn/i,
    'Hotjar': /hotjar\.com|static\.hotjar/i,
    'Crisp': /crisp\.chat/i,
    'Segment': /cdn\.segment\.com|segment\.io/i,
    'Mixpanel': /mixpanel\.com/i,
    'Sentry': /sentry\.io|browser\.sentry/i,
    'Google Tag Manager': /googletagmanager\.com/i,
    'Google Ads': /googleadservices\.com|googlesyndication/i,
    'LinkedIn Insight': /snap\.licdn\.com|linkedin\.com\/px/i,
    'Twitter Pixel': /static\.ads-twitter\.com|t\.co\/i/i,
    'TikTok Pixel': /analytics\.tiktok\.com/i,
    'Cloudflare': /cdnjs\.cloudflare\.com|cloudflare-static/i,
    'Zendesk': /zendesk\.com|zdassets/i,
    'Drift': /drift\.com|js\.driftt/i,
    'PayPal': /paypal\.com\/sdk/i,
  };

  for (const [name, pattern] of Object.entries(servicePatterns)) {
    if (pattern.test(html)) {
      services.push(name);
    }
  }

  return services;
}

function detectCookieConsent(html: string): boolean {
  const indicators = [
    'cookie-consent', 'cookie-banner', 'cookie-notice',
    'gdpr-consent', 'cookiebot', 'onetrust',
    'cookie_consent', 'CookieConsent', 'cc-banner',
    'cookie-law', 'eu-cookie', 'osano',
  ];
  const htmlLower = html.toLowerCase();
  return indicators.some(i => htmlLower.includes(i));
}

function detectEmailCollection(html: string): boolean {
  return /type=["']email["']/i.test(html);
}

function detectNewsletterSignup(html: string): boolean {
  const htmlLower = html.toLowerCase();
  return htmlLower.includes('newsletter') ||
    htmlLower.includes('subscribe') ||
    htmlLower.includes('mailing list') ||
    htmlLower.includes('email updates');
}

function detectAnalytics(html: string): boolean {
  const patterns = [
    'google-analytics', 'gtag(', 'ga.js', 'analytics.js',
    'plausible', 'matomo', 'mixpanel', 'segment', 'hotjar',
    'googletagmanager',
  ];
  return patterns.some(p => html.includes(p));
}

function detectPlatform(html: string): string {
  const platforms: Record<string, RegExp> = {
    'WordPress': /wp-content|wp-includes|wordpress/i,
    'Shopify': /cdn\.shopify\.com|shopify-section/i,
    'Wix': /wix\.com|wixstatic/i,
    'Squarespace': /squarespace\.com|sqsp\.com/i,
    'Webflow': /webflow\.com|assets\.website-files/i,
    'Next.js': /__next|_next\/static/i,
    'Gatsby': /gatsby/i,
    'Framer': /framerusercontent\.com|framer\.com/i,
    'Ghost': /ghost\.org|ghost\.io/i,
    'Drupal': /drupal\.org|sites\/default\/files/i,
  };

  for (const [name, pattern] of Object.entries(platforms)) {
    if (pattern.test(html)) return name;
  }

  return 'Custom';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    // Remove trailing slash for consistency
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    const found: string[] = [];
    const missing: string[] = [];
    const prefilled: Record<string, unknown> = {};

    // Check for common files
    const filesToCheck = [
      'robots.txt',
      'sitemap.xml',
      'privacy-policy',
      'privacy',
      'terms',
      'terms-of-service',
      'about',
      'cookie-policy',
      'cookies',
      'imprint',
      'impressum',
    ];

    const checkPromises = filesToCheck.map(async (file) => {
      try {
        const checkUrl = `${normalizedUrl}/${file}`;
        const response = await fetch(checkUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          found.push(file);
        } else {
          missing.push(file);
        }
      } catch {
        missing.push(file);
      }
    });

    await Promise.allSettled(checkPromises);

    // Determine which legal pages exist
    const hasPrivacyPolicy = found.some(f => f.includes('privacy'));
    const hasTermsOfService = found.some(f => f.includes('terms'));
    const hasCookiePolicy = found.some(f => f.includes('cookie'));

    // Fetch and parse homepage
    let html = '';
    try {
      const homeResponse = await fetch(normalizedUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });

      if (homeResponse.ok) {
        html = await homeResponse.text();

        // Extract business information
        const businessName = extractBusinessName(html);
        if (businessName) prefilled.company_name = businessName;

        const description = extractDescription(html);
        if (description) prefilled.product_description = description;

        const email = extractEmail(html);
        if (email) prefilled.contact_email = email;

        const phone = extractPhone(html);
        if (phone) prefilled.phone = phone;

        const address = extractAddress(html);
        if (Object.keys(address).length > 0) {
          prefilled.address = address;
          if (address.country) prefilled.country = address.country;
        }

        // Detect data collection practices
        const thirdPartyServices = detectThirdPartyServices(html);
        if (thirdPartyServices.length > 0) {
          prefilled.thirdPartyServices = thirdPartyServices;
          // Build services_used string from detected services
          prefilled.services_used = thirdPartyServices.join(', ');
        }

        prefilled.collectsEmails = detectEmailCollection(html);
        prefilled.hasContactForm = /<form[^>]*>/i.test(html);
        prefilled.hasNewsletter = detectNewsletterSignup(html);
        prefilled.usesAnalytics = detectAnalytics(html);
        prefilled.hasCookieConsent = detectCookieConsent(html);

        // Detect platform
        prefilled.platform = detectPlatform(html);

        // Determine cookie level based on detected services
        if (thirdPartyServices.some(s =>
          s.includes('Facebook') || s.includes('Google Ads') ||
          s.includes('LinkedIn') || s.includes('Twitter') || s.includes('TikTok')
        )) {
          prefilled.cookie_level = 'marketing';
        } else if (thirdPartyServices.some(s =>
          s.includes('Analytics') || s.includes('Hotjar') ||
          s.includes('Mixpanel') || s.includes('Segment')
        )) {
          prefilled.cookie_level = 'analytics';
        } else {
          prefilled.cookie_level = 'essential';
        }
      }
    } catch {
      // Homepage fetch failed, continue with file detection results
    }

    // Compliance summary
    prefilled.hasPrivacyPolicy = hasPrivacyPolicy;
    prefilled.hasTermsOfService = hasTermsOfService;
    prefilled.hasCookiePolicy = hasCookiePolicy;
    prefilled.hasSSL = normalizedUrl.startsWith('https://');

    return Response.json({
      success: true,
      found,
      missing,
      prefilled,
      url: normalizedUrl,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
