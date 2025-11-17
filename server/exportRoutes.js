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
  const civil_status = pick('civil_status', 'status');
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
  const father_occupation = pick('father_occupation', 'fatherOccupation');
  const mother_name = pick('mother_name', 'motherName');
  const mother_occupation = pick('mother_occupation', 'motherOccupation');
  const guardian_name = pick('guardian_name', 'guardianName');
  const guardian_relation = pick('guardian_relation', 'guardianRelation');
  const program_type = pick('program_type', 'programType');

  const married_in_church = !!pick('married_in_church', 'marriedInChurch');
  const live_in_common_law = !!pick('live_in_common_law', 'liveInCommonLaw');
  const civil_marriage = !!pick('civil_marriage', 'civilMarriage');
  const separated = !!pick('separated');
  const marriage_date_place = pick('marriage_date_place', 'marriageDatePlace');

  const age = pick('age') || computeAge(birthdate);

  // Narrative fields from Add Case
  const brief_description = pick('brief_description', 'client_description', 'clientDescription');
  const problem_presented = pick('problem_presented', 'problemPresented');
  const brief_history = pick('brief_history', 'briefHistory');
  const economic_situation = pick('economic_situation', 'economicSituation');
  const medical_history = pick('medical_history', 'medicalHistory');
  const family_background = pick('family_background', 'familyBackground');
  const assessment = pick('assessment');
  const recommendation = pick('recommendation');

  // Return template field names expected by the PDF
  return {
    first_name,
    last_name,
    middle_name,
    sex,
    birthdate,
    age,
    status,
    civil_status,
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
    father_occupation,
    mother_name,
    mother_occupation,
    guardian_name,
    guardian_relation,
    program_type,
    married_in_church,
    live_in_common_law,
    civil_marriage,
    separated,
    marriage_date_place,
    brief_description,
    problem_presented,
    brief_history,
    economic_situation,
    medical_history,
    family_background,
    assessment,
    recommendation,
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
      if (typeof value === 'boolean') {
        try {
          const cb = form.getCheckBox(fieldName);
          if (value) cb.check(); else cb.uncheck();
          continue;
        } catch (_) {
          // not a checkbox, fall back to text
        }
      }
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
  const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const fld = (label, value) => hasVal(value) ? `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${escapeHtml(value)}</div>
      </div>` : '';
  const renderTable = (columns, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return '<div class="muted">No records</div>';
    const thead = `<thead><tr>${columns.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${columns.map(h => `<td>${escapeHtml(r[h] ?? r[h.replace(/\s+/g,'_').toLowerCase()] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="table">${thead}${tbody}</table>`;
  };
  const note = (label, value) => hasVal(value) ? `
            <div>
              <div class="label">${escapeHtml(label)}</div>
              <div class="note">${escapeHtml(value)}</div>
            </div>` : '';

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>HOPETRACK Case Report</title>
      <style>
        :root {
          --primary: #1f6feb;
          --secondary: #3b4058;
          --light: #f5f7fb;
          --text: #24292e;
          --border: #e1e4e8;
        }
        * { box-sizing: border-box; }
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--text); margin: 0; line-height: 1.5; }
        .titlebar { padding: 14px 24px; border-bottom: 2px solid var(--primary); display: flex; align-items: center; justify-content: space-between; }
        .titlebar .brand { font-weight: 700; color: var(--primary); letter-spacing: .2px; }
        .titlebar .meta { font-size: 12px; color: #6b7b93; }
        .container { padding: 18px 24px; }
        .section-title { margin: 16px 0 8px; font-weight: 700; color: var(--secondary); font-size: 13px; }
        .section { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 14px 16px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 20px; }
        .field { display: flex; flex-direction: column; align-items: flex-start; padding: 6px 0; gap: 4px; }
        .label { color: #57606a; font-weight: 600; font-size: 12px; line-height: 1.4; }
        .value { font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .row { display: grid; grid-template-columns: 1fr; gap: 6px; }
        .table { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
        .table th, .table td { border: 1px solid var(--border); padding: 6px 8px; font-size: 11px; text-align: left; }
        .table th { background: var(--light); font-weight: 600; color: #4f5d75; }
        .table thead th:nth-child(1), .table tbody td:nth-child(1) { text-align: left; }
        .table thead th:nth-child(2), .table tbody td:nth-child(2) { text-align: center; width: 90px; }
        .table thead th:nth-child(3), .table tbody td:nth-child(3) { text-align: center; width: 150px; }
        .table thead th:nth-child(4), .table tbody td:nth-child(4) { text-align: right; width: 140px; }
        .note { white-space: pre-wrap; font-size: 12px; border: 1px solid var(--border); background: #fafbfc; padding: 8px; border-radius: 6px; }
        @media print {
          .grid { grid-template-columns: 1fr 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="titlebar">
        <div class="brand">HOPETRACK</div>
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

        <div class="section-title">Civil Status of Parents</div>
        <div class="section">
          <div class="grid">
            ${fld('Married in church', c.married_in_church ? 'Yes' : 'No')}
            ${fld('Live-in/Common Law', c.live_in_common_law ? 'Yes' : 'No')}
            ${fld('Civil Marriage', c.civil_marriage ? 'Yes' : 'No')}
            ${fld('Separated', c.separated ? 'Yes' : 'No')}
            ${fld('Date and Place', c.marriage_date_place)}
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
            ${note('Problem Presented', raw.problem_presented || raw.problemPresented)}
            ${note('Brief History', raw.brief_history || raw.briefHistory)}
            ${note('Economic Situation', raw.economic_situation || raw.economicSituation)}
            ${note('Medical History', raw.medical_history || raw.medicalHistory)}
            ${note('Family Background', raw.family_background || raw.familyBackground)}
            ${note('Client Description', raw.client_description || raw.clientDescription)}
            ${note("Parents' Description", raw.parents_description || raw.parentsDescription)}
            ${note('Recommendation', raw.recommendation)}
            ${note('Assessment', raw.assessment)}
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

// Build consolidated HTML for multiple cases with summary table and per-case sections
function buildMultiCaseHtml(casesList = [], options = {}) {
  const listOnly = !!options.listOnly;
  const list = Array.isArray(casesList) ? casesList : [];
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calcAge = (birthdate) => {
    if (!birthdate) return '';
    const bd = new Date(birthdate);
    if (isNaN(bd.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const summaryRows = list.map((c) => {
    const n = c.name || `${c.firstName || c.first_name || ''} ${c.middleName || c.middle_name || ''} ${c.lastName || c.last_name || ''}`.trim();
    const age = c.age ?? calcAge(c.birthdate);
    const program = c.caseType || c.programType || c.program_type || '';
    const updated = formatDate(c.lastUpdated || c.updated_at || c.created_at);
    return `<tr>
      <td>${escapeHtml(n)}</td>
      <td style="text-align:center;">${escapeHtml(String(age ?? ''))}</td>
      <td style="text-align:center;">${escapeHtml(program)}</td>
      <td style="text-align:right;">${escapeHtml(updated)}</td>
    </tr>`;
  }).join('');

  const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const fld = (label, value) => hasVal(value) ? `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${escapeHtml(value)}</div>
      </div>` : '';
  const renderTable = (columns, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return '<div class="muted">No records</div>';
    const thead = `<thead><tr>${columns.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${columns.map(h => `<td>${escapeHtml(r[h] ?? r[h.replace(/\s+/g,'_').toLowerCase()] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="table">${thead}${tbody}</table>`;
  };
  const note = (label, value) => hasVal(value) ? `
            <div>
              <div class="label">${escapeHtml(label)}</div>
              <div class="note">${escapeHtml(value)}</div>
            </div>` : '';

  const perCaseSections = listOnly ? '' : list.map((raw, idx) => {
    const c = normalizeCaseData(raw);
    const titleName = (c.first_name || '') + (c.middle_name ? ` ${c.middle_name}` : '') + (c.last_name ? ` ${c.last_name}` : '');
    return `
      <div class="case-block" style="${idx > 0 ? 'page-break-before: always;' : ''}">
        <div class="case-titlebar">
          <div class="case-name">Case: ${escapeHtml(titleName.trim() || raw.name || `#${raw.id || ''}`)}</div>
          <div class="meta">Program: ${escapeHtml(c.program_type || raw.programType || '')} • Updated: ${escapeHtml(formatDate(raw.updated_at || raw.lastUpdated || raw.created_at))}</div>
        </div>
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
            ${note('Problem Presented', raw.problem_presented || raw.problemPresented)}
            ${note('Brief History', raw.brief_history || raw.briefHistory)}
            ${note('Economic Situation', raw.economic_situation || raw.economicSituation)}
            ${note('Medical History', raw.medical_history || raw.medicalHistory)}
            ${note('Family Background', raw.family_background || raw.familyBackground)}
            ${note('Client Description', raw.client_description || raw.clientDescription)}
            ${note("Parents' Description", raw.parents_description || raw.parentsDescription)}
            ${note('Recommendation', raw.recommendation)}
            ${note('Assessment', raw.assessment)}
          </div>
        </div>
      </div>`;
  }).join('\n');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>CICL Cases Summary</title>
      <style>
        :root { --primary:#1f6feb; --secondary:#3b4058; --light:#f5f7fb; --text:#24292e; --border:#e1e4e8; }
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
        .case-titlebar { padding: 10px 12px; border-left: 4px solid var(--primary); background: #f9fbff; display:flex; align-items:center; justify-content:space-between; border-radius:6px; }
        .case-name { font-weight: 600; color: var(--secondary); }
        .note { white-space: pre-wrap; font-size: 12px; border: 1px solid var(--border); background: #fafbfc; padding: 8px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="titlebar">
        <div class="brand">HOPETRACK</div>
        <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <div class="container">
        <div class="section-title">Summary</div>
        <div class="section">
          <table class="table">
            <thead>
          <tr><th>Name</th><th style="text-align:center;">Age</th><th style="text-align:center;">Program</th><th style="text-align:right;">Last Updated</th></tr>
            </thead>
            <tbody>
              ${summaryRows || '<tr><td colspan="4">No cases</td></tr>'}
            </tbody>
          </table>
        </div>

        ${perCaseSections}
      </div>
    </body>
  </html>`;
}

async function generateMultiHtmlPdf(casesList, opts = {}) {
  const noSandbox = String(process.env.PUPPETEER_NO_SANDBOX).toLowerCase() === 'true';
  const args = ['--disable-dev-shm-usage', '--disable-gpu'];
  if (noSandbox) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  const browser = await puppeteer.launch({ headless: 'new', args });
  try {
    const page = await browser.newPage();
    await page.setContent(buildMultiCaseHtml(casesList, { listOnly: !!opts.listOnly }), { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');
    const pdf = await page.pdf({
      format: opts.format || 'A4',
      landscape: !!opts.landscape,
      printBackground: true,
      margin: opts.margin || { top: '16mm', right: '12mm', bottom: '18mm', left: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; color:#6b7b93; padding-left:12mm; padding-right:12mm; width:100%;"><span>${opts.listOnly ? 'Cases Summary (List)' : 'Cases Summary'}</span></div>`,
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

async function fetchFullCaseById(id) {
  const baseResult = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
  if (!baseResult.rows.length) return null;
  const base = baseResult.rows[0];
  const [educationalResult, sacramentalResult, agenciesResult, familyMembersResult, extendedFamilyResult] = await Promise.all([
    db.query('SELECT level, school_name, school_address, year_completed FROM educational_attainment WHERE case_id = $1 ORDER BY level', [id]),
    db.query('SELECT sacrament, date_received, place_parish FROM sacramental_records WHERE case_id = $1 ORDER BY date_received', [id]),
    db.query('SELECT name, address_date_duration, services_received FROM agencies_persons WHERE case_id = $1 ORDER BY name', [id]),
    db.query('SELECT name, relation, age, sex, status, education, address, occupation, income FROM family_members WHERE case_id = $1 ORDER BY relation, name', [id]),
    db.query('SELECT name, relationship, age, sex, status, education, occupation, income FROM extended_family WHERE case_id = $1 ORDER BY relationship, name', [id]),
  ]);
  return {
    ...base,
    educationalAttainment: educationalResult.rows,
    sacramentalRecords: sacramentalResult.rows,
    agencies: agenciesResult.rows,
    family_members_rows: familyMembersResult.rows,
    extended_family_rows: extendedFamilyResult.rows,
  };
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
      margin: opts.margin || { top: '16mm', right: '14mm', bottom: '18mm', left: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; color:#6b7b93; padding:0 12mm; width:100%;"><span>Case Report</span></div>`,
      footerTemplate: `<div style="font-size:10px; color:#6b7b93; padding:0 12mm; width:100%; display:flex; justify-content:space-between;">
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
    const data = await fetchFullCaseById(id);
    if (!data) return res.status(404).json({ message: 'Case not found' });
    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
    };
    const pdf = await generateHtmlPdf(data, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${id}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
});

// POST: generate PDF from provided JSON case payload
router.post('/case/pdf', auth, async (req, res) => {
  try {
    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
    };
    const pdf = await generateHtmlPdf(req.body || {}, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-export.pdf"');
    return res.send(pdf);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
});

router.get('/case/:id/pdf-template', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await fetchFullCaseById(id);
    if (!data) return res.status(404).json({ message: 'Case not found' });
    const pdfBytes = await fillPdfTemplate(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${id}-template.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Template PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate template PDF', error: err.message });
  }
});

router.post('/case/pdf-template', auth, async (req, res) => {
  try {
    const pdfBytes = await fillPdfTemplate(req.body || {});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-export-template.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Template PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate template PDF', error: err.message });
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

// POST: HTML-rendered consolidated PDF for multiple cases (Puppeteer)
router.post('/cases/pdf-html', auth, async (req, res) => {
  try {
    const body = req.body || {};
    const ids = Array.isArray(body.ids) ? body.ids : null;
    const providedCases = Array.isArray(body.cases) ? body.cases : null;
    let casesList = [];
    if (ids && ids.length) {
      casesList = (await Promise.all(ids.map(async (id) => await fetchFullCaseById(id)))).filter(Boolean);
    } else if (providedCases && providedCases.length) {
      casesList = providedCases;
    } else {
      return res.status(400).json({ message: 'Provide case ids or cases array' });
    }

    const opts = {
      format: (req.query.format || 'A4'),
      landscape: req.query.landscape === 'true',
      listOnly: req.query.listOnly === 'true' || body.listOnly === true,
    };
    const pdf = await generateMultiHtmlPdf(casesList, opts);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${opts.listOnly ? 'cases-list-html' : 'cases-summary-html'}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    console.error('HTML PDF export (multi) error:', err);
    return res.status(500).json({ message: 'Failed to generate consolidated HTML PDF', error: err.message });
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
