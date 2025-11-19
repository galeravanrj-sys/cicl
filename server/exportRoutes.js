const express = require('express');
const path = require('path');
const fs = require('fs');
const auth = require('./middleware/auth');
const db = require('./db');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const os = require('os');

const router = express.Router();

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'template', 'GENERAL_INTAKEFORM_ASILO_fillable.pdf');
const BASE_TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'template', 'GENERAL_INTAKEFORM_ASILO.pdf');

async function ensureFillableTemplate() {
  try {
    if (fs.existsSync(TEMPLATE_PATH)) return;
    if (!fs.existsSync(BASE_TEMPLATE_PATH)) return;
    const baseBytes = fs.readFileSync(BASE_TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(baseBytes);
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPage(0);
    const addText = (name, x, y, w = 250, h = 18) => { const tf = form.createTextField(name); tf.addToPage(page, { x, y, width: w, height: h }); };
    const addLong = (name, x, yPos, width) => { const f = form.createTextField(name); f.addToPage(page, { x, y: yPos, width, height: 16 }); };
    let y = 700; const leftX = 60; const rightX = 330;
    addText('last_name', leftX, y, 220); addText('first_name', rightX, y, 220); y -= 40;
    addText('middle_name', leftX, y, 220); addText('sex', rightX, y, 100); y -= 40;
    addText('birthdate', leftX, y, 150); addText('age', rightX, y, 60); y -= 40;
    addText('civil_status', leftX, y, 200); addText('religion', rightX, y, 200); y -= 40;
    addLong('present_address', leftX, y, 500); y -= 40;
    addText('case_type', leftX, y, 220); addText('assigned_house_parent', rightX, y, 220);
    y -= 60; addText('father_name', leftX, y, 220); addText('father_occupation', rightX, y, 220); y -= 40;
    addText('mother_name', leftX, y, 220); addText('mother_occupation', rightX, y, 220); y -= 40;
    addText('guardian_name', leftX, y, 220); addText('guardian_relation', rightX, y, 220);
    y -= 40; addText('marriage_date_place', leftX, y, 350);
    y -= 40; addText('brief_description', leftX, y, 500, 40); y -= 50;
    addText('problem_presented', leftX, y, 500, 40); y -= 50;
    addText('brief_history', leftX, y, 500, 40); y -= 50;
    addText('economic_situation', leftX, y, 500, 40); y -= 50;
    addText('medical_history', leftX, y, 500, 40); y -= 50;
    addText('family_background', leftX, y, 500, 40); y -= 50;
    addText('assessment', leftX, y, 500, 40); y -= 50;
    addText('recommendation', leftX, y, 500, 40);
    const out = await pdfDoc.save();
    fs.writeFileSync(TEMPLATE_PATH, out);
  } catch (_) {}
}

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
  await ensureFillableTemplate();
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found at ${TEMPLATE_PATH}`);
  }
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();

  const normalized = normalizeCaseData(caseData);

  const fields = (() => { try { return form.getFields(); } catch (_) { return []; } })();
  if (fields && fields.length > 0) {
    const entries = Object.entries(normalized).filter(([, v]) => v !== undefined && v !== null && v !== '');
    for (const [fieldName, value] of entries) {
      try {
        if (typeof value === 'boolean') {
          try {
            const cb = form.getCheckBox(fieldName);
            if (value) cb.check(); else cb.uncheck();
            continue;
          } catch (_) {
          }
        }
        const field = form.getTextField(fieldName);
        field.setText(String(value));
        field.updateAppearances(helvetica);
      } catch (e) {
      }
    }
    form.flatten();
    return await pdfDoc.save();
  }

  // Fallback: overlay text onto the static template using a clean grid
  const page = pdfDoc.getPage(0);
  const labelStyle = { size: 10, font: helvetica, color: undefined };
  const valueStyle = { size: 11, font: helvetica };
  const leftX = 40; const rightX = 315; let y = page.getSize().height - 120; const step = 26;
  const drawField = (label, val, x, yPos, width = 240) => {
    if (!val) return;
    page.drawText(label, { x, y: yPos, ...labelStyle });
    // paint a white strip to cover underlying line artifacts
    page.drawRectangle({ x, y: yPos - 14, width, height: 16, color: pdfDoc.context.obj({}) });
    page.drawText(String(val), { x, y: yPos - 12, ...valueStyle });
  };
  const pick = (k) => normalized[k];
  // Identity
  drawField('Last Name', pick('last_name') || pick('lastName'), leftX, y); drawField('First Name', pick('first_name') || pick('firstName'), rightX, y); y -= step;
  drawField('Middle Name', pick('middle_name') || pick('middleName'), leftX, y); drawField('Sex', pick('sex'), rightX, y, 120); y -= step;
  drawField('Birthdate', pick('birthdate'), leftX, y, 160); drawField('Age', pick('age'), rightX, y, 80); y -= step;
  drawField('Civil Status', pick('civil_status'), leftX, y); drawField('Religion', pick('religion'), rightX, y); y -= step;
  drawField('Present Address', pick('present_address') || pick('address'), leftX, y, 520); y -= step;
  drawField('Provincial Address', pick('provincial_address'), leftX, y, 520); y -= step;
  // Referral
  drawField('Date of Referral', pick('date_of_referral'), leftX, y); drawField('Relation to Client', pick('relation_to_client'), rightX, y); y -= step;
  drawField('Source of Referral', pick('source_of_referral'), leftX, y, 520); y -= step;
  // Parents/Guardian
  drawField('Father Name', pick('father_name'), leftX, y); drawField('Father Occupation', pick('father_occupation'), rightX, y); y -= step;
  drawField('Mother Name', pick('mother_name'), leftX, y); drawField('Mother Occupation', pick('mother_occupation'), rightX, y); y -= step;
  drawField('Guardian Name', pick('guardian_name'), leftX, y); drawField('Guardian Relation', pick('guardian_relation'), rightX, y); y -= step;
  // Program
  drawField('Case Type', pick('case_type'), leftX, y); drawField('Program Type', pick('program_type'), rightX, y); y -= step;
  drawField('Assigned House Parent', pick('assigned_house_parent'), leftX, y); y -= step;
  // Narrative
  const narrativeStart = y - 10; const wrapWidth = page.getSize().width - 80;
  const narrative = [ ['Brief Description', pick('brief_description')], ['Problem Presented', pick('problem_presented')], ['Brief History', pick('brief_history')], ['Economic Situation', pick('economic_situation')], ['Medical History', pick('medical_history')], ['Family Background', pick('family_background')], ['Assessment', pick('assessment')], ['Recommendation', pick('recommendation')] ];
  for (const [label, val] of narrative) {
    if (!val) continue;
    page.drawText(label, { x: leftX, y: y, ...labelStyle });
    page.drawRectangle({ x: leftX, y: y - 120, width: wrapWidth, height: 120, color: pdfDoc.context.obj({}) });
    page.drawText(String(val), { x: leftX, y: y - 12, ...valueStyle });
    y -= 140;
  }
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

function toDateOnly(value) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  if (m) return m[1];
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:.*)?$/);
  if (us) {
    const mm = us[1].padStart(2,'0');
    const dd = us[2].padStart(2,'0');
    const yyyy = us[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return s;
}

function buildHtml(caseData) {
  const c = normalizeCaseData(caseData);
  const raw = caseData || {};
  const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const kv = (label, value) => hasVal(value) ? `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>` : '';
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
  const parseChecklist = (cl) => {
    if (!cl) return [];
    if (Array.isArray(cl)) return cl;
    try {
      const parsed = JSON.parse(String(cl));
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

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
        .titlebar { padding: 14px 24px; border-bottom: 2px solid var(--primary); display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; }
        .titlebar .brandwrap { display: flex; align-items: center; gap: 12px; }
        .titlebar .brand { font-weight: 800; color: var(--primary); letter-spacing: .2px; font-size: 18px; }
        .titlebar .meta { font-size: 12px; color: #6b7b93; }
        .titlebar .photoBox { width: 96px; height: 96px; border: 2px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff; overflow: hidden; }
        .titlebar .photoBox img { width: 100%; height: 100%; object-fit: cover; }
        .container { padding: 18px 24px; }
        .section-title { margin: 16px 0 8px; font-weight: 700; color: var(--secondary); font-size: 13px; }
        .section { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 14px 16px; }
        .kv { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
        .kv th { width: 220px; text-align: left; background: var(--light); color: #4f5d75; font-weight: 600; border: 1px solid var(--border); padding: 6px 8px; font-size: 12px; }
        .kv td { border: 1px solid var(--border); padding: 6px 8px; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
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
        <div class="brandwrap">
          <div class="brand">HOPETRACK</div>
          <div class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
        <div class="photoBox">${raw.profile_picture ? `<img src="${escapeHtml(raw.profile_picture)}" />` : `<span style="font-size:11px;color:#6b7b93;">Photo</span>`}</div>
      </div>
      <div class="container">
        <div class="section-title">Case Summary</div>
        <div class="section">
          <table class="kv">
            ${kv('First Name', c.first_name)}
            ${kv('Last Name', c.last_name)}
            ${kv('Middle Name', c.middle_name)}
            ${kv('Nickname', c.nickname)}
            ${kv('Sex', c.sex)}
            ${kv('Birthdate', toDateOnly(c.birthdate))}
            ${kv('Age', c.age)}
            ${kv('Status', c.status)}
            ${kv('Nationality', c.nationality)}
            ${kv('Religion', c.religion)}
            ${kv('Birthplace', c.birthplace)}
            ${kv('Present Address', c.present_address || c.address)}
            ${kv('Provincial Address', c.provincial_address)}
            ${kv('Guardian Relation', raw.guardian_relation || c.guardian_relation)}
            ${kv('Date of Referral', toDateOnly(c.date_of_referral))}
            ${kv('Source of Referral', c.source_of_referral)}
            ${kv('Other Source of Referral', raw.other_source_of_referral || raw.otherSourceOfReferral)}
            ${kv('Relation to Client', c.relation_to_client)}
            ${kv('Address & Tel', c.address_and_tel)}
            ${kv('Program', c.program_type)}
            ${kv('Assigned Home', c.assigned_house_parent)}
            ${kv('Case Creation Date', toDateOnly(raw.created_at || raw.dateCreated))}
            ${kv('Last Update Date', toDateOnly(raw.updated_at || raw.lastUpdated))}
          </table>
        </div>

        <div class="section-title">Civil Status</div>
        <div class="section">
          <table class="kv">
            ${kv('Married in Church', (raw.married_in_church !== undefined ? (raw.married_in_church ? 'Yes' : 'No') : ''))}
            ${kv('Live-in/Common Law', (raw.live_in_common_law !== undefined ? (raw.live_in_common_law ? 'Yes' : 'No') : ''))}
            ${kv('Civil Marriage', (raw.civil_marriage !== undefined ? (raw.civil_marriage ? 'Yes' : 'No') : ''))}
            ${kv('Separated', (raw.separated !== undefined ? (raw.separated ? 'Yes' : 'No') : ''))}
            ${kv('Marriage Date/Place', raw.marriage_date_place || raw.marriageDatePlace)}
          </table>
        </div>

        <div class="section-title">Parents / Guardian Details</div>
        <div class="section">
          ${renderTable(
            ['Role','Name','Age','Education','Occupation','Other Skills','Address','Income','Living/Deceased','Relation'],
            [
              { Role:'Father', Name: raw.father_name, Age: raw.father_age, Education: raw.father_education, Occupation: raw.father_occupation, 'Other Skills': raw.father_other_skills, Address: raw.father_address, Income: raw.father_income, 'Living/Deceased': raw.father_living === true ? 'Living' : (raw.father_living === false ? 'Deceased' : ''), Relation: '' },
              { Role:'Mother', Name: raw.mother_name, Age: raw.mother_age, Education: raw.mother_education, Occupation: raw.mother_occupation, 'Other Skills': raw.mother_other_skills, Address: raw.mother_address, Income: raw.mother_income, 'Living/Deceased': raw.mother_living === true ? 'Living' : (raw.mother_living === false ? 'Deceased' : ''), Relation: '' },
              { Role:'Guardian', Name: raw.guardian_name, Age: raw.guardian_age, Education: raw.guardian_education, Occupation: raw.guardian_occupation, 'Other Skills': raw.guardian_other_skills, Address: raw.guardian_address, Income: raw.guardian_income, 'Living/Deceased': raw.guardian_deceased === true ? 'Deceased' : (raw.guardian_living === true ? 'Living' : ''), Relation: raw.guardian_relation }
            ]
          )}
        </div>

        <div class="section-title">Family Composition</div>
        <div class="section">
          ${renderTable(
            ['Name','Relation','Age','Sex','Status','Education','Address','Occupation','Income'],
            raw.familyMembers || raw.family_members || raw.family_members_rows || []
          )}
        </div>

        <div class="section-title">Extended Family</div>
        <div class="section">
          ${renderTable(
            ['Name','Relationship','Age','Sex','Status','Education','Occupation','Income'],
            raw.extendedFamily || raw.extended_family || raw.extended_family_rows || []
          )}
        </div>

        <div class="section-title">Educational Attainment</div>
        <div class="section">
          ${renderTable(
            ['Level','School Name','School Address','Year Completed'],
            raw.educationalAttainment || raw.educational_attainment || []
          )}
        </div>

        <div class="section-title">Sacramental Records</div>
        <div class="section">
          ${renderTable(
            ['Sacrament','Date Received','Place/Parish'],
            (raw.sacramentalRecords || raw.sacramental_records || []).map(r => ({
              sacrament: r.sacrament,
              date_received: toDateOnly(r.date_received || r.dateReceived),
              place_parish: r.place_parish
            }))
          )}
        </div>

        <div class="section-title">Agencies / Persons</div>
        <div class="section">
          ${renderTable(
            ['Name','Address/Date/Duration','Services Received'],
            raw.agencies || raw.agencies_persons || []
          )}
        </div>

        <div class="section-title">Life Skills</div>
        <div class="section">
          ${renderTable(
            ['Activity','Date Completed','Performance Rating','Notes'],
            (raw.lifeSkills || raw.life_skills || []).map(r => ({
              activity: r.activity,
              date_completed: toDateOnly(r.date_completed || r.dateCompleted),
              performance_rating: r.performance_rating || r.performanceRating,
              notes: r.notes
            }))
          )}
        </div>

        <div class="section-title">Vital Signs</div>
        <div class="section">
          ${renderTable(
            ['Date Recorded','Blood Pressure','Heart Rate','Temperature','Weight','Height','Notes'],
            (raw.vitalSigns || raw.vital_signs || []).map(r => ({
              date_recorded: toDateOnly(r.date_recorded || r.date),
              blood_pressure: r.blood_pressure || r.bloodPressure,
              heart_rate: r.heart_rate || r.heartRate,
              temperature: r.temperature,
              weight: r.weight,
              height: r.height,
              notes: r.notes
            }))
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

        <div class="section-title">Intervention Plan</div>
        <div class="section">
          ${renderTable(
            ['text','timestamp'],
            parseChecklist(raw.checklist)
          )}
        </div>
      </div>
    </body>
  </html>`;
}

// Build Intake Form-like HTML (mirrors Word layout and signature block)
function buildIntakeHtml(caseData) {
  const c = normalizeCaseData(caseData);
  const raw = caseData || {};
  const toDateOnly = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const s = String(value).trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
    if (m) return m[1];
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:.*)?$/);
    if (us) {
      const mm = us[1].padStart(2,'0');
      const dd = us[2].padStart(2,'0');
      const yyyy = us[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return s;
  };
  const fld = (label, value) => `
    <div class="rowline">
      <div class="label">${escapeHtml(label)}:</div>
      <div class="value">${escapeHtml(value || '')}</div>
    </div>`;
  const long = (label, value) => `
    <div class="block">
      <div class="label">${escapeHtml(label)}</div>
      <div class="long">${escapeHtml(value || '')}</div>
    </div>`;
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>General Intake Form</title>
      <style>
        :root { --text:#222; --muted:#666; --line:#222; }
        * { box-sizing: border-box; }
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--text); margin: 28px; }
        h1 { font-size: 16px; margin: 0 0 12px; }
        .rowline { display: grid; grid-template-columns: 220px 1fr; align-items: center; gap: 12px; margin: 6px 0; }
        .rowline .label { font-weight: 600; color: var(--muted); }
        .rowline .value { border-bottom: 1px solid #999; min-height: 18px; }
        .block { margin: 10px 0 14px; }
        .block .label { font-weight: 600; color: var(--muted); margin-bottom: 4px; }
        .block .long { border: 1px solid #bbb; min-height: 56px; padding: 8px; border-radius: 6px; }
        .sig-top { display: flex; justify-content: center; margin-top: 16px; }
        .sig-line { width: 50%; border-bottom: 2px solid var(--line); height: 0; }
        .sig-title { text-align: center; margin-top: 6px; font-size: 12px; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 18px; }
        .sig-col { }
        .sig-narrow { display: grid; grid-template-columns: 20% 60% 20%; }
        .sig-narrow > div:nth-child(2) { border-bottom: 2px solid var(--line); height: 0; }
        .sig-label { text-align: center; margin: 10px 0; font-size: 12px; }
        .sig-name { text-align: center; margin-top: 6px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>General Intake Form</h1>
      ${fld('Last Name', c.last_name)}
      ${fld('First Name', c.first_name)}
      ${fld('Middle Name', c.middle_name)}
      ${fld('Sex', c.sex)}
      ${fld('Birthdate', toDateOnly(c.birthdate))}
      ${fld('Age', c.age)}
      ${fld('Civil Status', c.civil_status)}
      ${fld('Religion', c.religion)}
      ${fld('Present Address', c.present_address || c.address)}
      ${fld('Provincial Address', c.provincial_address)}
      ${fld('Case Type', c.case_type)}
      ${fld('Assigned House Parent', c.assigned_house_parent)}
      ${fld('Guardian Name', c.guardian_name)}
      ${fld('Guardian Relation', c.guardian_relation)}
      ${long('III. Brief Description of the Client upon Intake', raw.brief_description || raw.client_description || '')}
      ${long('Problem Presented', raw.problem_presented || '')}
      ${long('Brief History', raw.brief_history || '')}
      ${long('Economic Situation', raw.economic_situation || '')}
      ${long('Medical History', raw.medical_history || '')}
      ${long('Family Background', raw.family_background || '')}
      ${long('Assessment', raw.assessment || '')}
      ${long('Recommendation', raw.recommendation || '')}

      <div class="sig-top"><div class="sig-line"></div></div>
      <div class="sig-title">Intake Worker</div>

      <div class="sig-grid">
        <div class="sig-col">
          <div class="sig-label">Recommending Approval:</div>
          <div class="sig-narrow"><div></div><div></div><div></div></div>
          <div class="sig-name">Head, DSWD</div>
        </div>
        <div class="sig-col">
          <div class="sig-label">Approved by:</div>
          <div class="sig-narrow"><div></div><div></div><div></div></div>
          <div class="sig-name">Administrator</div>
        </div>
      </div>
    </body>
  </html>`;
}

// Build consolidated HTML for multiple cases with summary table and per-case sections
function buildMultiCaseHtml(casesList = [], options = {}) {
  const listOnly = !!options.listOnly;
  const list = Array.isArray(casesList) ? casesList : [];
  const formatDate = (dateString) => toDateOnly(dateString);

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
            ${fld('Birthdate', toDateOnly(c.birthdate))}
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
            ${fld('Date of Referral', toDateOnly(c.date_of_referral))}
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
            ['Name','Relation','Age','Sex','Status','Education','Address','Occupation','Income'],
            raw.familyMembers || raw.family_members || raw.family_members_rows || []
          )}
        </div>

        <div class="section-title">Extended Family</div>
        <div class="section">
          ${renderTable(
            ['Name','Relationship','Age','Sex','Status','Education','Occupation','Income'],
            raw.extendedFamily || raw.extended_family || raw.extended_family_rows || []
          )}
        </div>

        <div class="section-title">Educational Attainment</div>
        <div class="section">
          ${renderTable(
            ['Level','School Name','School Address','Year Completed'],
            raw.educationalAttainment || raw.educational_attainment || []
          )}
        </div>

        <div class="section-title">Sacramental Records</div>
        <div class="section">
          ${renderTable(
            ['Sacrament','Date Received','Place/Parish'],
            raw.sacramentalRecords || raw.sacramental_records || []
          )}
        </div>

        <div class="section-title">Agencies / Persons</div>
        <div class="section">
          ${renderTable(
            ['Name','Address/Date/Duration','Services Received'],
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
      margin: opts.margin || { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' },
      displayHeaderFooter: false,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

async function generateIntakePdf(caseData) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  const labelSize = 10;
  const valueSize = 11;
  const drawText = (t, x, y, size = 11) => page.drawText(String(t || ''), { x, y, size, font: helvetica });
  const textWidth = (t, size) => helvetica.widthOfTextAtSize(String(t || ''), size);
  const wrap = (t, maxWidth, size) => {
    const s = String(t || '');
    const words = s.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (textWidth(test, size) <= maxWidth) line = test; else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  };
  const drawRow = (label, value, y) => {
    const xLabel = 40;
    const xValue = 250;
    const maxW = 300;
    drawText(label + ':', xLabel, y, labelSize);
    page.drawRectangle({ x: xValue, y: y - 2, width: maxW, height: 0.8, color: undefined });
    if (value) {
      const lines = wrap(value, maxW, valueSize);
      let yy = y + 2;
      for (const ln of lines) { drawText(ln, xValue, yy, valueSize); yy -= 12; }
    }
  };
  const drawBlock = (label, value, yStart) => {
    const x = 40;
    const w = 515;
    const h = 80;
    drawText(label, x, yStart, labelSize);
    page.drawRectangle({ x, y: yStart - h - 6, width: w, height: h, borderWidth: 1, color: undefined, borderColor: undefined });
    const lines = wrap(value, w - 12, valueSize);
    let yy = yStart - 16;
    for (const ln of lines) { if (yy < 80) break; drawText(ln, x + 6, yy, valueSize); yy -= 12; }
    return yStart - h - 20;
  };
  let y = 780;
  drawText('General Intake Form', 40, y, 12);
  y -= 24;
  const n = (k) => caseData[k] || caseData[k.replace(/([A-Z])/g, '_$1').toLowerCase()];
  const toDateOnly = (v) => {
    if (!v) return '';
    const s = String(v);
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) { const mm = us[1].padStart(2,'0'); const dd = us[2].padStart(2,'0'); return `${us[3]}-${mm}-${dd}`; }
    return s;
  };
  const row = (label, val) => { drawRow(label, val, y); y -= 22; };
  row('Last Name', n('lastName') || n('last_name'));
  row('First Name', n('firstName') || n('first_name'));
  row('Middle Name', n('middleName') || n('middle_name'));
  row('Sex', n('sex'));
  row('Birthdate', toDateOnly(n('birthdate')));
  row('Age', n('age'));
  row('Civil Status', n('civil_status') || n('status'));
  row('Religion', n('religion'));
  row('Present Address', n('present_address') || n('presentAddress') || n('address'));
  row('Provincial Address', n('provincial_address') || n('provincialAddress'));
  row('Case Type', n('case_type') || n('caseType'));
  row('Assigned House Parent', n('assigned_house_parent') || n('assignedHouseParent'));
  row('Guardian Name', n('guardian_name') || n('guardianName'));
  row('Guardian Relation', n('guardian_relation') || n('guardianRelation'));
  y = drawBlock('III. Brief Description of the Client upon Intake', n('brief_description') || n('client_description') || n('clientDescription') || '', y - 12);
  y = drawBlock('Problem Presented', n('problem_presented') || n('problemPresented') || '', y - 6);
  y = drawBlock('Brief History', n('brief_history') || n('briefHistory') || '', y - 6);
  y = drawBlock('Economic Situation', n('economic_situation') || n('economicSituation') || '', y - 6);
  y = drawBlock('Medical History', n('medical_history') || n('medicalHistory') || '', y - 6);
  y = drawBlock('Family Background', n('family_background') || n('familyBackground') || '', y - 6);
  y = drawBlock('Assessment', n('assessment') || '', y - 6);
  y = drawBlock('Recommendation', n('recommendation') || '', y - 6);
  const centerX = 297.5;
  page.drawRectangle({ x: centerX - 110, y: y - 16, width: 220, height: 1.2, color: undefined });
  drawText('Intake Worker', centerX - textWidth('Intake Worker', 12) / 2, y - 30, 12);
  const leftX = 90;
  const rightX = 405;
  drawText('Recommending Approval:', leftX, y - 56, 12);
  page.drawRectangle({ x: leftX, y: y - 78, width: 220, height: 1.2, color: undefined });
  drawText('Head, DSWD', leftX + 110 - textWidth('Head, DSWD', 12) / 2, y - 92, 12);
  drawText('Approved by:', rightX, y - 56, 12);
  page.drawRectangle({ x: rightX, y: y - 78, width: 220, height: 1.2, color: undefined });
  drawText('Administrator', rightX + 110 - textWidth('Administrator', 12) / 2, y - 92, 12);
  return await pdfDoc.save();
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

// POST: Intake-form styled PDF (mirrors Word export layout)
router.post('/case/pdf-intake', auth, async (req, res) => {
  try {
    const pdfBytes = await generateIntakePdf(req.body || {});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-intake.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Intake PDF export error:', err);
    return res.status(500).json({ message: 'Failed to generate Intake PDF', error: err.message });
  }
});

// POST raw DOCX -> PDF via LibreOffice headless (exact 1:1 from Word)
router.post('/case/pdf-from-docx', auth, express.raw({ type: '*/*', limit: '20mb' }), async (req, res) => {
  try {
    const docxBuffer = req.body;
    if (!docxBuffer || !docxBuffer.length) {
      return res.status(400).json({ message: 'No DOCX payload provided' });
    }

    // Write temp DOCX
    const tmpDir = os.tmpdir();
    const id = `${Date.now()}-${Math.floor(Math.random()*1e9)}`;
    const docxPath = path.join(tmpDir, `intake-${id}.docx`);
    const pdfPath = path.join(tmpDir, `intake-${id}.pdf`);
    fs.writeFileSync(docxPath, docxBuffer);

    // Try soffice (LibreOffice) headless conversion
    const sofficeCmd = process.env.LIBREOFFICE_PATH || 'soffice';
    const args = ['--headless', '--convert-to', 'pdf', '--outdir', tmpDir, docxPath];
    await new Promise((resolve, reject) => {
      const p = spawn(sofficeCmd, args, { stdio: 'ignore' });
      p.on('error', reject);
      p.on('exit', (code) => {
        if (code === 0 && fs.existsSync(pdfPath)) return resolve();
        reject(new Error(`LibreOffice conversion failed with code ${code}`));
      });
    });

    const pdfBytes = fs.readFileSync(pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="case-intake.pdf"');
    res.send(Buffer.from(pdfBytes));
    try { fs.unlinkSync(docxPath); fs.unlinkSync(pdfPath); } catch (_) {}
  } catch (err) {
    console.error('DOCX->PDF conversion error:', err);
    return res.status(500).json({ message: 'Failed DOCX→PDF conversion', error: err.message });
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
