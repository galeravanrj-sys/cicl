import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import { fetchCaseDetailsForExport } from './exportHelpers';
const pdfTheme = {
  colors: {
    primary: [41, 128, 185],
    secondary: [52, 73, 94],
    accent: [231, 76, 60],
    light: [236, 240, 241],
    text: [44, 62, 80]
  },
  type: {
    h1: 18,
    h2: 14,
    body: 10,
    label: 9
  },
  grid: {
    row: 8
  }
};

export const generateCaseReportPDF = (caseData, opts = {}) => {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = 25;
  const theme = {
    colors: { ...pdfTheme.colors, ...(((opts.theme && opts.theme.colors) || {})) },
    type: { ...pdfTheme.type, ...(((opts.theme && opts.theme.type) || {})) },
    grid: { ...pdfTheme.grid, ...(((opts.theme && opts.theme.grid) || {})) }
  };
  const gap = theme.grid.row;

  const colors = theme.colors;

  // Helper function to add professional header with logo area
  const addFormHeader = () => {
    // Add header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Organization header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(theme.type.h1);
    doc.setFont('helvetica', 'bold');
    {
      const title = (opts.branding && opts.branding.title) || 'HOPETRACK';
      doc.text(title, pageWidth / 2, 15, { align: 'center' });
    }
    
    doc.setFontSize(theme.type.h2);
    doc.setFont('helvetica', 'normal');
    const sub = (opts.branding && opts.branding.subtitle) || 'INTAKE FORM';
    doc.text(sub, pageWidth / 2, 25, { align: 'center' });

    try {
      if (opts.logoDataUrl) {
        doc.addImage(opts.logoDataUrl, 'PNG', margin - 5, 6, 24, 24, undefined, 'FAST');
      }
    } catch (_) {}
    
    // Reset text color
    doc.setTextColor(...colors.text);
    yPosition = 45;

    // Add professional border
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, 40, pageWidth - 2 * (margin - 5), pageHeight - 80, 'S');

    // Add date and case info in professional format
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Report Generated: ${currentDate}`, pageWidth - margin, yPosition - 5, { align: 'right' });
    
    if (caseData.id) {
      doc.text(`Case ID: ${caseData.id}`, margin, yPosition - 5);
    }

    try {
      if (opts.photoDataUrl) {
        const w = 22, h = 22;
        doc.addImage(opts.photoDataUrl, 'PNG', pageWidth - margin - w, 8, w, h, undefined, 'FAST');
      }
    } catch (_) {}
    
    yPosition += 10;
  };

  // Enhanced section header with professional styling
  const addSectionHeader = (title, y) => {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 30;
    }

    // Section background
    doc.setFillColor(...colors.light);
    doc.rect(margin - 5, y - 5, pageWidth - 2 * (margin - 5), 12, 'F');
    
    // Section border
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(margin - 5, y + 7, pageWidth - margin + 5, y + 7);
    
    // Section title
    doc.setTextColor(...colors.secondary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y + 2);
    
    // Reset text color
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'normal');
    
    return y + 18;
  };

  addFormHeader();

  // Enhanced form field function with professional styling
  const addFormField = (label, value, x, y, width = 60) => {
    doc.setFontSize(theme.type.label);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.secondary);
    doc.text(`${label}:`, x, y);
    
    // Professional field styling
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.3);
    doc.line(x + labelWidth, y + 1, x + width, y + 1);
    
    // Add value with proper formatting
    if (value) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(String(value), x + labelWidth + 2, y);
    }
    
    return y + gap;
  };

  // Enhanced text area function
  const addTextArea = (label, value, y, height = 25) => {
    // Check if we need a new page
    if (y + height > pageHeight - 40) {
      doc.addPage();
      y = 30;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.secondary);
    doc.text(`${label}:`, margin, y);
    
    // Professional text area border
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.rect(margin, y + 3, pageWidth - 2 * margin, height, 'S');
    
    // Add content with proper text wrapping
    if (value) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.setFontSize(9);
      
      const lines = doc.splitTextToSize(String(value), pageWidth - 2 * margin - 4);
      let textY = y + 10;
      
      lines.forEach((line, index) => {
        if (textY < y + height - 3) {
          doc.text(line, margin + 2, textY);
          textY += 4;
        }
      });
    }
    
    return y + height + 8;
  };

  // Personal Information Section with enhanced layout
  yPosition = addSectionHeader('I. CLIENT\'S IDENTIFYING INFORMATION', yPosition);
  
  // Create professional form layout
  let currentY = yPosition;
  
  // Row 1: Name fields with better spacing
  currentY = addFormField('Last Name', caseData.lastName || '', margin, currentY, 55);
  addFormField('First Name', caseData.firstName || '', margin + 60, currentY - gap, 55);
  currentY = addFormField('Middle Name', caseData.middleName || '', margin + 125, currentY - gap, 55);

  // Row 2: Personal details
  currentY = addFormField('Sex', caseData.sex || '', margin, currentY, 35);
  addFormField('Birthdate', caseData.birthdate || '', margin + 40, currentY - gap, 55);
  currentY = addFormField('Age', caseData.age || '', margin + 100, currentY - gap, 25);

  // Row 3: Status and Religion
  currentY = addFormField('Status', caseData.status || '', margin, currentY, 60);
  currentY = addFormField('Religion', caseData.religion || '', margin + 65, currentY - gap, 60);

  // Row 4: Address (full width)
  currentY = addFormField('Address', caseData.address || '', margin, currentY, pageWidth - margin * 2);

  // Additional Personal Info
  currentY = addFormField('Nickname', caseData.nickname || '', margin, currentY, 60);
  addFormField('Birthplace', caseData.birthplace || '', margin + 65, currentY - gap, 80);
  currentY = addFormField('Nationality', caseData.nationality || '', margin + 150, currentY - gap, 60);

  // Split addresses
  currentY = addFormField('Present Address', caseData.presentAddress || '', margin, currentY, pageWidth - margin * 2);
  currentY = addFormField('Provincial Address', caseData.provincialAddress || '', margin, currentY, pageWidth - margin * 2);

  // Referral details
  currentY = addFormField('Date of Referral', caseData.dateOfReferral || '', margin, currentY, 60);
  addFormField('Address & Tel.', caseData.addressAndTel || '', margin + 65, currentY - gap, 80);
  currentY = addFormField('Relation to Client', caseData.relationToClient || '', margin + 150, currentY - gap, 70);

  // Row 5: Source of Referral
  currentY = addFormField('Source of Referral', caseData.sourceOfReferral || '', margin, currentY, 85);
  if (caseData.otherSourceOfReferral) {
    currentY = addFormField('Other', caseData.otherSourceOfReferral || '', margin + 90, currentY - gap, 70);
  }

  // Row 6: Case details
  currentY = addFormField('Case Type', caseData.caseType || '', margin, currentY, 65);
  currentY = addFormField('Assigned House Parent', caseData.assignedHouseParent || '', margin + 70, currentY - gap, 85);

  yPosition = currentY + 5;

  // Family/Household Composition Section
  yPosition = addSectionHeader('II. FAMILY/HOUSEHOLD COMPOSITION', yPosition);

  // Father Information
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('FATHER:', margin, yPosition);
  doc.setFont(undefined, 'normal');
  yPosition += 8;

  currentY = yPosition;
  currentY = addFormField('Name', caseData.fatherName || '', margin, currentY, 80);
  currentY = addFormField('Age', caseData.fatherAge || '', margin + 85, currentY - gap, 30);
  currentY = addFormField('Education', caseData.fatherEducation || '', margin, currentY, 80);
  currentY = addFormField('Occupation', caseData.fatherOccupation || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Other Skills', caseData.fatherOtherSkills || '', margin, currentY, 80);
  currentY = addFormField('Address', caseData.fatherAddress || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Income', caseData.fatherIncome ? `₱${caseData.fatherIncome}` : '', margin, currentY, 50);
  currentY = addFormField('Living Status', (caseData.fatherLiving === true || caseData.father_living === true) ? 'Living' : (caseData.fatherLiving === false || caseData.father_living === false) ? 'Deceased' : '', margin + 55, currentY - gap, 50);

  yPosition = currentY + 8;

  // Mother Information
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('MOTHER:', margin, yPosition);
  doc.setFont(undefined, 'normal');
  yPosition += 8;

  currentY = yPosition;
  currentY = addFormField('Name', caseData.motherName || '', margin, currentY, 80);
  currentY = addFormField('Age', caseData.motherAge || '', margin + 85, currentY - gap, 30);
  currentY = addFormField('Education', caseData.motherEducation || '', margin, currentY, 80);
  currentY = addFormField('Occupation', caseData.motherOccupation || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Other Skills', caseData.motherOtherSkills || '', margin, currentY, 80);
  currentY = addFormField('Address', caseData.motherAddress || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Income', caseData.motherIncome ? `₱${caseData.motherIncome}` : '', margin, currentY, 50);
  currentY = addFormField('Living Status', (caseData.motherLiving === true || caseData.mother_living === true) ? 'Living' : (caseData.motherLiving === false || caseData.mother_living === false) ? 'Deceased' : '', margin + 55, currentY - gap, 50);

  yPosition = currentY + 8;

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('GUARDIAN:', margin, yPosition);
  doc.setFont(undefined, 'normal');
  yPosition += 8;

  currentY = yPosition;
  currentY = addFormField('Name', caseData.guardianName || caseData.guardian_name || '', margin, currentY, 80);
  currentY = addFormField('Age', caseData.guardianAge || caseData.guardian_age || '', margin + 85, currentY - gap, 30);
  currentY = addFormField('Relation', caseData.guardianRelation || caseData.guardian_relation || '', margin, currentY, 80);
  currentY = addFormField('Education', caseData.guardianEducation || caseData.guardian_education || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Occupation', caseData.guardianOccupation || caseData.guardian_occupation || '', margin, currentY, 80);
  currentY = addFormField('Other Skills', caseData.guardianOtherSkills || caseData.guardian_other_skills || '', margin + 85, currentY - gap, 80);
  currentY = addFormField('Address', caseData.guardianAddress || caseData.guardian_address || '', margin, currentY, pageWidth - margin * 2);
  currentY = addFormField('Income', (caseData.guardianIncome || caseData.guardian_income) ? `₱${caseData.guardianIncome || caseData.guardian_income}` : '', margin, currentY, 50);
  currentY = addFormField('Living Status', (caseData.guardianLiving === true || caseData.guardian_living === true) ? 'Living' : (caseData.guardianLiving === false || caseData.guardian_living === false) ? 'Deceased' : '', margin + 55, currentY - 8, 50);

  yPosition = currentY + 8;

  // Check if we need a new page
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  // Civil Status of Parents Section
  yPosition = addSectionHeader('III. CIVIL STATUS OF PARENTS', yPosition);

  const civilStatus = [];
  if (caseData.marriedInChurch) civilStatus.push('Married in Church');
  if (caseData.liveInCommonLaw) civilStatus.push('Live-in/Common Law');
  if (caseData.civilMarriage) civilStatus.push('Civil Marriage');
  if (caseData.separated) civilStatus.push('Separated');

  currentY = yPosition;
  currentY = addFormField('Status', civilStatus.join(', ') || 'Not specified', margin, currentY, pageWidth - margin * 2);

  if (caseData.marriageDatePlace) {
    currentY = addFormField('Marriage Date & Place', caseData.marriageDatePlace, margin, currentY, pageWidth - margin * 2);
  }

  yPosition = currentY + 10;

  // Case Narrative Details
  yPosition = addSectionHeader('IV. BRIEF DESCRIPTION OF THE CLIENT UPON INTAKE', yPosition);



  yPosition = addTextArea('Client', caseData.clientDescription || caseData.client_description, yPosition, 30);
  yPosition = addTextArea('Parents/Relatives/Guardian', caseData.parentsDescription || caseData.parents_description, yPosition, 30);

  // Problem Presented Section
  yPosition = addSectionHeader('V. PROBLEM PRESENTED', yPosition);
  yPosition = addTextArea('Problem Presented', caseData.problemPresented || caseData.problem_presented, yPosition, 40);

  // Brief History Section
  yPosition = addSectionHeader('VI. BRIEF HISTORY OF THE PROBLEM', yPosition);
  yPosition = addTextArea('Brief History', caseData.briefHistory || caseData.brief_history, yPosition, 40);

  // Economic Situation Section
  yPosition = addSectionHeader('VII. ECONOMIC SITUATION', yPosition);
  yPosition = addTextArea('Economic Situation', caseData.economicSituation || caseData.economic_situation, yPosition, 40);

  // Medical History Section
  yPosition = addSectionHeader('VIII. MEDICAL HISTORY', yPosition);
  yPosition = addTextArea('Medical History', caseData.medicalHistory || caseData.medical_history, yPosition, 40);

  // Family Background Section
  yPosition = addSectionHeader('IX. FAMILY BACKGROUND', yPosition);
  yPosition = addTextArea('Family Background', caseData.familyBackground || caseData.family_background, yPosition, 40);

  // Enhanced table styling function
  const createProfessionalTable = (startY, headers, rows, title) => {
    if (rows.length === 0) return startY;

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: rows,
      theme: 'striped',
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        textColor: colors.text,
        lineColor: colors.primary,
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [250, 250, 250] }
      }
    });
    
    return (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : startY + 50;
  };

  // Educational Attainment with enhanced styling
  if (caseData.educationalAttainment) {
    yPosition = addSectionHeader('X. EDUCATIONAL ATTAINMENT', yPosition);

    const levels = [
      { key: 'elementary', label: 'Elementary' },
      { key: 'highSchool', label: 'High School' },
      { key: 'seniorHighSchool', label: 'Senior High School' },
      { key: 'vocationalCourse', label: 'Vocational Course' },
      { key: 'college', label: 'College' },
      { key: 'others', label: 'Others' },
    ];

    const eduRows = levels.map(({ key, label }) => {
      const level = caseData.educationalAttainment[key] || {};
      const hasAny = level.schoolName || level.schoolAddress || level.year;
      if (!hasAny) return null;
      return [label, level.schoolName || '', level.schoolAddress || '', level.year || ''];
    }).filter(Boolean);

    if (eduRows.length > 0) {
      yPosition = createProfessionalTable(
        yPosition,
        ['Level', 'School Name', 'School Address', 'Year'],
        eduRows,
        'Educational Attainment'
      );
    }
  }

  // Sacramental Record with enhanced styling
  if (caseData.sacramentalRecord) {
    yPosition = addSectionHeader('XI. SACRAMENTAL RECORD', yPosition);

    const sacraments = [
      { key: 'baptism', label: 'Baptism' },
      { key: 'firstCommunion', label: 'First Communion' },
      { key: 'confirmation', label: 'Confirmation' },
      { key: 'others', label: 'Others' },
    ];

    const sacrRows = sacraments.map(({ key, label }) => {
      const s = caseData.sacramentalRecord[key] || {};
      const hasAny = s.dateReceived || s.placeParish;
      if (!hasAny) return null;
      return [label, s.dateReceived || '', s.placeParish || ''];
    }).filter(Boolean);

    if (sacrRows.length > 0) {
      yPosition = createProfessionalTable(
        yPosition,
        ['Sacrament', 'Date Received', 'Place/Parish'],
        sacrRows,
        'Sacramental Record'
      );
    }
  }

  // Family Members Section
  if (caseData.familyMembers && caseData.familyMembers.length > 0) {
    yPosition = addSectionHeader('XII. FAMILY MEMBERS (SIBLINGS/CHILDREN)', yPosition);

    const familyTableData = caseData.familyMembers
      .filter(member => member.name) // Only include members with names
      .map(member => [
        member.name || '',
        member.relation || '',
        member.age || '',
        member.sex || '',
        member.status || '',
        member.education || '',
        member.occupation || '',
        member.income ? `₱${member.income}` : ''
      ]);

    if (familyTableData.length > 0) {
      yPosition = createProfessionalTable(
        yPosition,
        ['Name', 'Relation', 'Age', 'Sex', 'Status', 'Education', 'Occupation', 'Income'],
        familyTableData,
        'Family Members'
      );
    }
  }

  // Extended Family Section
  if (caseData.extendedFamily && caseData.extendedFamily.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition = addSectionHeader('XIII. EXTENDED FAMILY', yPosition);

    const extendedTableData = caseData.extendedFamily
      .filter(member => member.name) // Only include members with names
      .map(member => [
        member.name || '',
        member.relationship || '',
        member.age || '',
        member.sex || '',
        member.status || '',
        member.education || '',
        member.occupation || '',
        member.income ? `₱${member.income}` : ''
      ]);

    if (extendedTableData.length > 0) {
      yPosition = createProfessionalTable(
        yPosition,
        ['Name', 'Relationship', 'Age', 'Sex', 'Status', 'Education', 'Occupation', 'Income'],
        extendedTableData,
        'Extended Family'
      );
    }
  }

  // Agencies/Persons
  if (caseData.agencies) {
    yPosition = addSectionHeader('XIV. AGENCIES/PERSONS', yPosition);
    if (Array.isArray(caseData.agencies)) {
      const agencyRows = caseData.agencies
        .filter(a => a && (a.name || a.addressDateDuration || a.servicesReceived))
        .map(a => [a.name || '', a.addressDateDuration || '', a.servicesReceived || '']);
      if (agencyRows.length > 0) {
        yPosition = createProfessionalTable(
          doc,
          ['Name', 'Address/Date/Duration', 'Services Received'],
          agencyRows,
          yPosition
        );
      }
    } else {
      yPosition = addTextArea('Agencies/Persons', caseData.agencies, yPosition, 30);
    }
  }

  // Assessment & Recommendation
  yPosition = addSectionHeader('XV. ASSESSMENT & RECOMMENDATION', yPosition);
  yPosition = addTextArea('Assessment', caseData.assessment, yPosition, 40);
  yPosition = addTextArea('Recommendation', caseData.recommendation, yPosition, 40);
  yPosition = addTextArea('Notes', caseData.notes || caseData.additional_notes, yPosition, 30);
  yPosition = addTextArea('Progress', caseData.progress, yPosition, 30);

  // Life Skills & Vital Signs Section
  if (caseData.lifeSkills && caseData.lifeSkills.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition = addSectionHeader('XVI. LIFE SKILLS TRACKING', yPosition);

    const lifeSkillsTableData = caseData.lifeSkills.map(skill => [
      skill.activity || '',
      skill.date_completed ? new Date(skill.date_completed).toLocaleDateString() : '',
      skill.performance_rating || '',
      skill.notes || ''
    ]);

    yPosition = createProfessionalTable(
      doc,
      ['Activity', 'Date Completed', 'Performance Rating', 'Notes'],
      lifeSkillsTableData,
      yPosition
    );
  }

  if (caseData.vitalSigns && caseData.vitalSigns.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition = addSectionHeader('XVII. VITAL SIGNS MONITORING', yPosition);

    const vitalSignsTableData = caseData.vitalSigns.map(vital => [
      vital.date_recorded ? new Date(vital.date_recorded).toLocaleDateString() : '',
      vital.blood_pressure || '',
      vital.heart_rate || '',
      vital.temperature || '',
      vital.weight || '',
      vital.height || '',
      vital.notes || ''
    ]);

    yPosition = createProfessionalTable(
      doc,
      ['Date', 'Blood Pressure', 'Heart Rate (BPM)', 'Temperature (°C)', 'Weight (KG)', 'Height (CM)', 'Notes'],
      vitalSignsTableData,
      yPosition
    );
  }

  // Intervention Plan Section
  if (caseData.checklist) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    let interventionPlan = '';
    
    // Handle different checklist formats
    if (typeof caseData.checklist === 'string') {
      try {
        const parsedChecklist = JSON.parse(caseData.checklist);
        if (Array.isArray(parsedChecklist)) {
          interventionPlan = parsedChecklist.map(item => 
            typeof item === 'object' ? item.text : item
          ).join('\n');
        } else {
          interventionPlan = caseData.checklist;
        }
      } catch (e) {
        interventionPlan = caseData.checklist;
      }
    } else if (Array.isArray(caseData.checklist)) {
      interventionPlan = caseData.checklist.map(item => 
        typeof item === 'object' ? item.text : item
      ).join('\n');
    }

    if (interventionPlan && interventionPlan.trim()) {
      yPosition = addSectionHeader('XVIII. INTERVENTION PLAN', yPosition);
      yPosition = addTextArea('Intervention Plan', interventionPlan, yPosition, 40);
    }
  }

  // Footer with signature lines
  const addSignatureSection = () => {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 20;

    // Signature lines
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Prepared by
    doc.text('Prepared by:', margin, yPosition);
    doc.line(margin + 25, yPosition + 2, margin + 80, yPosition + 2);
    yPosition += 20;
    
    doc.text('Social Worker', margin + 25, yPosition);
    yPosition += 20;
    
    // Noted by
    doc.text('Noted by:', margin + 100, yPosition - 40);
    doc.line(margin + 125, yPosition - 38, margin + 180, yPosition - 38);
    
    doc.text('Supervisor', margin + 125, yPosition - 20);
    
    yPosition += 10;
  };

  addSignatureSection();

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text('HOPETRACK Case Management System', margin, doc.internal.pageSize.height - 10);
  }

  return doc;
};

// Helpers to normalize data for cleaner output in templates and dynamic PDFs
const formatLongDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
const computeAge = (birthdate) => {
  if (!birthdate) return '';
  const bd = new Date(birthdate);
  if (isNaN(bd.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
};
const capitalize = (s) => {
  if (!s && s !== 0) return '';
  const t = String(s);
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};
const normalizeCaseData = (c = {}) => ({
  ...c,
  birthdate: formatLongDate(c.birthdate),
  dateOfReferral: formatLongDate(c.dateOfReferral || c.date_of_referral),
  age: c.age ?? computeAge(c.birthdate),
  sex: capitalize(c.sex || ''),
  presentAddress: (c.presentAddress || c.present_address || '').toString().trim(),
  provincialAddress: (c.provincialAddress || c.provincial_address || '').toString().trim(),
  guardianName: c.guardianName || c.guardian_name || '',
  guardianAge: c.guardianAge || c.guardian_age || '',
  guardianEducation: c.guardianEducation || c.guardian_education || '',
  guardianOccupation: c.guardianOccupation || c.guardian_occupation || '',
  guardianOtherSkills: c.guardianOtherSkills || c.guardian_other_skills || '',
  guardianRelation: c.guardianRelation || c.guardian_relation || '',
  guardianAddress: c.guardianAddress || c.guardian_address || '',
  guardianIncome: c.guardianIncome || c.guardian_income || '',
  guardianLiving: typeof c.guardianLiving === 'boolean' ? c.guardianLiving : (typeof c.guardian_living === 'boolean' ? c.guardian_living : undefined),
  guardianDeceased: typeof c.guardianDeceased === 'boolean' ? c.guardianDeceased : (typeof c.guardian_deceased === 'boolean' ? c.guardian_deceased : undefined),
});

const buildTemplateData = (c) => ({
  // Identity
  first_name: c.firstName || c.first_name || '',
  middle_name: c.middleName || c.middle_name || '',
  last_name: c.lastName || c.last_name || '',
  nickname: c.nickname || c.nick_name || '',
  sex: c.sex || '',
  birthdate: c.birthdate || '',
  birthplace: c.birthplace || c.birth_place || '',
  age: c.age || '',
  civil_status: c.status || '',
  religion: c.religion || '',
  nationality: c.nationality || '',
  address: c.address || c.presentAddress || c.present_address || c.provincialAddress || c.provincial_address || '',
  present_address: c.presentAddress || c.present_address || c.address || '',
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
  // Case meta
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
  father_living: typeof c.fatherLiving === 'boolean' ? (c.fatherLiving ? 'Alive' : 'Deceased') : (c.fatherLiving || ''),

  mother_name: c.motherName || c.mother_name || '',
  mother_age: c.motherAge || c.mother_age || '',
  mother_education: c.motherEducation || c.mother_education || '',
  mother_occupation: c.motherOccupation || c.mother_occupation || '',
  mother_other_skills: c.motherOtherSkills || c.mother_other_skills || '',
  mother_address: c.motherAddress || c.mother_address || '',
  mother_income: c.motherIncome || c.mother_income || '',
  mother_living: typeof c.motherLiving === 'boolean' ? (c.motherLiving ? 'Alive' : 'Deceased') : (c.motherLiving || ''),

  guardian_name: c.guardianName || c.guardian_name || '',
  guardian_relation: c.guardianRelation || c.guardian_relation || '',
  guardian_age: c.guardianAge || c.guardian_age || '',
  guardian_education: c.guardianEducation || c.guardian_education || '',
  guardian_occupation: c.guardianOccupation || c.guardian_occupation || '',
  guardian_other_skills: c.guardianOtherSkills || c.guardian_other_skills || '',
  guardian_address: c.guardianAddress || c.guardian_address || '',
  guardian_income: c.guardianIncome || c.guardian_income || '',
  guardian_living: typeof c.guardianLiving === 'boolean' ? (c.guardianLiving ? 'Alive' : 'Deceased') : (c.guardianLiving || ''),
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

export const downloadCaseReportPDF = async (caseData, options = {}) => {
  const normalized = normalizeCaseData(caseData || {});
  const doc = generateCaseReportPDF(normalized, { branding: { title: 'HOPETRACK', subtitle: 'CASE REPORT' }, theme: options.theme });
  const fn = options.filename || `HOPETRACK_Case_Report_${(normalized.lastName || normalized.last_name || 'Unknown')}_${(normalized.firstName || normalized.first_name || 'Unknown')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fn);
};

// Professional consolidated PDF export for all cases
export const downloadAllCasesPDF = async (inputItems = [], options = {}) => {
  // Prefer server-side professional consolidated PDF; fallback to local jsPDF summary
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) throw new Error('Missing auth token');
    const { API_BASE } = await import('./apiBase.js');
    // Detect ids vs full case objects
    const isIds = Array.isArray(inputItems) && inputItems.length > 0 && typeof inputItems[0] === 'number';
    const payload = isIds ? { ids: inputItems } : { cases: inputItems || [] };
    const resp = await fetch(`${API_BASE}/export/cases/pdf-html?listOnly=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HOPETRACK_All_Cases_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  } catch (err) {
    console.warn('Falling back to client-side summary PDF:', err);
    let items = inputItems;
    const isIds = Array.isArray(items) && items.length > 0 && typeof items[0] === 'number';
    if (isIds) {
      try {
        const full = await Promise.all(items.map(async (id) => {
          const d = await fetchCaseDetailsForExport(id);
          return d || { id };
        }));
        items = full;
      } catch (_) {}
    }
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const theme = {
      colors: { ...pdfTheme.colors, ...(((options.theme && options.theme.colors) || {})) },
      type: { ...pdfTheme.type, ...(((options.theme && options.theme.type) || {})) },
      grid: { ...pdfTheme.grid, ...(((options.theme && options.theme.grid) || {})) }
    };
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

    doc.setFillColor(...theme.colors.primary);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(theme.type.h2);
    doc.text('All Cases', pageWidth / 2, 10, { align: 'center' });
    doc.setFontSize(theme.type.label);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 18, { align: 'center' });

    // List table: Name, Age, Program, Last Updated
    const rows = (items || []).map((c) => [
      c.name || `${c.firstName || c.first_name || ''} ${c.middleName || c.middle_name || ''} ${c.lastName || c.last_name || ''}`.trim(),
      String(c.age ?? calcAge(c.birthdate) ?? ''),
      c.caseType || c.programType || c.program_type || c.case_type || '',
      formatDate(c.lastUpdated || c.updated_at || c.created_at)
    ]);

    const tableWidth = Math.min(pageWidth * 0.8, pageWidth - margin * 2);
    const centerMargin = (pageWidth - tableWidth) / 2;

    autoTable(doc, {
      startY: 30,
      head: [[ 'Name', 'Age', 'Program', 'Last Updated' ]],
      body: rows,
      styles: { fontSize: theme.type.body, cellPadding: 4, textColor: theme.colors.text, lineColor: [225, 228, 232], lineWidth: 0.1, overflow: 'linebreak' },
      headStyles: { fillColor: theme.colors.primary, textColor: 255, halign: 'center', fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: 'striped',
      margin: { left: centerMargin, right: centerMargin },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 36, halign: 'right' }
      }
    });

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text('HOPETRACK Case Management System', margin, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    const fileName = `HOPETRACK_All_Cases_List_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
};