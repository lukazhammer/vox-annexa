import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { documents, productName, contactEmail, withWatermark, marketingOptIn = false } = await req.json();

    if (!documents || !productName || !contactEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    const addWatermark = () => {
      if (withWatermark) {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated with Annexa by Vox Animus', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    };

    const addText = (text, fontSize = 10) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (y > pageHeight - 30) {
          addWatermark();
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      });
    };

    const docOrder = ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'About Us'];

    docOrder.forEach((docName, index) => {
      if (documents[docName]) {
        if (index > 0) {
          addWatermark();
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text(docName, margin, y);
        y += 15;

        addText(documents[docName], 10);
      }
    });

    addWatermark();

    const pdfBase64 = doc.output('dataurlstring').split(',')[1];

    // Upload PDF to get a URL
    const pdfBlob = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const file = new File([pdfBlob], `annexa-${productName}.pdf`, { type: 'application/pdf' });
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Annexa',
      to: contactEmail,
      subject: `Your Annexa Documents Are Ready`,
      body: `Hi there,

Your documents have been generated and are ready to download.

What's included:
- Privacy Policy
- Terms of Service
- About Page
- Support Documentation

Download your documents here:
${file_url}

─────────────────

Next step: Most founders have these reviewed by a lawyer before publishing. Services like Rocket Lawyer or LegalZoom typically cost $200-400 for review.

Questions? Just reply to this email.

Best,
The Annexa Team

Marketing updates: ${marketingOptIn ? 'Opted in' : 'Not opted in'}

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
