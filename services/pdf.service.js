const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

function formatCurrency(amount, currency) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(amount || 0);
  } catch {
    return `${amount || 0} ${currency || 'EUR'}`;
  }
}

function getClauseText(clause) {
  switch (clause) {
    case 'confidentialite':
      return 'Confidentiality clause: Both parties agree to keep all information exchanged as part of this engagement strictly confidential.';
    case 'resiliation':
      return 'Termination clause: This agreement may be terminated by either party with a notice period of 30 days.';
    case 'propriete':
      return 'Intellectual property clause: Deliverables remain the property of the provider until full payment has been received.';
    default:
      return `Clause: ${clause}`;
  }
}

/**
 * Génère un contrat PDF
 */
async function generateContractPDF(contractData, userPlan) {
  const pdfDoc = await PDFDocument.create();
  const A4 = [595.28, 841.89];
  let page = pdfDoc.addPage(A4);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;
  let pageNumber = 1;

  function wrapText(text, currentFont, fontSize, maxWidth) {
    const words = (text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const testLine = line ? `${line} ${word}` : word;
      const widthTest = currentFont.widthOfTextAtSize(testLine, fontSize);
      if (widthTest > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function ensureSpace(blockHeight) {
    if (y - blockHeight < margin + 40) {
      addFooter();
      page = pdfDoc.addPage(A4);
      pageNumber += 1;
      y = height - margin;
      addHeader();
    }
  }

  function addHeader() {
    const title = 'SERVICE AGREEMENT';
    const size = 16;
    const textWidth = boldFont.widthOfTextAtSize(title, size);
    page.drawText(title, {
      x: (width - textWidth) / 2,
      y: y,
      size,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    y -= 24;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 16;
  }

  function addFooter() {
    const footerY = margin - 10;
    page.drawLine({ start: { x: margin, y: footerY + 20 }, end: { x: width - margin, y: footerY + 20 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
    page.drawText(`Page ${pageNumber}`, { x: width - margin - 60, y: footerY, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
  }

  function addSection(title, contentLines) {
    const titleSize = 13;
    const bodySize = 10;
    const lineGap = 5;
    const blockHeightEstimate = 22 + contentLines.length * (bodySize + lineGap);
    ensureSpace(blockHeightEstimate);
    page.drawText(title, { x: margin, y, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });
    y -= 12;
    contentLines.forEach(line => {
      const wrapped = wrapText(line, font, bodySize, contentWidth);
      wrapped.forEach(wLine => {
        page.drawText(wLine, { x: margin, y, size: bodySize, font, color: rgb(0, 0, 0) });
        y -= bodySize + lineGap;
        ensureSpace(bodySize + lineGap);
      });
    });
    y -= 8;
  }

  addHeader();

  const prestataire = contractData.prestataire || {};
  const client = contractData.client || {};

  addSection('PROVIDER', [
    `Name: ${prestataire.nom || ''}`,
    `Email: ${prestataire.email || ''}`,
    `Address: ${prestataire.adresse || ''}`,
    `SIRET: ${prestataire.siret || ''}`,
  ]);

  addSection('CLIENT', [
    `Name: ${client.nom || ''}`,
    `Email: ${client.email || ''}`,
    `Address: ${client.adresse || ''}`,
  ]);

  addSection('SCOPE OF WORK', [
    contractData.mission || ''
  ]);

  addSection('PRICING', [
    `Amount: ${formatCurrency(contractData.price, contractData.currency)}`
  ]);

  if (contractData.clauses && contractData.clauses.length > 0) {
    const clausesText = contractData.clauses.map(getClauseText);
    addSection('SPECIFIC CLAUSES', clausesText);
  }

  // Signatures
  ensureSpace(120);
  page.drawText('SIGNATURES', { x: margin, y, size: 13, font: boldFont, color: rgb(0, 0, 0) });
  y -= 24;
  page.drawText('Provider', { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText('Client', { x: width / 2, y, size: 10, font, color: rgb(0, 0, 0) });
  y -= 40;
  page.drawText('_____________________________', { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText('_____________________________', { x: width / 2, y, size: 10, font, color: rgb(0, 0, 0) });

  if (userPlan === 'basic') {
    page.drawText('DEMO - BASIC PLAN', {
      x: width / 2 - 100,
      y: height / 2,
      size: 30,
      font: boldFont,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3,
      rotate: degrees(-45)
    });
  }

  addFooter();
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Génère un PDF à partir d'un template HTML (version alternative)
 */
async function generateHTMLTemplate(contractData, userPlan) {
  const prestataire = contractData.prestataire || {};
  const client = contractData.client || {};
  
  let clausesHTML = '';
  if (contractData.clauses && contractData.clauses.length > 0) {
    contractData.clauses.forEach(clause => {
      const clauseText = getClauseText(clause);
      clausesHTML += `<p style="margin-bottom: 5px;">${clauseText}</p>`;
    });
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contract Preview</title>
  <style>
    body {
      background-color: #525659;
      font-family: Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .page {
      background-color: white;
      width: 595px; /* A4 width at 72 PPI approx */
      min-height: 842px; /* A4 height */
      padding: 50px; /* Matching PDF margin */
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      position: relative;
      box-sizing: border-box;
    }
    h1 { 
      text-align: center; 
      font-size: 16pt;
      margin-top: 0;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .header-line {
      border-bottom: 1px solid #ccc;
      margin-bottom: 16px;
    }
    h2 { 
      font-size: 13pt;
      margin-top: 20px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    p, li {
      font-size: 10pt;
      line-height: 1.4;
      margin: 0 0 5px 0;
    }
    .section { margin-bottom: 15px; }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .signature-block {
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid black;
      margin-top: 40px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 60px;
      color: rgba(200, 200, 200, 0.3);
      z-index: 100;
      font-weight: bold;
      pointer-events: none;
      white-space: nowrap;
    }
    .footer {
      position: absolute;
      bottom: 50px;
      left: 50px;
      right: 50px;
      border-top: 1px solid #eee;
      padding-top: 10px;
      font-size: 10pt;
      color: #888;
      display: flex;
      justify-content: flex-end;
    }
  </style>
</head>
<body>
  <div class="page">
    ${userPlan === 'basic' ? '<div class="watermark">DEMO - BASIC PLAN</div>' : ''}
    
    <h1>SERVICE AGREEMENT</h1>
    <div class="header-line"></div>
    
    <div class="section">
      <h2>PROVIDER</h2>
      <p>Name: ${prestataire.nom || ''}</p>
      <p>Email: ${prestataire.email || ''}</p>
      <p>Address: ${prestataire.adresse || ''}</p>
      <p>SIRET: ${prestataire.siret || ''}</p>
    </div>
    
    <div class="section">
      <h2>CLIENT</h2>
      <p>Name: ${client.nom || ''}</p>
      <p>Email: ${client.email || ''}</p>
      <p>Address: ${client.adresse || ''}</p>
    </div>
    
    <div class="section">
      <h2>SCOPE OF WORK</h2>
      <p>${contractData.mission || ''}</p>
    </div>
    
    <div class="section">
      <h2>PRICING</h2>
      <p>Amount: ${formatCurrency(contractData.price, contractData.currency)}</p>
    </div>
    
    ${clausesHTML ? `<div class="section"><h2>SPECIFIC CLAUSES</h2>${clausesHTML}</div>` : ''}
    
    <div class="signatures">
      <div class="signature-block">
        <h2 style="font-size: 13pt; margin-bottom: 24px;">SIGNATURES</h2>
        <p>Provider</p>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <h2 style="font-size: 13pt; margin-bottom: 24px; visibility: hidden;">SIGNATURES</h2>
        <p>Client</p>
        <div class="signature-line"></div>
      </div>
    </div>

    <div class="footer">
      Page 1
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  generateContractPDF,
  generateHTMLTemplate
};
