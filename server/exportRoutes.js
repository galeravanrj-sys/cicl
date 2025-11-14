const express = require('express');
const path = require('path');
const fs = require('fs');
const auth = require('./middleware/auth');
const db = require('./db');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const puppeteer = require('puppeteer');

const router = express.Router();

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'template', 'GENERAL_INTAKEFORM_ASILO.pdf');

function computeAge(birthdate) {
  if (!birthdate) return '';
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

function normalizeCaseData(input) {
  const c = input || {};
  // Resolve common aliases (camelCase and snake_case)
  const pick = (...keys) => keys.find((k) => c[k] !== undefined && c[k] !== null && c[k] !== '') && c[keys.find((k) => c[k] !== undefined && c[k] !== null && c[k] !== '')];

  const first_name = pick('first_name', 'firstName');
  const last_name = pick('last_name', 'lastName');
  const middle_name = pick('middle_name', 'middleName');
  const sex = pick('sex');
  const birthdate = pick('birthdate');
  const status = pick('status');
  const religion = pick('religion');
  const address = pick('address', 'presentAddress', 'present_address');
  const nickname = pick('nickname');
  const birthplace = pick('birthplace');
  const nationality = pick('nationality');
  const present_address = pick('present_address', 'presentAddress');
  const provincial_address = pick('provincial_address', 'provincialAddress');
  const date_of_referral = pick('date_of_referral', 'dateOfReferral');
  const address_and_tel = pick('address_and_tel', 'addressAndTel');
  const relation_to_client = pick('relation_to_client', 'relationToClient');
  const source_of_referral = pick('source_of_referral', 'otherSourceOfReferral', 'sourceOfReferral');
  const case_type = pick('case_type', 'caseType');
  const assigned_house_parent = pick('assigned_house_parent', 'assignedHouseParent');
  const father_name = pick('father_name', 'fatherName');
  const mother_name = pick('mother_name', 'motherName');
  const guardian_name = pick('guardian_name', 'guardianName');
  const program_type = pick('program_type', 'programType');

  const age = pick('age') || computeAge(birthdate);

  // Return template field names expected by the PDF
  return {
    first_name,
    last_name,
    middle_name,
    sex,
    birthdate,
    age,
    status,
    religion,
    address,
    nickname,
    birthplace,
    nationality,
    present_address,
    provincial_address,
    date_of_referral,
    address_and_tel,
    relation_to_client,
    source_of_referral,
    case_type,
    assigned_house_parent,
    father_name,
    mother_name,
    guardian_name,
    program_type,
  };
}

async function fillPdfTemplate(caseData) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found at ${TEMPLATE_PATH}`);
  }
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  const normalized = normalizeCaseData(caseData);

  const entries = Object.entries(normalized).filter(([, v]) => v !== undefined && v !== null && v !== '');
  for (const [fieldName, value] of entries) {
    try {
      const field = form.getTextField(fieldName);
      field.setText(String(value));
      field.updateAppearances(helvetica);
    } catch (e) {
      // Field may not exist; skip silently
    }
  }
  form.flatten();
  return await pdfDoc.save();
}

// --- HTML to PDF via Puppeteer ---
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(caseData) {
  const c = normalizeCaseData(caseData);
  const raw = caseData || {};
  const fld = (label, value) => `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${escapeHtml(value || '')}</div>
      </div>`;
  const renderTable = (columns, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return '<div class="muted">No records</div>';
    const thead = `<thead><tr>${columns.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${columns.map(h => `<td>${escapeHtml(r[h] ?? r[h.replace(/\s+/g,'_').toLowerCase()] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="table">${thead}${tbody}</table>`;
  };

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>CICL Case Report</title>
      <style>
        :root {
          --primary: #1f6feb;
          --secondary: #3b4058;
          --light: #f5f7fb;
          --text: #24292e;
          --border: #e1e4e8;
        }
        * { box-sizing: border-box; }
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--text); margin: 0; }
        .titlebar { padding: 14px 24px; border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: space-between; }
        .titlebar .brand { font-weight: 700; color: var(--primary); letter-spacing: .2px; }
        .titlebar .meta { font-size: 12px; color: #6b7b93; }
        .container { padding: 18px 24px; }
        .section-title { margin: 16px 0 8px; font-weight: 700; color: var(--secondary); font-size: 13px; }
        .section { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 12px 14px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 18px; }
        .field { display: grid; grid-template-columns: 160px 1fr; align-items: center; border-bottom: 1px dashed var(--border); padding: 6px 0; }
        .field:last-child { border-bottom: 0; }
        .label { color: #57606a; font-weight: 600; font-size: 12px; }
        .value { font-size: 12px; }
        .row { display: grid; grid-template-columns: 1fr; gap: 6px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .table th, .table td { border: 1px solid var(--border); padding: 6px 8px; font-size: 11px; text-align: left; }
        .table th { background: var(--light); font-weight: 600; color: #4f5d75; }
        .note { white-space: pre-wrap; font-size: 12px; border: 1px solid var(--border); background: #fafbfc; padding: 8px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="titlebar">
        <div class="brand">Children in Conflict with the Law</div>
        <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <div class="container">
        <div class="section-title">Client Information</div>
        <div class="section">
          <div class="grid">
            ${fld('First Name', c.first_name)}
            ${fld('Last Name', c.last_name)}
            ${fld('Middle Name', c.middle_name)}
            ${fld('Sex', c.sex)}
            ${fld('Birthdate', c.birthdate)}
            ${fld('Age', c.age)}
            ${fld('Status', c.status)}
            ${fld('Religion', c.religion)}
            ${fld('Nationality', c.nationality)}
            ${fld('Nickname', c.nickname)}
          </div>
        </div>

        <div class="section-title">Addresses</div>
        <div class="section">
          <div class="grid">
            ${fld('Present Address', c.present_address || c.address)}
            ${fld('Provincial Address', c.provincial_address)}
            ${fld('Birthplace', c.birthplace)}
          </div>
        </div>

        <div class="section-title">Referral</div>
        <div class="section">
          <div class="grid">
            ${fld('Date of Referral', c.date_of_referral)}
            ${fld('Source of Referral', c.source_of_referral)}
            ${fld('Relation to Client', c.relation_to_client)}
            ${fld('Address & Tel', c.address_and_tel)}
          </div>
        </div>

        <div class="section-title">Case Details</div>
        <div class="section">
          <div class="grid">
            ${fld('Case Type', c.case_type)}
            ${fld('Program Type', c.program_type)}
            ${fld('Assigned House Parent', c.assigned_house_parent)}
            ${fld('Mother', c.mother_name)}
            ${fld('Father', c.father_name)}
            ${fld('Guardian', c.guardian_name)}
          </div>
        </div>

        <div class="section-title">Family Composition</div>
        <div class="section">
          ${renderTable(
            ['name','relation','age','sex','status','education','address','occupation','income'],
            raw.familyMembers || raw.family_members || raw.family_members_rows || []
          )}
        </div>

        <div class="section-title">Extended Family</div>
        <div class="section">
          ${renderTable(
            ['name','relationship','age','sex','status','education','occupation','income'],
            raw.extendedFamily || raw.extended_family || raw.extended_family_rows || []
          )}
        </div>

        <div class="section-title">Educational Attainment</div>
        <div class="section">
          ${renderTable(
            ['level','school_name','school_address','year_completed'],
            raw.educationalAttainment || raw.educational_attainment || []
          )}
        </div>

        <div class="section-title">Sacramental Records</div>
        <div class="section">
          ${renderTable(
            ['sacrament','date_received','place_parish'],
            raw.sacramentalRecords || raw.sacramental_records || []
          )}
        </div>

        <div class="section-title">Agencies / Persons</div>
        <div class="section">
          ${renderTable(
            ['name','address_date_duration','services_received'],
            raw.agencies || raw.agencies_persons || []
          )}
        </div>

        <div class="section-title">Narrative</div>
        <div class="section">
          <div class="row">
            <div>
              <div class="label">Problem Presented</div>
              <div class="note">${escapeHtml(raw.problem_presented || raw.problemPresented || '')}</div>
            </div>
            <div>
              <div class="label">Brief History</div>
              <div class="note">${escapeHtml(raw.brief_history || raw.briefHistory || '')}</div>
            </div>
            <div>
              <div class="label">Economic Situation</div>
              <div class="note">${escapeHtml(raw.economic_situation || raw.economicSituation || '')}</div>
            </div>
            <div>
              <div class="label">Medical History</div>
              <div class="note">${escapeHtml(raw.medical_history || raw.medicalHistory || '')}</div>
            </div>
            <div>
              <div class="label">Family Background</div>
              <div class="note">${escapeHtml(raw.family_background || raw.familyBackground || '')}</div>
            </div>
            <div>
              <div class="label">Client Description</div>
              <div class="note">${escapeHtml(raw.client_description || raw.clientDescription || '')}</div>
            </div>
            <div>
              <div class="label">Parents' Description</div>
              <div class="note">${escapeHtml(raw.parents_description || raw.parentsDescription || '')}</div>
            </div>
            <div>
              <div class="label">Recommendation</div>
              <div class="note">${escapeHtml(raw.recommendation || '')}</div>
            </div>
            <div>
              <div class="label">Assessment</div>
              <div class="note">${escapeHtml(raw.assessment || '')}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

async function generateHtmlPdf(caseData, opts = {}) {
  const noSandbox = String(process.env.PUPPETEER_NO_SANDBOX).toLowerCase() === 'true';
  const args = ['--disable-dev-shm-usage', '--disable-gpu'];
  if (noSandbox) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  const browser = await puppeteer.launch({ headless: 'new', args });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(caseData), { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');
    const pdf = await page.pdf({
      format: opts.format || 'A4',
      landscape: !!opts.landscape,
      printBackground: true,
      margin: opts.margin || { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; color:#6b7b93; padding-left:12mm; padding-right:12mm; width:100%;"><span>Case Report</span></div>`,
      footerTemplate: `<div style="font-size:10px; color:#6b7b93; padding-left:12mm; padding-right:12mm; width:100%; display:flex; justify-content:space-between;">
        <span>Generated ${escapeHtml(new Date().toLocaleDateString())}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

// GET: generate PDF by case id
router.get('/case/:id/pdf', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Case not found' });
    const base = result.rows[0];

    // Optionally enrich with related tables if needed
    // For now we fill the intake template with main case fields

    const pdfBytes = await fillPdfTemplate(base);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${id}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
});

// POST: generate PDF from provided JSON case payload
router.post('/case/pdf', auth, async (req, res) => {
  try {
    const pdfBytes = await fillPdfTemplate(req.body || {});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-export.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
});

// GET: HTML-rendered PDF by case id (Puppeteer)
router.get('/case/:id/pdf-html', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const baseResult = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (!baseResult.rows.length) return res.status(404).json({ message: 'Case not found' });
    const base = baseResult.rows[0];

    // Fetch related records to include all Add Case info
    const [educationalResult, sacramentalResult, agenciesResult, familyMembersResult, extendedFamilyResult] = await Promise.all([
      db.query('SELECT level, school_name, school_address, year_completed FROM educational_attainment WHERE case_id = $1 ORDER BY level', [id]),
      db.query('SELECT sacrament, date_received, place_parish FROM sacramental_records WHERE case_id = $1 ORDER BY date_received', [id]),
      db.query('SELECT name, address_date_duration, services_received FROM agencies_persons WHERE case_id = $1 ORDER BY name', [id]),
      db.query('SELECT name, relation, age, sex, status, education, address, occupation, income FROM family_members WHERE case_id = $1 ORDER BY relation, name', [id]),
      db.query('SELECT name, relationship, age, sex, status, education, occupation, income FROM extended_family WHERE case_id = $1 ORDER BY relationship, name', [id]),
    ]);

    const fullCase = {
      ...base,
      educationalAttainment: educationalResult.rows,
      sacramentalRecords: sacramentalResult.rows,
      agencies: agenciesResult.rows,
      family_members_rows: familyMembersResult.rows,
      extended_family_rows: extendedFamilyResult.rows,
    };
    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
    };
    const pdf = await generateHtmlPdf(fullCase, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${id}-html.pdf"`);
    return res.send(pdf);
  } catch (err) {
    console.error('HTML PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate HTML PDF', error: err.message });
  }
});

// POST: HTML-rendered PDF from provided JSON payload (Puppeteer)
router.post('/case/pdf-html', auth, async (req, res) => {
  try {
    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
    };
    const pdf = await generateHtmlPdf(req.body || {}, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-export-html.pdf"');
    return res.send(pdf);
  } catch (err) {
    console.error('HTML PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate HTML PDF', error: err.message });
  }
});

// DEV-ONLY: Preview sample PDFs without auth
const SAMPLE_CASE = {
  first_name: 'Juan',
  middle_name: 'D.',
  last_name: 'Delacruz',
  sex: 'Male',
  birthdate: '2009-06-12',
  status: 'In Intake',
  religion: 'Catholic',
  nationality: 'Filipino',
  nickname: 'JD',
  address: '123 Barangay Sto. Niño, Cebu City',
  present_address: '123 Barangay Sto. Niño, Cebu City',
  provincial_address: 'Sitio Bayabas, Danao, Cebu',
  birthplace: 'Cebu City',
  date_of_referral: '2025-10-01',
  source_of_referral: 'Barangay Council',
  relation_to_client: 'Community Officer',
  address_and_tel: 'Barangay Hall, (032) 555-0123',
  case_type: 'Minor Offense',
  program_type: 'Residential',
  assigned_house_parent: 'Maria Santos',
  mother_name: 'Luz Delacruz',
  father_name: 'Jose Delacruz',
  guardian_name: 'Auntie Fe'
};

router.get('/sample/pdf-html', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Sample preview disabled in production' });
  }
  try {
    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
    };
    const pdf = await generateHtmlPdf(SAMPLE_CASE, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="case-sample-html.pdf"');
    return res.send(pdf);
  } catch (err) {
    console.error('Sample HTML PDF error:', err);
    return res.status(500).json({ message: 'Failed to generate sample HTML PDF', error: err.message });
  }
});

router.get('/sample/pdf', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Sample preview disabled in production' });
  }
  try {
    const pdfBytes = await fillPdfTemplate(SAMPLE_CASE);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="case-sample.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Sample PDF error:', err);
    return res.status(500).json({ message: 'Failed to generate sample PDF', error: err.message });
  }
});

module.exports = router;
