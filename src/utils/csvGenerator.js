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
    'Guardian - Age',
    'Guardian - Educational Background',
    'Guardian - Primary Occupation',
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
    formatTextForCSV(caseData.guardianAge || ''),
    formatTextForCSV(caseData.guardianEducation || ''),
    formatTextForCSV(caseData.guardianOccupation || ''),
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
    return downloadCaseReportXLSX(caseData);
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
    const fullName = c?.name || `${c?.firstName || ''} ${c?.middleName || ''} ${c?.lastName || ''}`.trim();
    const program = c?.caseType || c?.programType || '';
    const row = [
      q(fullName),
      calcAge(c?.birthdate),
      q(program),
      formatDate(c?.lastUpdated || c?.updated_at || c?.created_at)
    ].join(',');
    lines.push(row);
  }

  return lines.join('\n');
};

export const downloadAllCasesCSV = (casesData) => {
  try {
    return downloadAllCasesXLSX(casesData);
  } catch (error) {
    console.error('Error generating CSV for all cases:', error);
  }
};

export const downloadAllCasesXLSX = async (casesData) => {
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const wb = XLSX.utils.book_new();
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
    const sheetData = [
      ['Name', 'Age', 'Program', 'Last Updated'],
      ...((casesData || []).map((c) => [
        c?.name || `${c?.firstName || ''} ${c?.middleName || ''} ${c?.lastName || ''}`.trim(),
        calcAge(c?.birthdate),
        c?.caseType || c?.programType || '',
        formatDate(c?.lastUpdated || c?.updated_at || c?.created_at),
      ]))
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HOPETRACK_All_Cases_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating XLSX for all cases:', error);
  }
};

export const downloadCaseReportXLSX = async (caseData) => {
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const wb = XLSX.utils.book_new();
    const d = caseData || {};
    const dateOnly = (x) => toDateOnly(x);

    const section = (title, rows) => {
      const aoa = [['Label', 'Value'], ...rows];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, title);
    };

    section('Personal Information', [
      ['First Name', d.firstName || d.first_name || ''],
      ['Last Name', d.lastName || d.last_name || ''],
      ['Middle Name', d.middleName || d.middle_name || ''],
      ['Sex', d.sex || ''],
      ['Birthdate', dateOnly(d.birthdate)],
      ['Age', d.age || ''],
      ['Status', d.status || ''],
      ['Religion', d.religion || ''],
      ['Nationality', d.nationality || ''],
      ['Nickname', d.nickname || ''],
      ['Birthplace', d.birthplace || ''],
    ]);

    section('Addresses', [
      ['Present Address', d.presentAddress || d.present_address || d.address || ''],
      ['Provincial Address', d.provincialAddress || d.provincial_address || ''],
      ['Address & Tel', d.addressAndTel || d.address_and_tel || ''],
    ]);

    section('Referral', [
      ['Date of Referral', dateOnly(d.dateOfReferral || d.date_of_referral)],
      ['Source of Referral', d.sourceOfReferral || d.source_of_referral || ''],
      ['Relation to Client', d.relationToClient || d.relation_to_client || ''],
    ]);

    section('Case Details', [
      ['Program', d.programType || d.program_type || d.caseType || ''],
      ['Assigned Home', d.assignedHouseParent || d.assigned_house_parent || ''],
      ['Mother', d.motherName || d.mother_name || ''],
      ['Father', d.fatherName || d.father_name || ''],
      ['Guardian', d.guardianName || d.guardian_name || ''],
    ]);

    const fm = d.familyMembers || d.family_members || d.family_members_rows || [];
    if (Array.isArray(fm) && fm.length) {
      const aoa = [['Name','Relation','Age','Sex','Status','Education','Address','Occupation','Income'], ...fm.map(x => [x.name||'',x.relation||'',x.age||'',x.sex||'',x.status||'',x.education||'',x.address||'',x.occupation||'',x.income||''])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Family Composition');
    }

    const ef = d.extendedFamily || d.extended_family || d.extended_family_rows || [];
    if (Array.isArray(ef) && ef.length) {
      const aoa = [['Name','Relationship','Age','Sex','Status','Education','Occupation','Income'], ...ef.map(x => [x.name||'',x.relationship||'',x.age||'',x.sex||'',x.status||'',x.education||'',x.occupation||'',x.income||''])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Extended Family');
    }

    const edu = d.educationalAttainment || d.educational_attainment || [];
    if (Array.isArray(edu) && edu.length) {
      const aoa = [['Level','School Name','School Address','Year'], ...edu.map(x => [x.level||'',x.school_name||'',x.school_address||'',x.year_completed||x.year||''])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Educational Attainment');
    }

    const sac = d.sacramentalRecords || d.sacramental_records || [];
    if (Array.isArray(sac) && sac.length) {
      const aoa = [['Sacrament','Date Received','Place/Parish'], ...sac.map(x => [x.sacrament||'', dateOnly(x.date_received||x.date||''), x.place_parish||''])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Sacramental Records');
    }

    const ag = d.agencies || d.agencies_persons || [];
    if (Array.isArray(ag) && ag.length) {
      const aoa = [['Name','Address/Date/Duration','Services Received'], ...ag.map(x => [x.name||'', x.address_date_duration||'', x.services_received||''])];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Agencies / Persons');
    }

    const narrativeRows = [];
    if (d.problem_presented || d.problemPresented) narrativeRows.push(['Problem Presented', d.problem_presented || d.problemPresented]);
    if (d.brief_history || d.briefHistory) narrativeRows.push(['Brief History', d.brief_history || d.briefHistory]);
    if (d.economic_situation || d.economicSituation) narrativeRows.push(['Economic Situation', d.economic_situation || d.economicSituation]);
    if (d.medical_history || d.medicalHistory) narrativeRows.push(['Medical History', d.medical_history || d.medicalHistory]);
    if (d.family_background || d.familyBackground) narrativeRows.push(['Family Background', d.family_background || d.familyBackground]);
    if (d.client_description || d.clientDescription) narrativeRows.push(['Client Description', d.client_description || d.clientDescription]);
    if (d.parents_description || d.parentsDescription) narrativeRows.push(["Parents' Description", d.parents_description || d.parentsDescription]);
    if (d.recommendation) narrativeRows.push(['Recommendation', d.recommendation]);
    if (d.assessment) narrativeRows.push(['Assessment', d.assessment]);
    if (narrativeRows.length) section('Narrative', narrativeRows);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HOPETRACK_Intake_Form_${(d.name || `${d.firstName || ''}_${d.lastName || ''}` || 'case').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating XLSX for case:', error);
  }
};