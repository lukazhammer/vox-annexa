import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const found = [];
    const missing = [];
    const prefilled = {};

    // Check for common files
    const filesToCheck = [
      'robots.txt',
      'sitemap.xml',
      'privacy-policy',
      'terms',
      'about',
      'cookie-policy'
    ];

    const checkPromises = filesToCheck.map(async (file) => {
      try {
        const checkUrl = file.includes('.') 
          ? `${normalizedUrl}/${file}`
          : `${normalizedUrl}/${file}`;
        
        const response = await fetch(checkUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
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

    // Try to fetch homepage and extract basic info
    try {
      const homeResponse = await fetch(normalizedUrl, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (homeResponse.ok) {
        const html = await homeResponse.text();
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          prefilled.company_name = titleMatch[1].replace(/[-|]/g, '').trim();
        }

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch) {
          prefilled.product_description = descMatch[1];
        }

        // Try to find email
        const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          prefilled.contact_email = emailMatch[0];
        }
      }
    } catch (err) {
      // Non-critical error - homepage fetch failed, continue with other data
    }

    return Response.json({
      found,
      missing,
      prefilled,
      url: normalizedUrl
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});