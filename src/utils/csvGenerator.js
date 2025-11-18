// Professional CSV Generator for CICL Case Reports
// Updated to use CSV templates from public/template when available, with safe fallback
// Templates should use {{placeholders}} matching buildTemplateData keys

// Strict date-only normalizer used across CSV exports
const toDateOnly = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  // If already like YYYY-MM-DD (with or without trailing time), take the date part
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  if (m) return m[1];
  // US-style MM/DD/YYYY
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:.*)?$/);
  if (us) {
    const mm = us[1].padStart(2, '0');
    const dd = us[2].padStart(2, '0');
    const yyyy = us[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // No generic Date parsing; leave non-matching strings untouched
  return s;
};

// Build standardized field map (shared with PDF/Word templates)
const buildTemplateData = (c = {}) => ({
  // Identity
  first_name: c.firstName || c.first_name || '',
  middle_name: c.middleName || c.middle_name || '',
  last_name: c.lastName || c.last_name || '',
  nickname: c.nickname || c.nick_name || '',
  sex: c.sex || '',
  birthdate: toDateOnly(c.birthdate),
  birthplace: c.birthplace || c.birth_place || '',
  age: c.age || '',
  civil_status: c.status || '',
  religion: c.religion || '',
  nationality: c.nationality || '',
  address: c.address || '',
  present_address: c.presentAddress || c.present_address || '',
  provincial_address: c.provincialAddress || c.provincial_address || '',
  barangay: c.barangay || '',
  municipality: c.municipality || '',
  province: c.province || '',
  // Referral
  referral_source: c.sourceOfReferral || c.source_of_referral || '',
  referral_other: c.otherSourceOfReferral || c.other_source_of_referral || '',
  date_of_referral: c.dateOfReferral || c.date_of_referral || '',
  address_and_tel: c.addressAndTel || c.address_and_tel || '',
  relation_to_client: c.relationToClient || c.relation_to_client || '',
  case_type: c.caseType || c.programType || c.program_type || '',
  admission_month: c.admissionMonth || c.admission_month || '',
  admission_year: c.admissionYear || c.admission_year || '',
  assigned_house_parent: c.assignedHouseParent || '',

  father_name: c.fatherName || c.father_name || '',
  father_age: c.fatherAge || c.father_age || '',
  father_education: c.fatherEducation || c.father_education || '',
  father_occupation: c.fatherOccupation || c.father_occupation || '',
  father_other_skills: c.fatherOtherSkills || c.father_other_skills || '',
  father_address: c.fatherAddress || c.father_address || '',
  father_income: c.fatherIncome || c.father_income || '',
  father_living: typeof c.fatherLiving === 'boolean' ? (c.fatherLiving ? 'Yes' : 'No') : (c.fatherLiving || ''),

  mother_name: c.motherName || c.mother_name || '',
  mother_age: c.motherAge || c.mother_age || '',
  mother_education: c.motherEducation || c.mother_education || '',
  mother_occupation: c.motherOccupation || c.mother_occupation || '',
  mother_other_skills: c.motherOtherSkills || c.mother_other_skills || '',
  mother_address: c.motherAddress || c.mother_address || '',
  mother_income: c.motherIncome || c.mother_income || '',
  mother_living: typeof c.motherLiving === 'boolean' ? (c.motherLiving ? 'Yes' : 'No') : (c.motherLiving || ''),

  guardian_name: c.guardianName || c.guardian_name || '',
  guardian_relation: c.guardianRelation || c.guardian_relation || '',
  guardian_age: c.guardianAge || c.guardian_age || '',
  guardian_education: c.guardianEducation || c.guardian_education || '',
  guardian_occupation: c.guardianOccupation || c.guardian_occupation || '',
  guardian_other_skills: c.guardianOtherSkills || c.guardian_other_skills || '',
  guardian_address: c.guardianAddress || c.guardian_address || '',
  guardian_income: c.guardianIncome || c.guardian_income || '',
  guardian_living: typeof c.guardianLiving === 'boolean' ? (c.guardianLiving ? 'Yes' : 'No') : (c.guardianLiving || ''),
  guardian_deceased: typeof c.guardianDeceased === 'boolean' ? (c.guardianDeceased ? 'Yes' : 'No') : (c.guardianDeceased || ''),

  married_in_church: typeof c.marriedInChurch === 'boolean' ? (c.marriedInChurch ? 'Yes' : 'No') : (c.marriedInChurch || ''),
  live_in_common_law: typeof c.liveInCommonLaw === 'boolean' ? (c.liveInCommonLaw ? 'Yes' : 'No') : (c.liveInCommonLaw || ''),
  civil_marriage: typeof c.civilMarriage === 'boolean' ? (c.civilMarriage ? 'Yes' : 'No') : (c.civilMarriage || ''),
  separated: typeof c.separated === 'boolean' ? (c.separated ? 'Yes' : 'No') : (c.separated || ''),
  marriage_date_place: c.marriageDatePlace || c.marriage_date_place || '',

  brief_description: c.briefDescription || '',
  problem_presented: c.problemPresented || c.problem_presented || '',
  brief_history: c.briefHistory || c.brief_history || '',
  economic_situation: c.economicSituation || c.economic_situation || '',
  medical_history: c.medicalHistory || c.medical_history || '',
  family_background: c.familyBackground || c.family_background || '',
  assessment: c.assessment || '',
  recommendation: c.recommendation || ''
});

const escapeForCSVCell = (value) => {
  if (value === null || value === undefined) return '';
  const clean = String(value).replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ').trim();
  return clean;
};

const replacePlaceholders = (templateText, dataMap) => {
  let out = String(templateText);
  for (const [key, val] of Object.entries(dataMap)) {
    const safeVal = escapeForCSVCell(val);
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    out = out.replace(re, safeVal);
  }
  return out;
};

export const generateCaseReportCSV = (caseData) => {
  // Enhanced helper to clean and format text for CSV with better handling
  const formatTextForCSV = (text) => {
    if (!text) return '';
    let s = String(text).trim();
    // Normalize embedded date-like tokens inside free text
    // ISO-like tokens: 2020-01-02T00:00:00.000Z -> 2020-01-02
    s = s.replace(/(\d{4}-\d{2}-\d{2})[T\s][0-9:.+\-Z]+/g, '$1');
    // US-style tokens: 2/1/2017 -> 2017-02-01
    s = s.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (_, mm, dd, yyyy) => `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
    // If the entire string is a date, enforce date-only
    s = toDateOnly(s);
    const cleanText = s
      .replace(/"/g, '""')
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ');
    return `"${cleanText}"`;
  };

  // Professional date formatting for Excel compatibility (date-only, timezone-agnostic)
  const formatDateForExcel = (dateString) => {
    return toDateOnly(dateString);
  };

  // Enhanced boolean formatting with clear indicators
  const formatBoolean = (value) => {
    if (typeof value === 'boolean') return value ? 'YES' : 'NO';
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') return 'YES';
      if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') return 'NO';
    }
    return value || '';
  };

  // Professional numeric formatting
  const formatNumeric = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toString();
  };

  // Enhanced family members data flattening with better structure
  const flattenFamilyMembers = (members) => {
    if (!Array.isArray(members) || members.length === 0) return '';
    return members.map((member, index) => {
      const memberData = [
        `[${index + 1}] ${member.name || 'N/A'}`,
        `Relation: ${member.relation || 'N/A'}`,
        `Age: ${member.age || 'N/A'}`,
        `Gender: ${member.sex || 'N/A'}`,
        `Civil Status: ${member.status || 'N/A'}`,
        `Education: ${member.education || 'N/A'}`,
        `Occupation: ${member.occupation || 'N/A'}`,
        `Monthly Income: ₱${member.income || 'N/A'}`,
        `Address: ${member.address || 'N/A'}`
      ].filter(part => !part.includes(': N/A')).join(' | ');
      return memberData;
    }).join(' || ');
  };

  // Enhanced extended family data flattening with professional structure
  const flattenExtendedFamily = (members) => {
    if (!Array.isArray(members) || members.length === 0) return '';
    return members.map((member, index) => {
      const memberData = [
        `[${index + 1}] ${member.name || 'N/A'}`,
        `Relationship: ${member.relationship || 'N/A'}`,
        `Age: ${member.age || 'N/A'}`,
        `Gender: ${member.sex || 'N/A'}`,
        `Civil Status: ${member.status || 'N/A'}`,
        `Education: ${member.education || 'N/A'}`,
        `Occupation: ${member.occupation || 'N/A'}`,
        `Monthly Income: ₱${member.income || 'N/A'}`
      ].filter(part => !part.includes(': N/A')).join(' | ');
      return memberData;
    }).join(' || ');
  };

  // Professional educational attainment formatting with enhanced structure
  const flattenEducationalAttainment = (edu) => {
    if (!edu) return '';
    const levels = [
      { key: 'elementary', label: 'Elementary Education' },
      { key: 'highSchool', label: 'High School' },
      { key: 'seniorHighSchool', label: 'Senior High School' },
      { key: 'vocationalCourse', label: 'Vocational/Technical Course' },
      { key: 'college', label: 'College/University' },
      { key: 'others', label: 'Other Educational Programs' }
    ];
    
    return levels.map(({ key, label }) => {
      const level = edu[key] || {};
      if (!level.schoolName && !level.schoolAddress && !level.year) return '';
      return `${label}: Institution="${level.schoolName || 'Not Specified'}" | Location="${level.schoolAddress || 'Not Specified'}" | Year Completed="${level.year || 'Not Specified'}"`;
    }).filter(Boolean).join(' || ');
  };

  // Professional sacramental record formatting with enhanced clarity
  const flattenSacramentalRecord = (sr) => {
    if (!sr) return '';
    const sacraments = [
      { key: 'baptism', label: 'Holy Baptism' },
      { key: 'firstCommunion', label: 'First Holy Communion' },
      { key: 'confirmation', label: 'Confirmation' },
      { key: 'others', label: 'Other Sacraments' }
    ];
    
    return sacraments.map(({ key, label }) => {
      const sacrament = sr[key] || {};
      if (!sacrament.dateReceived && !sacrament.placeParish) return '';
      return `${label}: Date Received="${sacrament.dateReceived || 'Not Recorded'}" | Church/Parish="${sacrament.placeParish || 'Not Recorded'}"`;
    }).filter(Boolean).join(' || ');
  };

  // Professional agencies/persons contacted formatting
  const flattenAgencies = (agencies) => {
    if (!agencies) return '';
    if (!Array.isArray(agencies)) return String(agencies);
    return agencies
      .filter(agency => agency && (agency.name || agency.addressDateDuration || agency.servicesReceived))
      .map((agency, index) => 
        `[${index + 1}] Organization: "${agency.name || 'Not Specified'}" | Contact Details/Duration: "${agency.addressDateDuration || 'Not Specified'}" | Services Provided: "${agency.servicesReceived || 'Not Specified'}"`
      ).join(' || ');
  };

  // Professional life skills tracking formatting
  const flattenLifeSkills = (lifeSkills) => {
    if (!Array.isArray(lifeSkills) || lifeSkills.length === 0) return '';
    return lifeSkills.map((skill, index) => 
      `[${index + 1}] Activity: "${skill.activity || 'Not Specified'}" | Completion Date: "${skill.date_completed ? formatDateForExcel(skill.date_completed) : 'Not Completed'}" | Performance Rating: "${skill.performance_rating || 'Not Rated'}" | Progress Notes: "${skill.notes || 'No Notes'}"`
    ).join(' || ');
  };

  // Professional vital signs monitoring formatting
  const flattenVitalSigns = (vitalSigns) => {
    if (!Array.isArray(vitalSigns) || vitalSigns.length === 0) return '';
    return vitalSigns.map((vital, index) => 
      `[${index + 1}] Date Recorded: "${vital.date_recorded ? formatDateForExcel(vital.date_recorded) : 'Not Recorded'}" | Blood Pressure: "${vital.blood_pressure || 'Not Measured'}" | Heart Rate: "${vital.heart_rate || 'Not Measured'}" | Temperature: "${vital.temperature || 'Not Measured'}" | Weight: "${formatNumeric(vital.weight) || 'Not Measured'}" | Height: "${formatNumeric(vital.height) || 'Not Measured'}" | Medical Notes: "${vital.notes || 'No Notes'}"`
    ).join(' || ');
  };

  // Professional CSV headers with enhanced organization and clarity
  const csvHeaders = [
    // SECTION I: CLIENT IDENTIFICATION & BASIC INFORMATION
    'Case ID',
    'Last Name',
    'First Name', 
    'Middle Name',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Age (Years)',
    'Civil Status',
    'Religious Affiliation',
    'Current Address',
    'Primary Source of Referral',
    'Other Source of Referral',
    'Case Classification',
    'Assigned House Parent/Guardian',
    'Case Creation Date',
    'Last Update Date',
    
    // SECTION II: FAMILY & HOUSEHOLD COMPOSITION
    'Father - Full Name',
    'Father - Age',
    'Father - Educational Background',
    'Father - Primary Occupation',
    'Father - Additional Skills',
    'Father - Current Address',
    'Father - Monthly Income (₱)',
    'Father - Living Status',
    'Mother - Full Name',
    'Mother - Age', 
    'Mother - Educational Background',
    'Mother - Primary Occupation',
    'Mother - Additional Skills',
    'Mother - Current Address',
    'Mother - Monthly Income (₱)',
    'Mother - Living Status',
    'Guardian - Full Name',
    'Guardian - Relationship to Client',
    'Guardian - Current Address',
    'Parents - Married in Church',
    'Parents - Living in Common Law',
    'Parents - Civil Marriage',
    'Parents - Separated/Divorced',
    'Marriage Date and Place',
    
    // III. BRIEF DESCRIPTION OF THE CLIENT UPON INTAKE
    
    // SECTION III: CLIENT ASSESSMENT & BACKGROUND
    'Brief Description of Client Upon Intake',
    'Primary Problem Presented',
    'Brief History of the Problem',
    'Economic Situation Analysis',
    'Medical History Summary',
    'Family Background Information',
    
    // SECTION IV: PROFESSIONAL ASSESSMENT & RECOMMENDATIONS
    'Professional Assessment',
    'Recommendations & Action Plan',
    
    // SECTION V: EDUCATIONAL & SPIRITUAL DEVELOPMENT
    'Educational Attainment Records',
    'Sacramental Records',
    
    // SECTION VI: FAMILY & SOCIAL NETWORK
    'Family Members (Siblings/Children)',
    'Extended Family Network',
    'Agencies/Organizations Contacted',
    
    // SECTION VII: SKILLS DEVELOPMENT & HEALTH MONITORING
    'Life Skills Development Activities',
    'Vital Signs & Health Records',
    
    // SECTION VIII: CASE MANAGEMENT & PROGRESS
    'Intervention Plan',
    'Case Notes',
    'Progress Updates',
    'Current Case Status'
  ];

  // Create CSV data row
  const csvData = [
    // I. CLIENT'S IDENTIFYING INFORMATION
    formatTextForCSV(caseData.id || ''),
    formatTextForCSV(caseData.lastName || ''),
    formatTextForCSV(caseData.firstName || ''),
    formatTextForCSV(caseData.middleName || ''),
    formatTextForCSV(caseData.name || `${caseData.firstName || ''} ${caseData.middleName || ''} ${caseData.lastName || ''}`.trim()),
    formatTextForCSV(caseData.sex || ''),
    formatDateForExcel(caseData.birthdate),
    formatTextForCSV(caseData.age || ''),
    formatTextForCSV(caseData.status || ''),
    formatTextForCSV(caseData.religion || ''),
    formatTextForCSV(caseData.address || ''),
    formatTextForCSV(caseData.sourceOfReferral || ''),
    formatTextForCSV(caseData.otherSourceOfReferral || ''),
    formatTextForCSV(caseData.caseType || caseData.programType || ''),
    formatTextForCSV(caseData.assignedHouseParent || ''),
    formatDateForExcel(caseData.created_at || caseData.dateCreated),
    formatDateForExcel(caseData.updated_at || caseData.lastUpdated),
    
    // II. FAMILY/HOUSEHOLD COMPOSITION
    formatTextForCSV(caseData.fatherName || ''),
    formatTextForCSV(caseData.fatherAge || ''),
    formatTextForCSV(caseData.fatherEducation || ''),
    formatTextForCSV(caseData.fatherOccupation || ''),
    formatTextForCSV(caseData.fatherOtherSkills || ''),
    formatTextForCSV(caseData.fatherAddress || ''),
    formatTextForCSV(caseData.fatherIncome || ''),
    formatTextForCSV(formatBoolean(caseData.fatherLiving)),
    formatTextForCSV(caseData.motherName || ''),
    formatTextForCSV(caseData.motherAge || ''),
    formatTextForCSV(caseData.motherEducation || ''),
    formatTextForCSV(caseData.motherOccupation || ''),
    formatTextForCSV(caseData.motherOtherSkills || ''),
    formatTextForCSV(caseData.motherAddress || ''),
    formatTextForCSV(caseData.motherIncome || ''),
    formatTextForCSV(formatBoolean(caseData.motherLiving)),
    formatTextForCSV(caseData.guardianName || ''),
    formatTextForCSV(caseData.guardianRelation || ''),
    formatTextForCSV(caseData.guardianAddress || ''),
    formatTextForCSV(formatBoolean(caseData.marriedInChurch)),
    formatTextForCSV(formatBoolean(caseData.liveInCommonLaw)),
    formatTextForCSV(formatBoolean(caseData.civilMarriage)),
    formatTextForCSV(formatBoolean(caseData.separated)),
    formatTextForCSV(caseData.marriageDatePlace || ''),
    
    // III-X. NARRATIVE SECTIONS
    formatTextForCSV(caseData.briefDescription || ''),
    formatTextForCSV(caseData.problemPresented || caseData.problem_presented || ''),
    formatTextForCSV(caseData.briefHistory || caseData.brief_history || ''),
    formatTextForCSV(caseData.economicSituation || caseData.economic_situation || ''),
    formatTextForCSV(caseData.medicalHistory || caseData.medical_history || ''),
    formatTextForCSV(caseData.familyBackground || caseData.family_background || ''),
    formatTextForCSV(caseData.assessment || ''),
    formatTextForCSV(caseData.recommendation || ''),
    
    // XI-XVIII. STRUCTURED DATA SECTIONS
    formatTextForCSV(flattenEducationalAttainment(caseData.educationalAttainment)),
    formatTextForCSV(flattenSacramentalRecord(caseData.sacramentalRecord)),
    formatTextForCSV(flattenFamilyMembers(caseData.familyMembers)),
    formatTextForCSV(flattenExtendedFamily(caseData.extendedFamily)),
    formatTextForCSV(flattenAgencies(caseData.agencies)),
    formatTextForCSV(flattenLifeSkills(caseData.lifeSkills)),
    formatTextForCSV(flattenVitalSigns(caseData.vitalSigns)),
    formatTextForCSV(caseData.interventionPlan || ''),
    
    // Additional Fields
    formatTextForCSV(caseData.notes || caseData.additional_notes || ''),
    formatTextForCSV(caseData.progress || ''),
    formatTextForCSV(caseData.status || '')
  ];

  // Clean, professional CSV: header + single data row, no comment lines
  const csvContent = [
    csvHeaders.join(','),
    csvData.join(',')
  ].join('\n');

  return csvContent;
};

export const downloadCaseReportCSV = (caseData) => {
  try {
    const fileName = `HOPETRACK_Intake_Form_${(caseData.name || `${caseData.firstName || ''}_${caseData.lastName || ''}` || 'case').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    const safe = (v) => (v === null || v === undefined) ? '' : String(v);
    const d = caseData || {};
    const t = buildTemplateData(d);
    const fm = d.familyMembers || d.family_members || d.family_members_rows || [];
    const ef = d.extendedFamily || d.extended_family || d.extended_family_rows || [];
    const edu = d.educationalAttainment || d.educational_attainment || [];
    const sac = d.sacramentalRecord || d.sacramental_records || [];
    const ag = d.agencies || d.agencies_persons || [];
    const ls = d.lifeSkills || d.life_skills || [];
    const vs = d.vitalSigns || d.vital_signs || [];
    let checklistItems = [];
    try {
      const cl = d.checklist;
      if (Array.isArray(cl)) checklistItems = cl;
      else if (typeof cl === 'string' && cl.trim() !== '') {
        const parsed = JSON.parse(cl);
        checklistItems = Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
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
    const hasRows = (arr) => Array.isArray(arr) && arr.length > 0;
    const familyRows = hasRows(fm) ? fm.map(x => `<tr><td>${safe(x.name)}</td><td>${safe(x.relation)}</td><td>${safe(x.age)}</td><td>${safe(x.sex)}</td><td>${safe(x.status)}</td><td>${safe(x.education)}</td><td>${safe(x.address)}</td><td>${safe(x.occupation)}</td><td>${safe(x.income)}</td></tr>`).join('') : '';
    const extRows = hasRows(ef) ? ef.map(x => `<tr><td>${safe(x.name)}</td><td>${safe(x.relationship)}</td><td>${safe(x.age)}</td><td>${safe(x.sex)}</td><td>${safe(x.status)}</td><td>${safe(x.education)}</td><td>${safe(x.occupation)}</td><td>${safe(x.income)}</td></tr>`).join('') : '';
    const eduItems = Array.isArray(edu) ? edu : Object.entries(edu || {}).map(([lvl, rec]) => ({
      level: lvl,
      school_name: (rec && (rec.school_name || rec.schoolName)) || '',
      school_address: (rec && (rec.school_address || rec.schoolAddress)) || '',
      year: (rec && (rec.year || rec.year_completed)) || ''
    }));
    const eduRows = hasRows(eduItems) ? eduItems.map(x => `<tr><td>${safe(x.level)}</td><td>${safe(x.school_name || x.schoolName)}</td><td>${safe(x.school_address || x.schoolAddress)}</td><td>${safe(x.year_completed || x.year)}</td></tr>`).join('') : '';
    const sacItems = Array.isArray(sac) ? sac : Object.entries(sac || {}).map(([key, rec]) => ({
      sacrament: key === 'firstCommunion' ? 'First Communion' : (key.charAt(0).toUpperCase() + key.slice(1)),
      date: (rec && (rec.date_received || rec.dateReceived)) || '',
      place_parish: (rec && (rec.place_parish || rec.placeParish)) || ''
    }));
    const sacRows = hasRows(sacItems) ? sacItems.map(x => `<tr><td>${safe(x.sacrament)}</td><td>${safe(toDateOnly(x.date))}</td><td>${safe(x.place_parish)}</td></tr>`).join('') : '';
    const agRows = hasRows(ag) ? ag.map(x => `<tr><td>${safe(x.name)}</td><td>${safe(x.addressDateDuration || x.address_date_duration)}</td><td>${safe(x.servicesReceived || x.services_received)}</td></tr>`).join('') : '';
    const html = `<!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" />
      <meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=utf-8" />
      <meta name="ProgId" content="Excel.Sheet" />
      <meta name="Generator" content="HOPETRACK" />
      <title>HOPETRACK Intake Form</title>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Intake</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <style>
        body { font-family: Segoe UI, Arial, sans-serif; }
        .section-title { background:#2C5282; color:#fff; font-weight:600; padding:6px 8px; }
        table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        th, td { border: 1px solid #cbd5e0; padding: 6px 8px; text-align: left; }
        th { background: #edf2f7; }
        .label { width: 30%; font-weight:600; }
      </style>
    </head><body>
      <div class="section-title">Personal Information</div>
      <table>
        <tr><td class="label">First Name</td><td>${safe(d.firstName || d.first_name)}</td></tr>
        <tr><td class="label">Last Name</td><td>${safe(d.lastName || d.last_name)}</td></tr>
        <tr><td class="label">Middle Name</td><td>${safe(d.middleName || d.middle_name)}</td></tr>
        <tr><td class="label">Nickname</td><td>${safe(d.nickname)}</td></tr>
        <tr><td class="label">Sex</td><td>${safe(d.sex)}</td></tr>
        <tr><td class="label">Birthdate</td><td>${safe(toDateOnly(d.birthdate))}</td></tr>
        <tr><td class="label">Age</td><td>${safe(calcAge(d.birthdate))}</td></tr>
        <tr><td class="label">Status</td><td>${safe(d.status)}</td></tr>
        <tr><td class="label">Nationality</td><td>${safe(d.nationality)}</td></tr>
        <tr><td class="label">Religion</td><td>${safe(d.religion)}</td></tr>
        <tr><td class="label">Birthplace</td><td>${safe(d.birthplace)}</td></tr>
      </table>
      <div class="section-title">Addresses</div>
      <table>
        <tr><td class="label">Present Address</td><td>${safe(t.present_address || d.presentAddress || d.present_address || d.address)}</td></tr>
        <tr><td class="label">Provincial Address</td><td>${safe(t.provincial_address || d.provincialAddress || d.provincial_address)}</td></tr>
      </table>
      <div class="section-title">Referral</div>
      <table>
        <tr><td class="label">Date of Referral</td><td>${safe(toDateOnly(d.dateOfReferral || d.date_of_referral))}</td></tr>
        <tr><td class="label">Source of Referral</td><td>${safe(d.sourceOfReferral || d.source_of_referral)}</td></tr>
        <tr><td class="label">Other Source of Referral</td><td>${safe(d.otherSourceOfReferral || d.other_source_of_referral)}</td></tr>
        <tr><td class="label">Relation to Client</td><td>${safe(d.relationToClient || d.relation_to_client)}</td></tr>
        <tr><td class="label">Address & Tel</td><td>${safe(d.addressAndTel || d.address_and_tel)}</td></tr>
      </table>
      <div class="section-title">Case Details</div>
      <table>
        <tr><td class="label">Program</td><td>${safe(d.programType || d.program_type || d.caseType)}</td></tr>
        <tr><td class="label">Assigned Home</td><td>${safe(d.assignedHouseParent || d.assigned_house_parent)}</td></tr>
        <tr><td class="label">Case Creation Date</td><td>${safe(toDateOnly(d.created_at || d.dateCreated))}</td></tr>
        <tr><td class="label">Last Update Date</td><td>${safe(toDateOnly(d.updated_at || d.lastUpdated))}</td></tr>
      </table>
      <div class="section-title">Family / Household Composition</div>
      <table>
        <thead><tr><th>Name</th><th>Relation</th><th>Age</th><th>Sex</th><th>Status</th><th>Education</th><th>Address</th><th>Occupation</th><th>Income</th></tr></thead>
        <tbody>${familyRows}</tbody>
      </table>
      <div class="section-title">Others: Extended Family</div>
      <table>
        <thead><tr><th>Name</th><th>Relationship</th><th>Age</th><th>Sex</th><th>Status</th><th>Education</th><th>Occupation</th><th>Income</th></tr></thead>
        <tbody>${extRows}</tbody>
      </table>
      <div class="section-title">Educational Attainment</div>
      <table>
        <thead><tr><th>Level</th><th>Name of School</th><th>School Address</th><th>Year</th></tr></thead>
        <tbody>${eduRows}</tbody>
      </table>
      <div class="section-title">Sacramental Record</div>
      <table>
        <thead><tr><th>Sacrament</th><th>Date Received</th><th>Place/Parish</th></tr></thead>
        <tbody>${sacRows}</tbody>
      </table>
      <div class="section-title">Name of Agencies / Persons</div>
      <table>
        <thead><tr><th>Name of agencies/persons</th><th>Address/date/duration</th><th>Services received</th></tr></thead>
        <tbody>${agRows}</tbody>
      </table>
      ${hasRows(ls) ? `<div class="section-title">Life Skills</div>
      <table>
        <thead><tr><th>Activity</th><th>Date Completed</th><th>Performance Rating</th><th>Notes</th></tr></thead>
        <tbody>${ls.map(x => `<tr><td>${safe(x.activity)}</td><td>${safe(toDateOnly(x.date_completed || x.dateCompleted))}</td><td>${safe(x.performance_rating || x.performanceRating)}</td><td>${safe(x.notes)}</td></tr>`).join('')}</tbody>
      </table>` : ''}
      ${hasRows(vs) ? `<div class="section-title">Vital Signs</div>
      <table>
        <thead><tr><th>Date Recorded</th><th>Blood Pressure</th><th>Heart Rate</th><th>Temperature</th><th>Weight</th><th>Height</th><th>Notes</th></tr></thead>
        <tbody>${vs.map(x => `<tr><td>${safe(toDateOnly(x.date_recorded || x.date))}</td><td>${safe(x.blood_pressure || x.bloodPressure)}</td><td>${safe(x.heart_rate || x.heartRate)}</td><td>${safe(x.temperature)}</td><td>${safe(x.weight)}</td><td>${safe(x.height)}</td><td>${safe(x.notes)}</td></tr>`).join('')}</tbody>
      </table>` : ''}
      <div class="section-title">Narrative</div>
      <table>
        <tr><td class="label">Client</td><td>${safe(d.client_description || d.clientDescription)}</td></tr>
        <tr><td class="label">Parents/Relatives/Guardian</td><td>${safe(d.parents_description || d.parentsDescription)}</td></tr>
        <tr><td class="label">Problem Presented</td><td>${safe(d.problem_presented || d.problemPresented)}</td></tr>
        <tr><td class="label">Brief History</td><td>${safe(d.brief_history || d.briefHistory)}</td></tr>
        <tr><td class="label">Economic Situation</td><td>${safe(d.economic_situation || d.economicSituation)}</td></tr>
        <tr><td class="label">Medical History</td><td>${safe(d.medical_history || d.medicalHistory)}</td></tr>
        <tr><td class="label">Family Background</td><td>${safe(d.family_background || d.familyBackground)}</td></tr>
        <tr><td class="label">Recommendation</td><td>${safe(d.recommendation)}</td></tr>
        <tr><td class="label">Assessment</td><td>${safe(d.assessment)}</td></tr>
      </table>
      ${hasRows(checklistItems) ? `<div class="section-title">Intervention Plan</div>
      <table>
        <thead><tr><th>Item</th><th>Timestamp</th></tr></thead>
        <tbody>${checklistItems.map(x => `<tr><td>${safe(x.text || '')}</td><td>${safe(x.timestamp || '')}</td></tr>`).join('')}</tbody>
      </table>` : ''}
    </body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV:', error);
  }
};

export const generateAllCasesCSV = (casesData) => {
  if (!Array.isArray(casesData) || casesData.length === 0) return '';

  const q = (text) => {
    if (text === null || text === undefined) return '';
    const clean = String(text).replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ').trim();
    return `"${clean}"`;
  };
  const formatDate = (dateString) => toDateOnly(dateString);
  const calcAge = (birthdate) => {
    if (!birthdate) return '';
    const d = new Date(birthdate);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const lines = [];
  const headers = ['Name','Age','Program','Last Updated'];
  lines.push(headers.join(','));

  for (const c of casesData) {
    const fullName = c?.name || `${c?.firstName || c?.first_name || ''} ${c?.middleName || c?.middle_name || ''} ${c?.lastName || c?.last_name || ''}`.trim();
    const program = c?.caseType || c?.programType || c?.program_type || c?.case_type || '';
    const computedAge = calcAge(c?.birthdate);
    const ageOut = (computedAge !== '' && computedAge !== null && computedAge !== undefined)
      ? computedAge
      : (typeof c?.age === 'number' ? c.age : (c?.age || ''));
    const row = [
      q(fullName),
      ageOut,
      q(program),
      formatDate(c?.lastUpdated || c?.updated_at || c?.created_at)
    ].join(',');
    lines.push(row);
  }

  return lines.join('\n');
};

export const downloadAllCasesCSV = (casesData) => {
  try {
    const fileName = `HOPETRACK_All_Cases_${new Date().toISOString().split('T')[0]}.xls`;
    const title = 'HOPETRACK All Cases';
    const safe = (v) => (v === null || v === undefined) ? '' : String(v);
    const formatDate = (dateString) => toDateOnly(dateString);
    const calcAge = (birthdate) => {
      if (!birthdate) return '';
      const d = new Date(birthdate);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
      return age;
    };
    const rowsHtml = (casesData || []).map((c) => {
      const fullName = c?.name || `${c?.firstName || c?.first_name || ''} ${c?.middleName || c?.middle_name || ''} ${c?.lastName || c?.last_name || ''}`.trim();
      const program = c?.caseType || c?.programType || c?.program_type || c?.case_type || '';
      const computedAge = calcAge(c?.birthdate);
      const ageOut = (computedAge !== '' && computedAge !== null && computedAge !== undefined)
        ? computedAge
        : (typeof c?.age === 'number' ? c.age : (c?.age || ''));
      return `<tr>
        <td style="text-align:center;">${safe(fullName)}</td>
        <td style="text-align:center;">${safe(ageOut)}</td>
        <td style="text-align:center;">${safe(program)}</td>
        <td style="text-align:center;">${safe(formatDate(c?.lastUpdated || c?.updated_at || c?.created_at))}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" />
      <meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=utf-8" />
      <meta name="ProgId" content="Excel.Sheet" />
      <meta name="Generator" content="HOPETRACK" />
      <title>${title}</title>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>All Cases</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <style>
        body { font-family: Segoe UI, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e0; padding: 6px 8px; font-size: 12px; text-align: center; }
        th { background: #edf2f7; }
      </style>
    </head><body>
      <table>
        <thead>
          <tr><th>Name</th><th>Age</th><th>Program</th><th>Last Updated</th></tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV for all cases:', error);
  }
};