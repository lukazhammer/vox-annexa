import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, productName, upgradeLink } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `Upgrade Your Annexa Documents`,
      body: `Hi there,

You generated your Annexa documents${productName ? ` for ${productName}` : ''} a week ago. Ready to take them to the next level?

EDGE ($19 one-time) includes:
- Social bios ready to paste
- Press kit for media
- Email templates
- Remove watermarks
- Markdown exports

${upgradeLink ? `Upgrade to EDGE:\n${upgradeLink}\n\n` : ''}Already had them reviewed by a lawyer? Great! These EDGE additions will round out your launch.

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
