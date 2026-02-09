import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, productName, downloadLink, receiptLink } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `Annexa EDGE - You're All Set`,
      body: `Hi there,

Thanks for upgrading to Annexa EDGE!

Receipt: $29.00${receiptLink ? ` - Download receipt: ${receiptLink}` : ''}

Your EDGE package is ready:
- All documents (no watermark)
- Social media bios (Twitter, LinkedIn, Product Hunt)
- Welcome email templates
- Press kit
- Markdown exports

${downloadLink ? `Download your EDGE package:\n${downloadLink}\n\n` : ''}─────────────────

Remember: Get these reviewed by a lawyer before going live. It's what the pros do.

Questions? Reply anytime.

Best,
The Annexa Team

─────────────────────────────────────────────

Annexa by Vox Animus OÜ
Tallinn, Estonia

These are professional templates. Most founders have 
them reviewed by a lawyer before going live.`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
