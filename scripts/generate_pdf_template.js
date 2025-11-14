// Generates a fillable PDF template with fields matching our case data keys
// Output: public/template/GENERAL_INTAKEFORM_ASILO.pdf

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'template');
  const outFile = path.join(outDir, 'GENERAL_INTAKEFORM_ASILO.pdf');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const form = pdfDoc.getForm();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawLabel = (text, x, y) => {
    page.drawText(String(text), { x, y, size: 10, font: helv });
  };
  const addText = (name, x, y, w = 250, h = 18) => {
    const tf = form.createTextField(name);
    tf.setText('');
    tf.addToPage(page, { x, y: y - h + 2, width: w, height: h });
  };
  const addCheck = (name, label, x, y) => {
    drawLabel(label, x + 18, y);
    const cb = form.createCheckBox(name);
    cb.addToPage(page, { x, y: y - 10, width: 12, height: 12 });
  };

  let y = 800;
  const leftX = 40;
  const rightX = 320;

  // Header
  page.drawText('CHILDREN IN CONFLICT WITH THE LAW (CICL) — INTAKE FORM', { x: 40, y: 820, size: 12, font: helv });

  // Identity
  drawLabel('Last Name', leftX, y); addText('last_name', leftX, y - 12, 230);
  drawLabel('First Name', rightX, y); addText('first_name', rightX, y - 12, 230);
  y -= 40;
  drawLabel('Middle Name', leftX, y); addText('middle_name', leftX, y - 12, 230);
  drawLabel('Sex', rightX, y); addText('sex', rightX, y - 12, 100);
  y -= 40;
  drawLabel('Birthdate', leftX, y); addText('birthdate', leftX, y - 12, 150);
  drawLabel('Age', rightX, y); addText('age', rightX, y - 12, 60);
  y -= 40;
  drawLabel('Civil Status', leftX, y); addText('civil_status', leftX, y - 12, 200);
  drawLabel('Religion', rightX, y); addText('religion', rightX, y - 12, 200);
  y -= 40;
  drawLabel('Address', leftX, y); addText('address', leftX, y - 12, 510);
  y -= 40;
  drawLabel('Case Type', leftX, y); addText('case_type', leftX, y - 12, 230);
  drawLabel('Assigned House Parent', rightX, y); addText('assigned_house_parent', rightX, y - 12, 230);

  // Parents
  y -= 50; page.drawText('Parents / Guardian', { x: 40, y, size: 11, font: helv }); y -= 20;
  drawLabel('Father Name', leftX, y); addText('father_name', leftX, y - 12, 230);
  drawLabel('Father Occupation', rightX, y); addText('father_occupation', rightX, y - 12, 230);
  y -= 40;
  drawLabel('Mother Name', leftX, y); addText('mother_name', leftX, y - 12, 230);
  drawLabel('Mother Occupation', rightX, y); addText('mother_occupation', rightX, y - 12, 230);
  y -= 40;
  drawLabel('Guardian Name', leftX, y); addText('guardian_name', leftX, y - 12, 230);
  drawLabel('Guardian Relation', rightX, y); addText('guardian_relation', rightX, y - 12, 230);

  // Marriage flags
  y -= 40;
  addCheck('married_in_church', 'Married in Church', leftX, y);
  addCheck('live_in_common_law', 'Living in Common Law', leftX + 160, y);
  addCheck('civil_marriage', 'Civil Marriage', rightX, y);
  addCheck('separated', 'Separated', rightX + 140, y);
  y -= 30;
  drawLabel('Marriage Date & Place', leftX, y); addText('marriage_date_place', leftX, y - 12, 350);

  // Narrative
  y -= 40;
  drawLabel('Brief Description', leftX, y); addText('brief_description', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Problem Presented', leftX, y); addText('problem_presented', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Brief History', leftX, y); addText('brief_history', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Economic Situation', leftX, y); addText('economic_situation', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Medical History', leftX, y); addText('medical_history', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Family Background', leftX, y); addText('family_background', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Assessment', leftX, y); addText('assessment', leftX, y - 12, 510, 40);
  y -= 50;
  drawLabel('Recommendation', leftX, y); addText('recommendation', leftX, y - 12, 510, 40);

  // Footer
  page.drawText('Template: GENERAL_INTAKEFORM_ASILO (Auto-generated)', { x: 40, y: 40, size: 9, font: helv });

  // Keep fields editable for front-end fill; do not flatten
  const out = await pdfDoc.save();
  fs.writeFileSync(outFile, out);
  console.log('Wrote PDF template:', outFile);
}

main().catch((e) => {
  console.error('Failed to generate PDF template:', e);
  process.exit(1);
});