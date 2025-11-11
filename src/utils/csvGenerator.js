// Professional CSV Generator for CICL Case Reports
// Provides comprehensive, well-structured CSV exports with enhanced organization and readability
// Designed for professional data analysis and reporting

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
  // Numbers: treat as epoch ms if number; else attempt Date parse
  const d = typeof value === 'number' ? new Date(value) : new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().split('T')[0];
};

export const generateCaseReportCSV = (caseData) => {
  // Enhanced helper to clean and format text for CSV with better handling
  const formatTextForCSV = (text) => {
    if (!text) return '';
    let s = String(text).trim();
    // Force date-only for common date-like strings
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

  // Create CSV content
  const csvContent = [
    '# CHILDREN IN CONFLICT WITH THE LAW (CICL) - INTAKE FORM',
    `# Generated on: ${new Date().toLocaleDateString()}`,
    '# Case Management System Export',
    '',
    csvHeaders.join(','),
    csvData.join(',')
  ].join('\n');

  return csvContent;
};

export const downloadCaseReportCSV = (caseData) => {
  try {
    const csvContent = generateCaseReportCSV(caseData);
    // Prepend BOM for better Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const safeName = (caseData.name || `${caseData.firstName || ''}_${caseData.lastName || ''}` || 'case').replace(/\s+/g, '_');
    link.setAttribute('download', `CICL_Intake_Form_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV:', error);
    alert('Error generating CSV. Please try again.');
  }
};

export const generateAllCasesCSV = (casesData) => {
  if (!Array.isArray(casesData) || casesData.length === 0) {
    return '';
  }

  // Local helpers for consistent formatting
  const q = (text) => {
    if (text === null || text === undefined) return '';
    const clean = String(text)
      .replace(/"/g, '""')
      .replace(/\r\n|\n|\r/g, ' ')
      .trim();
    return `"${clean}"`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const s = String(dateString);
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString().split('T')[0];
  };
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

  // Build summary counts
  const statusCounts = {};
  const programCounts = {};
  for (const c of casesData) {
    const rawStatus = String(c?.status ?? 'Unknown').toLowerCase();
    const normalizedStatus = (rawStatus === 'archived' || rawStatus === 'archives' || rawStatus === 'reintegrate')
      ? 'Archived'
      : (rawStatus === 'active' || c?.isActive === true || rawStatus === 'true') ? 'Active' : (c?.status ?? 'Unknown');
    statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;

    const program = c?.caseType || c?.programType || 'Unknown';
    programCounts[program] = (programCounts[program] || 0) + 1;
  }

  // Compose CSV lines: header block + overview table
  const lines = [];
  // Use date-only to avoid showing timezone/UTC markers in the header
  lines.push(`CICL All Cases Export,${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push(`Summary,Total Cases,${casesData.length}`);
  // Status summary
  Object.keys(statusCounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach(key => lines.push(`Summary,Status,${q(key)},${statusCounts[key]}`));
  // Program summary
  Object.keys(programCounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach(key => lines.push(`Summary,Program,${q(key)},${programCounts[key]}`));
  lines.push('');

  const headers = ['Case ID','Full Name','Gender','Birthdate','Age','Program','Status','Last Updated'];
  lines.push(headers.join(','));

  for (const c of casesData) {
    const fullName = c?.name || `${c?.firstName || ''} ${c?.middleName || ''} ${c?.lastName || ''}`.trim();
    const gender = c?.sex || c?.gender || '';
    const program = c?.caseType || c?.programType || '';
    const status = c?.status || '';

    const row = [
      q(c?.id ?? ''),
      q(fullName),
      q(gender),
      formatDate(c?.birthdate),
      calcAge(c?.birthdate),
      q(program),
      q(status),
      formatDate(c?.lastUpdated || c?.updated_at)
    ].join(',');
    lines.push(row);
  }

  return lines.join('\n');
};

export const downloadAllCasesCSV = (casesData) => {
  try {
    const csvContent = generateAllCasesCSV(casesData);
    // Prepend BOM for better Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `CICL_All_Cases_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV for all cases:', error);
    alert('Error generating CSV for all cases. Please try again.');
  }
};