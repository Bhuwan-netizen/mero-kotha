const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Path configurations
const guideTextPath = path.join(__dirname, 'guide_content.txt');
const outputPath = path.join(__dirname, 'Mero_Kotha_Developers_Guide.pdf');

// Function to generate PDF
const generatePDF = () => {
  if (!fs.existsSync(guideTextPath)) {
    console.error('Error: guide_content.txt not found. Please create it first.');
    process.exit(1);
  }

  const content = fs.readFileSync(guideTextPath, 'utf8');
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true
  });

  // Write to file stream
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Styling Constants
  const colors = {
    primary: '#A51D24',     // Crimson
    primaryDark: '#7D1419', // Dark Crimson
    text: '#1E293B',        // Slate Dark
    textMuted: '#64748B',   // Gray
    bgCode: '#F8FAFC',      // Slate Light
    borderCode: '#E2E8F0',  // Border Gray
    accent: '#D4AF37'       // Gold
  };

  // Helper: Draw Header
  const drawHeader = (pageNumber) => {
    if (pageNumber === 1) return; // Skip cover page
    doc.save();
    doc.fontSize(8).fillColor(colors.textMuted).font('Helvetica-Oblique');
    doc.text('Mero Kotha — Complete Developer Reference Guide', 50, 25);
    doc.moveTo(50, 35).lineTo(545, 35).strokeColor(colors.borderCode).lineWidth(0.5).stroke();
    doc.restore();
  };

  // Helper: Draw Footer
  const drawFooter = (pageNumber, totalPages) => {
    if (pageNumber === 1) return; // Skip cover page
    doc.save();
    doc.fontSize(8).fillColor(colors.textMuted).font('Helvetica');
    doc.moveTo(50, 800).lineTo(545, 800).strokeColor(colors.borderCode).lineWidth(0.5).stroke();
    doc.text(`Page ${pageNumber} of ${totalPages}`, 50, 810, { align: 'right', width: 495 });
    doc.text('Developed for Birtamode, Jhapa, Nepal • Developer Support: 9815810188', 50, 810, { align: 'left', width: 350 });
    doc.restore();
  };

  // ---------------- COVER PAGE ----------------
  doc.rect(0, 0, 595, 842).fill('#FBFBFA'); // Creamy cover background
  
  // Crimson side bar
  doc.rect(0, 0, 30, 842).fill(colors.primary);
  doc.rect(30, 0, 10, 842).fill(colors.accent);

  doc.fillColor(colors.primaryDark).font('Helvetica-Bold').fontSize(38);
  doc.text('MERO KOTHA', 70, 220);
  
  doc.fillColor(colors.text).font('Helvetica').fontSize(18);
  doc.text('The Complete Developer\'s Guide', 70, 265);
  doc.text('Every Line of Code, Syntax, and Command Explained', 70, 290, { width: 450 });

  doc.moveTo(70, 330).lineTo(450, 330).strokeColor(colors.accent).lineWidth(3).stroke();

  doc.fillColor(colors.textMuted).font('Helvetica').fontSize(11);
  doc.text('A comprehensive reference manual detailing the MERN-stack architecture, database models, file upload parameters, CSS design systems, and payment structures of the Mero Kotha Birtamode rental portal.', 70, 360, { width: 420, lineGap: 4 });

  doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12);
  doc.text('TARGET AUDIENCE: Developer Community & Public Launch Reference', 70, 580);
  
  doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(10);
  doc.text('Author: Antigravity AI (Pair Programming)', 70, 620);
  doc.text('Locality: Birtamode, Jhapa, Nepal', 70, 635);
  doc.text('Developer eSewa Support ID: 9815810188', 70, 650);
  doc.text(`Date of Compilation: June 12, 2026`, 70, 665);

  doc.addPage();

  // ---------------- PROCESSING CONTENT ----------------
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render code block box
        inCodeBlock = false;
        doc.save();
        
        const codeText = codeLines.join('\n');
        doc.font('Courier').fontSize(8.5).fillColor('#0F172A');
        
        // Calculate box height
        const height = doc.heightOfString(codeText, { width: 475, lineGap: 2.5 }) + 20;
        
        // Check if box fits on current page, if not, add page
        if (doc.y + height > 780) {
          doc.addPage();
        }

        const startY = doc.y;
        doc.rect(50, startY, 495, height).fill(colors.bgCode);
        doc.rect(50, startY, 495, height).strokeColor(colors.borderCode).lineWidth(1).stroke();
        
        doc.text(codeText, 60, startY + 10, { width: 475, lineGap: 2.5 });
        doc.y = startY + height + 15; // Move cursor past the box
        doc.restore();
        codeLines = [];
      } else {
        // Start of code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Process normal markup lines
    if (line.startsWith('# ')) {
      // H1 (Page Break unless first H1)
      const h1Text = line.substring(2);
      if (doc.y > 60) {
        doc.addPage();
      }
      doc.fillColor(colors.primaryDark).font('Helvetica-Bold').fontSize(20);
      doc.text(h1Text, 50, doc.y, { paragraphGap: 10 });
      doc.moveTo(50, doc.y - 5).lineTo(545, doc.y - 5).strokeColor(colors.accent).lineWidth(1.5).stroke();
      doc.y += 10;
    } else if (line.startsWith('## ')) {
      // H2
      const h2Text = line.substring(3);
      if (doc.y > 700) doc.addPage();
      doc.y += 10;
      doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(14);
      doc.text(h2Text, 50, doc.y, { paragraphGap: 8 });
    } else if (line.startsWith('### ')) {
      // H3
      const h3Text = line.substring(4);
      if (doc.y > 720) doc.addPage();
      doc.y += 5;
      doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(11);
      doc.text(h3Text, 50, doc.y, { paragraphGap: 6 });
    } else if (line.startsWith('* ')) {
      // Bullet list
      const bulletText = line.substring(2);
      if (doc.y > 750) doc.addPage();
      doc.fillColor(colors.text).font('Helvetica').fontSize(9.5);
      doc.text('•', 55, doc.y, { continued: true });
      doc.text(`  ${bulletText}`, 65, doc.y, { width: 480, paragraphGap: 4, lineGap: 2 });
    } else if (line.trim() === '') {
      // Empty line - add space
      doc.y += 6;
    } else {
      // Normal Paragraph
      if (doc.y > 740) doc.addPage();
      doc.fillColor(colors.text).font('Helvetica').fontSize(9.5);
      doc.text(line, 50, doc.y, { width: 495, paragraphGap: 8, lineGap: 3, align: 'justify' });
    }
  }

  // ---------------- PAGINATION HEADERS/FOOTERS ----------------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pageNum = i + 1;
    drawHeader(pageNum);
    drawFooter(pageNum, range.count);
  }

  // End and output PDF
  doc.end();
  console.log(`Success: PDF document created at ${outputPath}`);
};

generatePDF();
