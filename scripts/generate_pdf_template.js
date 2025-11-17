// Generates a fillable PDF template with fields matching our case data keys
// Output: public/template/GENERAL_INTAKEFORM_ASILO.pdf

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'template');
  const baseFile = path.join(outDir, 'GENERAL_INTAKEFORM_ASILO.pdf');
  const outFile = path.join(outDir, 'GENERAL_INTAKEFORM_ASILO_fillable.pdf');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const baseBytes = fs.readFileSync(baseFile);
  const pdfDoc = await PDFDocument.load(baseBytes);
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPage(0);
  const addText = (name, x, y, w = 250, h = 18) => {
    const tf = form.createTextField(name);
    tf.addToPage(page, { x, y, width: w, height: h });
  };

  let y = 700;
  const leftX = 60;
  const rightX = 330;

  const addLong = (name, x, yPos, width) => { const f = form.createTextField(name); f.addToPage(page, { x, y: yPos, width, height: 16 }); };

  // Identity
  addText('last_name', leftX, y, 220);
  addText('first_name', rightX, y, 220);
  y -= 40;
  addText('middle_name', leftX, y, 220);
  addText('sex', rightX, y, 100);
  y -= 40;
  addText('birthdate', leftX, y, 150);
  addText('age', rightX, y, 60);
  y -= 40;
  addText('civil_status', leftX, y, 200);
  addText('religion', rightX, y, 200);
  y -= 40;
  addLong('present_address', leftX, y, 500);
  y -= 40;
  addText('case_type', leftX, y, 220);
  addText('assigned_house_parent', rightX, y, 220);

  // Parents
  y -= 60;
  addText('father_name', leftX, y, 220);
  addText('father_occupation', rightX, y, 220);
  y -= 40;
  addText('mother_name', leftX, y, 220);
  addText('mother_occupation', rightX, y, 220);
  y -= 40;
  addText('guardian_name', leftX, y, 220);
  addText('guardian_relation', rightX, y, 220);

  y -= 40;
  addText('marriage_date_place', leftX, y, 350);

  y -= 40;
  addText('brief_description', leftX, y, 500, 40);
  y -= 50;
  addText('problem_presented', leftX, y, 500, 40);
  y -= 50;
  addText('brief_history', leftX, y, 500, 40);
  y -= 50;
  addText('economic_situation', leftX, y, 500, 40);
  y -= 50;
  addText('medical_history', leftX, y, 500, 40);
  y -= 50;
  addText('family_background', leftX, y, 500, 40);
  y -= 50;
  addText('assessment', leftX, y, 500, 40);
  y -= 50;
  addText('recommendation', leftX, y, 500, 40);

  // Footer
  const out = await pdfDoc.save();
  fs.writeFileSync(outFile, out);
  console.log('Wrote PDF template:', outFile);
}

main().catch((e) => {
  console.error('Failed to generate PDF template:', e);
  process.exit(1);
});