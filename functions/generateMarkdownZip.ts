import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { documents, productName, socialBios } = await req.json();

    if (!documents || !productName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const zip = new JSZip();

    // Add markdown documents
    const docOrder = ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'About Us'];
    docOrder.forEach(docName => {
      if (documents[docName]) {
        const filename = docName.toLowerCase().replace(/\s+/g, '-') + '.md';
        zip.file(filename, documents[docName]);
      }
    });

    // Add other files if they exist
    if (documents['robots.txt']) {
      zip.file('robots.txt', documents['robots.txt']);
    }
    if (documents['sitemap.xml']) {
      zip.file('sitemap.xml', documents['sitemap.xml']);
    }
    if (documents['llms.txt']) {
      zip.file('llms.txt', documents['llms.txt']);
    }
    if (documents['brand-schema.json']) {
      zip.file('brand-schema.json', documents['brand-schema.json']);
    }

    // Add social bios if provided
    if (socialBios) {
      let biosContent = '# Social Media Bios\n\n';
      biosContent += `## Twitter Bio (160 chars)\n${socialBios.twitter}\n\n`;
      biosContent += `## LinkedIn About (220 chars)\n${socialBios.linkedin}\n\n`;
      biosContent += `## Product Hunt Tagline (60 chars)\n${socialBios.phTagline}\n\n`;
      biosContent += `## Product Hunt Description (260 chars)\n${socialBios.phDescription}\n`;
      
      zip.file('social-bios.txt', biosContent);
    }

    const zipBlob = await zip.generateAsync({ type: 'uint8array' });

    return new Response(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="launch-kit-edge-${productName.toLowerCase().replace(/\s+/g, '-')}.zip"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
