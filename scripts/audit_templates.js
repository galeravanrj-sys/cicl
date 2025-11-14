/*
  Audits template placeholders/fields so we can align exporter mappings.
  - PDF: lists AcroForm field names from public/template/GENERAL_INTAKEFORM_ASILO.pdf
  - DOCX: lists Docxtemplater-style tags {{...}} from word/*.xml inside GENERAL_INTAKEFORM_ASILO.docx
  - CSV: lists {{...}} placeholders from both GENERAL_INTAKEFORM_ASILO.csv and CICL_All_Cases_List.csv
*/

const fs = require('fs');
const path = require('path');

async function auditPDF(pdfPath) {
  try {
    const { PDFDocument } = require('pdf-lib');
    const ab = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(ab);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    const names = fields.map((f) => f.getName());
    console.log(`\nPDF fields in ${pdfPath}:`);
    if (!names.length) console.log('  (no AcroForm fields found)');
    else names.forEach((n) => console.log(`  - ${n}`));
  } catch (e) {
    console.log(`\nPDF audit failed for ${pdfPath}:`, e.message || e);
  }
}

function auditDocx(docxPath) {
  try {
    const PizZip = require('pizzip');
    const buf = fs.readFileSync(docxPath);
    const zip = new PizZip(buf);
    const files = zip.files || {};
    const xmlPaths = Object.keys(files).filter((p) => /^(word\/document\.xml|word\/header\d+\.xml|word\/footer\d+\.xml)$/i.test(p));
    const tagSet = new Set();
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
    for (const p of xmlPaths) {
      const xml = zip.file(p).asText();
      let m;
      while ((m = re.exec(xml)) !== null) tagSet.add(m[1]);
    }
    console.log(`\nDOCX tags in ${docxPath}:`);
    if (!tagSet.size) console.log('  (no {{tags}} found in document/header/footer xml)');
    else [...tagSet].forEach((t) => console.log(`  - ${t}`));
  } catch (e) {
    console.log(`\nDOCX audit failed for ${docxPath}:`, e.message || e);
  }
}

function auditCSV(csvPath) {
  try {
    const text = fs.readFileSync(csvPath, 'utf8');
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
    const tags = new Set();
    let m;
    while ((m = re.exec(text)) !== null) tags.add(m[1]);
    console.log(`\nCSV tags in ${csvPath}:`);
    if (!tags.size) console.log('  (no {{tags}} found)');
    else [...tags].forEach((t) => console.log(`  - ${t}`));
  } catch (e) {
    console.log(`\nCSV audit failed for ${csvPath}:`, e.message || e);
  }
}

async function main() {
  const tplDir = path.join(process.cwd(), 'public', 'template');
  const pdf = path.join(tplDir, 'GENERAL_INTAKEFORM_ASILO.pdf');
  const docx = path.join(tplDir, 'GENERAL_INTAKEFORM_ASILO.docx');
  const csv1 = path.join(tplDir, 'GENERAL_INTAKEFORM_ASILO.csv');
  const csv2 = path.join(tplDir, 'CICL_All_Cases_List.csv');

  console.log('Template audit starting...');
  if (fs.existsSync(pdf)) await auditPDF(pdf); else console.log(`\nMissing PDF: ${pdf}`);
  if (fs.existsSync(docx)) auditDocx(docx); else console.log(`\nMissing DOCX: ${docx}`);
  if (fs.existsSync(csv1)) auditCSV(csv1); else console.log(`\nMissing CSV: ${csv1}`);
  if (fs.existsSync(csv2)) auditCSV(csv2); else console.log(`\nMissing CSV: ${csv2}`);
  console.log('\nTemplate audit complete.');
}

main();