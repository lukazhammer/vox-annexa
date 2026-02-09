import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { documents, productName, withWatermark } = await req.json();

    if (!documents || !productName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    const addFooter = () => {
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      const footerText = 'Prepared by Annexa • Template v1.2.3 • Review recommended';
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    const addText = (text, fontSize = 10) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (y > pageHeight - 30) {
          addFooter();
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      });
    };

    // Add cover page
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text('Prepared by', pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(36);
    doc.setTextColor(194, 69, 22); // #C24516
    doc.text('ANNEXA', pageWidth / 2, 55, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Provided by Vox Animus', pageWidth / 2, 65, { align: 'center' });
    
    // Product info
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${productName} Legal Documents`, pageWidth / 2, 85, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Prepared: ${currentDate}`, pageWidth / 2, 95, { align: 'center' });
    doc.text('Template Version: 1.2.3', pageWidth / 2, 102, { align: 'center' });
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 115, pageWidth - margin, 115);
    
    // What you have section
    y = 130;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('What you have:', margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const intro = doc.splitTextToSize("These are professional templates based on standard industry practices. They're ready to use as starting points for your business.", maxWidth);
    intro.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    
    // Recommended next step
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Recommended next step:', margin, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const nextStep = doc.splitTextToSize("Have a lawyer review these documents before publishing them. They can customize for your specific business and ensure they meet all requirements in your jurisdiction.", maxWidth);
    nextStep.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    
    y += 5;
    const cost = doc.splitTextToSize("Most founders spend $200-400 on legal review through services like Rocket Lawyer, LegalZoom, or local attorneys.", maxWidth);
    cost.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    
    // Bottom disclaimer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Annexa provides templates, not legal advice.', pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.text('Vox Animus OU is not a law firm.', pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    addFooter();

    // Document order
    const docOrder = ['Privacy Policy', 'Terms of Use', 'Cookie Policy', 'About Us'];

    docOrder.forEach((docName, index) => {
      if (documents[docName]) {
        addFooter();
        doc.addPage();
        y = margin;

        // Title
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text(docName, margin, y);
        y += 15;

        // Content
        addText(documents[docName], 10);
      }
    });

    // Add footer to last page
    addFooter();

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="launch-kit-${productName.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
