// Generates a DOCX template with Docxtemplater-style tags matching our case data keys
// Output: public/template/GENERAL_INTAKEFORM_ASILO.docx

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

function labelValue(label, tag) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ': ', bold: true }),
      new TextRun({ text: `{{${tag}}}` }),
    ],
    spacing: { after: 120 },
  });
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'template');
  const outFile = path.join(outDir, 'GENERAL_INTAKEFORM_ASILO.docx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const doc = new Document({ sections: [{ children: [] }] });
  const children = [];

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [ new TextRun('CICL Intake Form (Template)') ] }));

  const pairs = [
    ['First Name', 'first_name'],
    ['Middle Name', 'middle_name'],
    ['Last Name', 'last_name'],
    ['Sex', 'sex'],
    ['Birthdate', 'birthdate'],
    ['Age', 'age'],
    ['Civil Status', 'civil_status'],
    ['Religion', 'religion'],
    ['Address', 'address'],
    ['Barangay', 'barangay'],
    ['Municipality', 'municipality'],
    ['Province', 'province'],
    ['Referral Source', 'referral_source'],
    ['Other Referral', 'referral_other'],
    ['Case Type', 'case_type'],
    ['Admission Month', 'admission_month'],
    ['Admission Year', 'admission_year'],
    ['Assigned House Parent', 'assigned_house_parent'],
    ['Father Name', 'father_name'],
    ['Father Age', 'father_age'],
    ['Father Education', 'father_education'],
    ['Father Occupation', 'father_occupation'],
    ['Father Other Skills', 'father_other_skills'],
    ['Father Address', 'father_address'],
    ['Father Income', 'father_income'],
    ['Father Living', 'father_living'],
    ['Mother Name', 'mother_name'],
    ['Mother Age', 'mother_age'],
    ['Mother Education', 'mother_education'],
    ['Mother Occupation', 'mother_occupation'],
    ['Mother Other Skills', 'mother_other_skills'],
    ['Mother Address', 'mother_address'],
    ['Mother Income', 'mother_income'],
    ['Mother Living', 'mother_living'],
    ['Guardian Name', 'guardian_name'],
    ['Guardian Relation', 'guardian_relation'],
    ['Guardian Age', 'guardian_age'],
    ['Guardian Education', 'guardian_education'],
    ['Guardian Occupation', 'guardian_occupation'],
    ['Guardian Address', 'guardian_address'],
    ['Married In Church', 'married_in_church'],
    ['Live In Common Law', 'live_in_common_law'],
    ['Civil Marriage', 'civil_marriage'],
    ['Separated', 'separated'],
    ['Marriage Date & Place', 'marriage_date_place'],
    ['Brief Description', 'brief_description'],
    ['Problem Presented', 'problem_presented'],
    ['Brief History', 'brief_history'],
    ['Economic Situation', 'economic_situation'],
    ['Medical History', 'medical_history'],
    ['Family Background', 'family_background'],
    ['Assessment', 'assessment'],
    ['Recommendation', 'recommendation'],
  ];

  pairs.forEach(([label, tag]) => children.push(labelValue(label, tag)));

  doc.addSection({ children });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outFile, buf);
  console.log('Wrote DOCX template:', outFile);
}

main().catch((e) => { console.error('Failed to generate DOCX template:', e); process.exit(1); });