import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, TabStopType, Tab } from 'docx';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export const generateCaseReportWord = (caseData) => {
  const kvPairs = [
    ['First Name', getText('', 'firstName','first_name')],
    ['Last Name', getText('', 'lastName','last_name')],
    ['Middle Name', getText('', 'middleName','middle_name')],
    ['Sex', getText('', 'sex')],
    ['Birthdate', getText('', 'birthdate')],
    ['Age', getText('', 'age')],
    ['Status', getText('', 'status','civil_status')],
    ['Religion', getText('', 'religion')],
    ['Nationality', getText('', 'nationality')],
    ['Nickname', getText('', 'nickname')],
    ['Present Address', getText('', 'presentAddress','present_address','address')],
    ['Provincial Address', getText('', 'provincialAddress','provincial_address')],
    ['Birthplace', getText('', 'birthplace','birth_place')],
    ['Date of Referral', getText('', 'dateOfReferral','date_of_referral')],
    ['Source of Referral', getText('', 'sourceOfReferral','source_of_referral')],
    ['Relation to Client', getText('', 'relationToClient','relation_to_client')],
    ['Address & Tel', getText('', 'addressAndTel','address_and_tel')],
    ['Case Type', getText('', 'caseType','programType','program_type')],
    ['Program Type', getText('', 'programType','program_type')],
    ['Assigned House Parent', getText('', 'assignedHouseParent','assigned_house_parent')],
    ['Mother', getText('', 'motherName','mother_name')],
    ['Father', getText('', 'fatherName','father_name')],
    ['Guardian', getText('', 'guardianName','guardian_name')],
    ['Married in church', getText('', 'marriedInChurch','married_in_church')],
    ['Live-in/Common Law', getText('', 'liveInCommonLaw','live_in_common_law')],
    ['Civil Marriage', getText('', 'civilMarriage','civil_marriage')],
    ['Separated', getText('', 'separated')],
    ['Date and Place', getText('', 'marriageDatePlace','marriage_date_place')],
    ['Problem Presented', getText('', 'problemPresented','problem_presented')],
    ['Brief History', getText('', 'briefHistory','brief_history')],
    ['Economic Situation', getText('', 'economicSituation','economic_situation')],
    ['Medical History', getText('', 'medicalHistory','medical_history')],
    ['Family Background', getText('', 'familyBackground','family_background')],
    ['Client Description', getText('', 'clientDescription','client_description')],
    ["Parents' Description", getText('', 'parentsDescription','parents_description')],
    ['Recommendation', getText('', 'recommendation')],
    ['Assessment', getText('', 'assessment')],
  ];
  // Professional color scheme
  const primaryColor = "2C5282"; // Professional blue
  const accentColor = "E2E8F0"; // Light gray
  const textColor = "2D3748"; // Dark gray

  // Helpers to normalize field names and values
  const getField = (...keys) => {
    for (const k of keys) {
      const v = caseData?.[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
  };
  const getText = (fallback, ...keys) => {
    const v = getField(...keys);
    return v !== undefined ? String(v) : fallback;
  };
  const yesNo = (...keys) => {
    const v = getField(...keys);
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') return v || 'N/A';
    return 'N/A';
  };

  const lifeSkillsEntries = Array.isArray(caseData.lifeSkills) && caseData.lifeSkills.length > 0
    ? caseData.lifeSkills
    : (Array.isArray(caseData.lifeSkillsData) ? caseData.lifeSkillsData : []);
  const vitalSignsEntries = Array.isArray(caseData.vitalSigns) && caseData.vitalSigns.length > 0
    ? caseData.vitalSigns
    : (Array.isArray(caseData.vitalSignsData) ? caseData.vitalSignsData : []);

  // Helper function to create professional section headers
  const createSectionHeader = (text) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: 26,
          color: primaryColor,
        }),
      ],
      spacing: { before: 600, after: 300 },
      border: {
        bottom: {
          color: primaryColor,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    });
  };

  // Helper function to create professional tables
  const createProfessionalTable = (rows) => {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
        left: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
        right: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
      rows: rows,
    });
  };

  // Helper function to create table cells with professional styling
  const createTableCell = (text, isHeader = false, width = 25) => {
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: isHeader,
              size: isHeader ? 22 : 20,
              color: isHeader ? primaryColor : textColor,
            }),
          ],
          alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        }),
      ],
      width: { size: width, type: WidthType.PERCENTAGE },
      shading: isHeader ? { fill: accentColor } : undefined,
    });
  };

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Professional Header with Logo Area
        new Paragraph({
          children: [
            new TextRun({
              text: "CHILDREN IN CONFLICT WITH THE LAW (CICL)",
              bold: true,
              size: 32,
              color: primaryColor,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: {
            bottom: {
              color: primaryColor,
              space: 1,
              style: BorderStyle.DOUBLE,
              size: 6,
            },
          },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "COMPREHENSIVE CASE INTAKE REPORT",
              bold: true,
              size: 26,
              color: textColor,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Document Information Box
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
            left: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
            right: { style: BorderStyle.SINGLE, size: 2, color: primaryColor },
          },
          rows: [
            new TableRow({
              children: [
                createTableCell(`Case ID: ${caseData.caseId || 'N/A'}`, false, 50),
                createTableCell(`Date Generated: ${new Date().toLocaleDateString()}`, false, 50),
              ],
            }),
          ],
        }),

        // I. CLIENT'S IDENTIFYING INFORMATION
        createSectionHeader("I. CLIENT'S IDENTIFYING INFORMATION"),

        // Personal Information Table
        createProfessionalTable([
          new TableRow({
            children: [
              createTableCell("Last Name:", true),
              createTableCell(getText("____________________", 'lastName', 'last_name')),
              createTableCell("First Name:", true),
              createTableCell(getText("____________________", 'firstName', 'first_name')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Middle Name:", true),
              createTableCell(getText("____________________", 'middleName', 'middle_name')),
              createTableCell("Sex:", true),
              createTableCell(getText("____________________", 'sex')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Birthdate:", true),
              createTableCell(getText("____________________", 'birthdate', 'birth_date')),
              createTableCell("Age:", true),
              createTableCell(getText("____________________", 'age')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Status:", true),
              createTableCell(getText("____________________", 'status')),
              createTableCell("Religion:", true),
              createTableCell(getText("____________________", 'religion')),
            ],
          }),
        ]),

        // Address Section
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Address: ", 
              bold: true, 
              size: 22,
              color: primaryColor 
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'address'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { before: 300, after: 200 },
        }),

        // Additional Address Details
        createProfessionalTable([
          new TableRow({
            children: [
              createTableCell("Barangay:", true),
              createTableCell(getText("____________________", 'barangay')),
              createTableCell("Municipality:", true),
              createTableCell(getText("____________________", 'municipality')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Province:", true),
              createTableCell(getText("____________________", 'province')),
              createTableCell(" ", true),
              createTableCell(" "),
            ],
          }),
        ]),

        // Source of Referral
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Source of Referral: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'sourceOfReferral', 'source_of_referral', 'referralSource'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),

        // Other Source of Referral
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Other Source of Referral: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'otherSourceOfReferral', 'other_source_of_referral'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),

        // Referral Details
        createProfessionalTable([
          new TableRow({
            children: [
              createTableCell("Date of Referral:", true),
              createTableCell(getText("____________________", 'dateOfReferral', 'date_of_referral')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Address and Tel. Nos:", true),
              createTableCell(getText("____________________", 'addressAndTel', 'address_and_tel')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Relation to Client:", true),
              createTableCell(getText("____________________", 'relationToClient', 'relation_to_client')),
            ],
          }),
        ]),

        // Case Type
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Case Type: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'caseType', 'programType', 'program_type'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),

        // Program & Admission Details
        createProfessionalTable([
          new TableRow({
            children: [
              createTableCell("Program Type:", true),
              createTableCell(getText("____________________", 'programType', 'program_type')),
            ],
          }),
          new TableRow({
            children: [
              createTableCell("Admission Month:", true),
              createTableCell(getText("____________________", 'admissionMonth', 'admission_month')),
              createTableCell("Admission Year:", true),
              createTableCell(getText("____________________", 'admissionYear', 'admission_year')),
            ],
          }),
        ]),

        // Assigned House Parent
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Assigned House Parent: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: caseData.assignedHouseParent || "________________________________________________________________",
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 400 },
        }),

        // II. FAMILY/HOUSEHOLD COMPOSITION
        createSectionHeader("II. FAMILY/HOUSEHOLD COMPOSITION"),

        // Father Information
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Father's Name: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'fatherName', 'father_name'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Father's Age: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'fatherAge', 'father_age'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Father's Occupation: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'fatherOccupation', 'father_occupation'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: "Father's Educational Attainment: ", 
              bold: true,
              size: 22,
              color: primaryColor
            }),
            new TextRun({ 
              text: getText("________________________________________________________________", 'fatherEducation', 'father_education'),
              size: 20,
              color: textColor
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Father's Other Skills: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'fatherOtherSkills', 'father_other_skills') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Father's Address and Tel. Nos.: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'fatherAddress', 'father_address') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Father's Income: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'fatherIncome', 'father_income') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Father Living: ", bold: true }),
            new TextRun({ text: yesNo('fatherLiving', 'father_living') }),
          ],
          spacing: { after: 400 },
        }),

        // Mother Information
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Name: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherName', 'mother_name') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Age: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherAge', 'mother_age') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Occupation: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherOccupation', 'mother_occupation') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Educational Attainment: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherEducation', 'mother_education') }),
          ],
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Other Skills: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherOtherSkills', 'mother_other_skills') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Address: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherAddress', 'mother_address') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother's Income: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'motherIncome', 'mother_income') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Mother Living: ", bold: true }),
            new TextRun({ text: yesNo('motherLiving', 'mother_living') }),
          ],
          spacing: { after: 400 },
        }),

        // Guardian Information (if applicable)
        ...(caseData.guardianName ? [
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Name: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianName', 'guardian_name') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Age: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianAge', 'guardian_age') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Occupation: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianOccupation', 'guardian_occupation') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Educational Attainment: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianEducation', 'guardian_education') }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Relation to Client: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianRelation', 'guardian_relation') }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Guardian's Address: ", bold: true }),
              new TextRun({ text: getText("________________________________________________________________", 'guardianAddress', 'guardian_address') }),
            ],
            spacing: { after: 400 },
          }),
        ] : []),

        // Civil Status of Parents
        new Paragraph({
          children: [
            new TextRun({ text: "Civil Status of Parents: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________", 'parentsCivilStatus') }),
          ],
          spacing: { after: 200 },
        }),
        createProfessionalTable([
          new TableRow({ children: [ createTableCell("Married in Church", true), createTableCell(yesNo('marriedInChurch', 'married_in_church')) ] }),
          new TableRow({ children: [ createTableCell("Civil Marriage", true), createTableCell(yesNo('civilMarriage', 'civil_marriage')) ] }),
          new TableRow({ children: [ createTableCell("Live in Common Law", true), createTableCell(yesNo('liveInCommonLaw', 'live_in_common_law')) ] }),
          new TableRow({ children: [ createTableCell("Separated", true), createTableCell(yesNo('separated')) ] }),
          new TableRow({ children: [ createTableCell("Marriage Date/Place", true), createTableCell(getText("____________________", 'marriageDatePlace', 'marriage_date_place')) ] }),
        ]),

        // Family Composition (Siblings/Children)
        ...(Array.isArray(caseData.familyMembers) && caseData.familyMembers.length > 0 ? [
          createSectionHeader("Family Composition (Siblings/Children)"),
          createProfessionalTable([
            new TableRow({
              children: [
                createTableCell("Name", true),
                createTableCell("Relation", true),
                createTableCell("Age", true),
                createTableCell("Sex", true),
                createTableCell("Status", true),
                createTableCell("Education", true),
                createTableCell("Address", true),
                createTableCell("Occupation", true),
              ],
            }),
            ...caseData.familyMembers.map(member => new TableRow({
              children: [
                createTableCell(member.name || ''),
                createTableCell(member.relation || ''),
                createTableCell(member.age || ''),
                createTableCell(member.sex || ''),
                createTableCell(member.status || ''),
                createTableCell(member.education || ''),
                createTableCell(member.address || ''),
                createTableCell(member.occupation || ''),
              ],
            })),
          ]),
        ] : []),

        // Extended Family
        ...(Array.isArray(caseData.extendedFamily) && caseData.extendedFamily.length > 0 ? [
          createSectionHeader("Extended Family"),
          createProfessionalTable([
            new TableRow({
              children: [
                createTableCell("Name", true),
                createTableCell("Relation", true),
                createTableCell("Age", true),
                createTableCell("Sex", true),
                createTableCell("Status", true),
                createTableCell("Education", true),
                createTableCell("Address", true),
                createTableCell("Occupation", true),
              ],
            }),
            ...caseData.extendedFamily.map(member => new TableRow({
              children: [
                createTableCell(member.name || ''),
                createTableCell(member.relation || ''),
                createTableCell(member.age || ''),
                createTableCell(member.sex || ''),
                createTableCell(member.status || ''),
                createTableCell(member.education || ''),
                createTableCell(member.address || ''),
                createTableCell(member.occupation || ''),
              ],
            })),
          ]),
        ] : []),

        // III. BRIEF DESCRIPTION OF THE CLIENT UPON INTAKE
        new Paragraph({
          children: [
            new TextRun({
              text: "III. BRIEF DESCRIPTION OF THE CLIENT UPON INTAKE",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Client: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________\n________________________________________________________________\n________________________________________________________________", 'clientDescription') }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Parents/Relatives/Guardian: ", bold: true }),
            new TextRun({ text: getText("________________________________________________________________\n________________________________________________________________\n________________________________________________________________", 'parentsDescription') }),
          ],
          spacing: { after: 200 },
        }),
        ...(getField('briefDescription') ? [
          new Paragraph({
            children: [ new TextRun({ text: getText("", 'briefDescription') }) ],
            spacing: { after: 400 },
          })
        ] : []),

        // IV. PROBLEM PRESENTED
        new Paragraph({
          children: [
            new TextRun({
              text: "IV. PROBLEM PRESENTED",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: caseData.problemPresented || "________________________________________________________________\n________________________________________________________________\n________________________________________________________________" }),
          ],
          spacing: { after: 400 },
        }),

        // V. BRIEF HISTORY OF THE PROBLEM
        new Paragraph({
          children: [
            new TextRun({
              text: "V. BRIEF HISTORY OF THE PROBLEM",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: caseData.briefHistory || "________________________________________________________________\n________________________________________________________________\n________________________________________________________________" }),
          ],
          spacing: { after: 400 },
        }),

        // VI. ECONOMIC SITUATION
        new Paragraph({
          children: [
            new TextRun({
              text: "VI. ECONOMIC SITUATION",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: caseData.economicSituation || "________________________________________________________________\n________________________________________________________________\n________________________________________________________________" }),
          ],
          spacing: { after: 400 },
        }),

        // VII. MEDICAL HISTORY
        new Paragraph({
          children: [
            new TextRun({
              text: "VII. MEDICAL HISTORY",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: caseData.medicalHistory || "________________________________________________________________\n________________________________________________________________\n________________________________________________________________" }),
          ],
          spacing: { after: 400 },
        }),

        // VIII. FAMILY BACKGROUND
        new Paragraph({
          children: [
            new TextRun({
              text: "VIII. FAMILY BACKGROUND",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: caseData.familyBackground || "________________________________________________________________\n________________________________________________________________\n________________________________________________________________" }),
          ],
          spacing: { after: 400 },
        }),

        // IX. ASSESSMENT
        new Paragraph({
          children: [
            new TextRun({
              text: "IX. ASSESSMENT",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: getText("________________________________________________________________\n________________________________________________________________\n________________________________________________________________", 'assessment') }),
          ],
          spacing: { after: 400 },
        }),

        // X. RECOMMENDATION
        new Paragraph({
          children: [
            new TextRun({
              text: "X. RECOMMENDATION",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: getText("________________________________________________________________\n________________________________________________________________\n________________________________________________________________", 'recommendation') }),
          ],
          spacing: { after: 400 },
        }),

        // XI. PROGRESS
        ...(getField('progress') ? [
          new Paragraph({
            children: [ new TextRun({ text: "XI. PROGRESS", bold: true, size: 24 }) ],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [ new TextRun({ text: getText("________________________________________________________________\n________________________________________________________________\n________________________________________________________________", 'progress') }) ],
            spacing: { after: 400 },
          }),
        ] : []),

        // XVI. LIFE SKILLS TRACKING
        ...(lifeSkillsEntries && lifeSkillsEntries.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "XVI. LIFE SKILLS TRACKING",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Activity", bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date Completed", bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Performance Rating", bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Notes", bold: true })] })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...lifeSkillsEntries.map(skill => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (skill.activity || skill.activityName || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (skill.dateCompleted || skill.date || skill.completedDate || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (skill.performanceRating || skill.performance || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (skill.notes || skill.remarks || '') })] })],
                    }),
                  ],
                })
              ),
            ],
          }),
        ] : []),

        // XVII. VITAL SIGNS MONITORING
        ...(vitalSignsEntries && vitalSignsEntries.length > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "XVII. VITAL SIGNS MONITORING",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date Recorded", bold: true })] })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Blood Pressure", bold: true })] })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Heart Rate", bold: true })] })],
                    width: { size: 12, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Temperature", bold: true })] })],
                    width: { size: 12, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Weight", bold: true })] })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Height", bold: true })] })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Notes", bold: true })] })],
                    width: { size: 26, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...vitalSignsEntries.map(vital => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (vital.dateRecorded || vital.date || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (vital.bloodPressure || vital.bp || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (vital.heartRate || vital.pulse || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (vital.temperature || vital.temp || '') })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: vital.weight || "" })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: vital.height || "" })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: vital.notes || "" })] })],
                    }),
                  ],
                })
              ),
            ],
          }),
        ] : []),

        // Agencies/Persons Previously Approached
        ...(Array.isArray(caseData.agencies) && caseData.agencies.length > 0 ? [
          createSectionHeader("Agencies/Persons Previously Approached"),
          createProfessionalTable([
            new TableRow({
              children: [
                createTableCell("Name of agencies/persons", true),
                createTableCell("Address/date/duration", true),
                createTableCell("Services received", true),
              ],
            }),
            ...caseData.agencies.map(ag => new TableRow({
              children: [
                createTableCell(ag.name || ''),
                createTableCell(ag.addressDateDuration || ag.address_date_duration || ''),
                createTableCell(ag.servicesReceived || ag.services_received || ''),
              ],
            })),
          ]),
        ] : []),

        // Additional Personal Details
        createSectionHeader("Additional Personal Details"),
        createProfessionalTable([
          new TableRow({ children: [ createTableCell("Nickname", true), createTableCell(caseData.nickname || '') ] }),
          new TableRow({ children: [ createTableCell("Birthplace", true), createTableCell(caseData.birthplace || caseData.birth_place || '') ] }),
          new TableRow({ children: [ createTableCell("Nationality", true), createTableCell(caseData.nationality || '') ] }),
        ]),

        // Addresses
        createSectionHeader("Addresses"),
        createProfessionalTable([
          new TableRow({ children: [ createTableCell("Present Address", true), createTableCell(caseData.presentAddress || caseData.present_address || caseData.address || '') ] }),
          new TableRow({ children: [ createTableCell("Provincial Address", true), createTableCell(caseData.provincialAddress || caseData.provincial_address || '') ] }),
        ]),

        // Referral Details
        createSectionHeader("Referral Details"),
        createProfessionalTable([
          new TableRow({ children: [ createTableCell("Date of Referral", true), createTableCell(caseData.dateOfReferral || caseData.date_of_referral || '') ] }),
          new TableRow({ children: [ createTableCell("Address & Tel.", true), createTableCell(caseData.addressAndTel || caseData.address_and_tel || '') ] }),
          new TableRow({ children: [ createTableCell("Relation to Client", true), createTableCell(caseData.relationToClient || caseData.relation_to_client || '') ] }),
        ]),

        // Signature Section
        new Paragraph({
          children: [
            new TextRun({ text: "" }),
          ],
          spacing: { before: 800, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Prepared by: ________________________________" }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "                    Social Worker" }),
          ],
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Noted by: ________________________________" }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "                    Supervisor" }),
          ],
          spacing: { after: 400 },
        }),
      ],
    }],
  });

  return doc;
};

export const downloadCaseReportWord = async (caseData) => {
  const fileName = `Case_Report_${caseData.lastName || 'Unknown'}_${caseData.firstName || 'Unknown'}_${new Date().toISOString().split('T')[0]}.docx`;

  // Normalize data for cleaner output in templates and dynamic DOCX
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
  const normalized = {
    ...caseData,
    birthdate: formatLongDate(caseData.birthdate),
    dateOfReferral: formatLongDate(caseData.dateOfReferral || caseData.date_of_referral),
    age: caseData.age ?? computeAge(caseData.birthdate),
    sex: capitalize(caseData.sex || ''),
    presentAddress: (caseData.presentAddress || caseData.present_address || '').toString().trim(),
    provincialAddress: (caseData.provincialAddress || caseData.provincial_address || '').toString().trim(),
  };

  const buildTemplateData = (c) => ({
    // Common identity fields (add more keys as your template supports)
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
    address: c.address || '',
    present_address: c.presentAddress || c.present_address || '',
    provincial_address: c.provincialAddress || c.provincial_address || '',
    barangay: c.barangay || '',
    municipality: c.municipality || '',
    province: c.province || '',
    date_of_referral: c.dateOfReferral || c.date_of_referral || '',
    address_and_tel: c.addressAndTel || c.address_and_tel || '',
    relation_to_client: c.relationToClient || c.relation_to_client || '',
    referral_source: c.sourceOfReferral || c.source_of_referral || '',
    referral_other: c.otherSourceOfReferral || c.other_source_of_referral || '',
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

  const primaryColor = '297db9';
  const tableRows = (function buildRows() {
    const pairs = [
      ['First Name', caseData.firstName || caseData.first_name || ''],
      ['Last Name', caseData.lastName || caseData.last_name || ''],
      ['Middle Name', caseData.middleName || caseData.middle_name || ''],
      ['Sex', caseData.sex || ''],
      ['Birthdate', caseData.birthdate || ''],
      ['Age', String(caseData.age ?? '')],
      ['Status', caseData.status || caseData.civil_status || ''],
      ['Religion', caseData.religion || ''],
      ['Nationality', caseData.nationality || ''],
      ['Nickname', caseData.nickname || ''],
      ['Present Address', caseData.presentAddress || caseData.present_address || caseData.address || ''],
      ['Provincial Address', caseData.provincialAddress || caseData.provincial_address || ''],
      ['Birthplace', caseData.birthplace || caseData.birth_place || ''],
      ['Date of Referral', caseData.dateOfReferral || caseData.date_of_referral || ''],
      ['Source of Referral', caseData.sourceOfReferral || caseData.source_of_referral || ''],
      ['Relation to Client', caseData.relationToClient || caseData.relation_to_client || ''],
      ['Address & Tel', caseData.addressAndTel || caseData.address_and_tel || ''],
      ['Case Type', caseData.caseType || caseData.programType || caseData.program_type || ''],
      ['Program Type', caseData.programType || caseData.program_type || ''],
      ['Assigned House Parent', caseData.assignedHouseParent || caseData.assigned_house_parent || ''],
      ['Mother', caseData.motherName || caseData.mother_name || ''],
      ['Father', caseData.fatherName || caseData.father_name || ''],
      ['Guardian', caseData.guardianName || caseData.guardian_name || ''],
      ['Married in church', String(caseData.marriedInChurch ?? caseData.married_in_church ?? '')],
      ['Live-in/Common Law', String(caseData.liveInCommonLaw ?? caseData.live_in_common_law ?? '')],
      ['Civil Marriage', String(caseData.civilMarriage ?? caseData.civil_marriage ?? '')],
      ['Separated', String(caseData.separated ?? '')],
      ['Date and Place', caseData.marriageDatePlace || caseData.marriage_date_place || ''],
      ['Problem Presented', caseData.problemPresented || caseData.problem_presented || ''],
      ['Brief History', caseData.briefHistory || caseData.brief_history || ''],
      ['Economic Situation', caseData.economicSituation || caseData.economic_situation || ''],
      ['Medical History', caseData.medicalHistory || caseData.medical_history || ''],
      ['Family Background', caseData.familyBackground || caseData.family_background || ''],
      ['Client Description', caseData.clientDescription || caseData.client_description || ''],
      ["Parents' Description", caseData.parentsDescription || caseData.parents_description || ''],
      ['Recommendation', caseData.recommendation || ''],
      ['Assessment', caseData.assessment || ''],
    ];
    return [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Field', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Value', bold: true })] }),
        ],
      }),
      ...pairs.map(([k, v]) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: String(k), bold: true })] }),
          new TableCell({ children: [new Paragraph(String(v))] }),
        ],
      })),
    ];
  })();
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [ new TextRun({ text: 'Case Summary', bold: true, size: 30, color: primaryColor }) ], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows })
      ]
    }]
  });
  const buffer = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(buffer);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Professional consolidated Word export for all cases
export const downloadAllCasesWord = async (casesData = []) => {
  const primaryColor = '297db9';
  const textColor = '2D3748';

  const header = new Paragraph({
    children: [ new TextRun({ text: 'All Cases', bold: true, size: 30, color: primaryColor }) ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const calcAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const bd = new Date(birthdate);
    if (isNaN(bd.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return String(age);
  };

  // Build a clean four-column table (Name, Age, Program, Last Updated)
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'Name', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'Age', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'Program', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: 'Last Updated', bold: true })] }),
      ],
    }),
    ...((casesData || []).map(c => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: c?.name || `${c?.firstName || ''} ${c?.middleName || ''} ${c?.lastName || ''}`.trim() })] }),
        new TableCell({ children: [new Paragraph({ text: String(c?.age ?? calcAge(c?.birthdate) ?? '') })] }),
        new TableCell({ children: [new Paragraph({ text: c?.caseType || c?.programType || '' })] }),
        new TableCell({ children: [new Paragraph({ text: formatDate(c?.lastUpdated || c?.updated_at || c?.created_at) })] }),
      ],
    })))
  ];

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: [header, table] }],
  });

  const buffer = await Packer.toBlob(doc);
  const fileName = `CICL_All_Cases_List_${new Date().toISOString().split('T')[0]}.docx`;
  const url = window.URL.createObjectURL(buffer);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

function buildCounts(items, getter) {
  const counts = {};
  (items || []).forEach(item => {
    const key = String(getter(item) || '').trim();
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function createKeyValueTable(keyHeader, counts) {
  const rows = Object.entries(counts).map(([key, val]) => [ key, String(val) ]);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: keyHeader, bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Count', bold: true })] }),
        ],
      }),
      ...rows.map(([k, v]) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(k))] }),
          new TableCell({ children: [new Paragraph(String(v))] }),
        ],
      })),
    ],
  });
}

function createCasesOverviewTable(casesData) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const calcAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const bd = new Date(birthdate);
    if (isNaN(bd.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const header = ['Case ID', 'Full Name', 'Gender', 'Birthdate', 'Age', 'Program', 'Status', 'Last Updated'];
  const rows = (casesData || []).map(c => [
    c.id || '',
    c.name || `${c.lastName || ''}, ${c.firstName || ''}`.trim(),
    c.sex || '',
    formatDate(c.birthdate),
    String(c.age ?? calcAge(c.birthdate) ?? ''),
    c.caseType || c.programType || '',
    c.status || '',
    formatDate(c.lastUpdated || c.updated_at || c.created_at),
  ]);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: header.map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })) }),
      ...rows.map(cols => new TableRow({ children: cols.map(col => new TableCell({ children: [new Paragraph(String(col))] })) })),
    ],
  });
}

export const downloadIntakeFormWord = async (caseData) => {
  const primaryColor = '000000';
  const textColor = '000000';
  const box = (checked) => (checked ? '☑' : '☐');
  const val = (v) => (v === undefined || v === null ? '' : String(v));

  const sectionTitle = (t) => new Paragraph({ children: [ new TextRun({ text: t, bold: true, size: 24, color: textColor }) ], spacing: { before: 240, after: 120 } });
  const inlineField = (label, _value, position = 7200, lineLength = 28, indentLeft = 720) => {
    return new Paragraph({
      tabStops: [{ type: TabStopType.LEFT, position }],
      indent: { left: indentLeft },
      children: [
        new TextRun({ text: label + ':', bold: true, color: textColor }),
        new Tab(),
        new TextRun({ text: '_'.repeat(lineLength), color: textColor })
      ],
      spacing: { after: 120 }
    });
  };
  const inlineRow = (labels = [], positions = [], lineLength = 28) => {
    return new Paragraph({
      tabStops: positions.map(p => ({ type: TabStopType.LEFT, position: p })),
      indent: { left: 720 },
      children: labels.flatMap((lab, i) => {
        const runs = [];
        if (i > 0) runs.push(new Tab());
        runs.push(new TextRun({ text: lab + ':', bold: true, color: textColor }));
        runs.push(new TextRun({ text: ' ' + '_'.repeat(lineLength), color: textColor }));
        return runs;
      }),
      spacing: { after: 120 }
    });
  };
  const inlineRowCustom = (labels = [], positions = [], lengths = [], indentLeft = 720) => {
    return new Paragraph({
      tabStops: positions.map(p => ({ type: TabStopType.LEFT, position: p })),
      indent: { left: indentLeft },
      children: labels.flatMap((lab, i) => {
        const runs = [];
        if (i > 0) runs.push(new Tab());
        runs.push(new TextRun({ text: lab + ':', bold: true, color: textColor }));
        const len = lengths[i] ?? 20;
        runs.push(new TextRun({ text: ' ' + '_'.repeat(len), color: textColor }));
        return runs;
      }),
      spacing: { after: 120 }
    });
  };
  const nameCheckboxLine = (label, nameLen = 24, living = false, indentLeft = 720, trailLen = 16) => {
    return new Paragraph({
      indent: { left: indentLeft },
      children: [
        new TextRun({ text: label + ':', bold: true, color: textColor }),
        new TextRun({ text: ' ' + '_'.repeat(nameLen), color: textColor }),
        new TextRun({ text: '  ' + (living ? '☑' : '☐') + ' Living  ' + (!living ? '☑' : '☐') + ' Deceased ', color: textColor }),
        new TextRun({ text: '_'.repeat(trailLen), color: textColor })
      ],
      spacing: { after: 120 }
    });
  };
  const tableWithHeader = (headerTexts, bodyRows) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ children: headerTexts.map(h => new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: h, bold: true, color: textColor }) ] }) ] })) }),
    ...bodyRows
  ] });

  const name = [caseData.firstName || caseData.first_name || '', caseData.middleName || caseData.middle_name || '', caseData.lastName || caseData.last_name || ''].filter(Boolean).join(' ');
  const birthdate = caseData.birthdate || '';
  const age = caseData.age || '';
  const sex = caseData.sex || '';
  const status = caseData.status || caseData.civil_status || '';
  const nationality = caseData.nationality || '';
  const religion = caseData.religion || '';
  const birthplace = caseData.birthplace || caseData.birth_place || '';
  const presentAddress = caseData.presentAddress || caseData.present_address || caseData.address || '';
  const provincialAddress = caseData.provincialAddress || caseData.provincial_address || '';
  const sourceOfReferral = caseData.sourceOfReferral || caseData.source_of_referral || '';
  const dateOfReferral = caseData.dateOfReferral || caseData.date_of_referral || '';
  const addressAndTel = caseData.addressAndTel || caseData.address_and_tel || '';
  const relationToClient = caseData.relationToClient || caseData.relation_to_client || '';

  const marriedInChurch = !!(caseData.marriedInChurch ?? caseData.married_in_church);
  const liveInCommonLaw = !!(caseData.liveInCommonLaw ?? caseData.live_in_common_law);
  const civilMarriage = !!(caseData.civilMarriage ?? caseData.civil_marriage);
  const separated = !!(caseData.separated);
  const marriageDatePlace = caseData.marriageDatePlace || caseData.marriage_date_place || '';

  const father = {
    name: caseData.fatherName || caseData.father_name || '',
    age: caseData.fatherAge || caseData.father_age || '',
    education: caseData.fatherEducation || caseData.father_education || '',
    occupation: caseData.fatherOccupation || caseData.father_occupation || '',
    otherSkills: caseData.fatherOtherSkills || caseData.father_other_skills || '',
    income: caseData.fatherIncome || caseData.father_income || '',
    address: caseData.fatherAddress || caseData.father_address || '',
    living: !!(caseData.fatherLiving)
  };
  const mother = {
    name: caseData.motherName || caseData.mother_name || '',
    age: caseData.motherAge || caseData.mother_age || '',
    education: caseData.motherEducation || caseData.mother_education || '',
    occupation: caseData.motherOccupation || caseData.mother_occupation || '',
    otherSkills: caseData.motherOtherSkills || caseData.mother_other_skills || '',
    income: caseData.motherIncome || caseData.mother_income || '',
    address: caseData.motherAddress || caseData.mother_address || '',
    living: !!(caseData.motherLiving)
  };
  const guardian = {
    name: caseData.guardianName || caseData.guardian_name || '',
    relation: caseData.guardianRelation || caseData.guardian_relation || '',
    address: caseData.guardianAddress || caseData.guardian_address || ''
  };

  const edu = caseData.educationalAttainment || {};
  const sacr = caseData.sacramentalRecord || {};
  const familyRows = (Array.isArray(caseData.familyComposition) ? caseData.familyComposition : caseData.family || []).map((m, i) => new TableRow({ children: [
    new TableCell({ children: [ new Paragraph(String(m.name || i + 1)) ] }),
    new TableCell({ children: [ new Paragraph(String(m.relation || m.relationToClient || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.age || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.sex || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.status || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.education || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.address || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.occupation || '')) ] })
  ] }));
  const extRows = (Array.isArray(caseData.extendedFamily) ? caseData.extendedFamily : []).map((m, i) => new TableRow({ children: [
    new TableCell({ children: [ new Paragraph(String(m.name || i + 1)) ] }),
    new TableCell({ children: [ new Paragraph(String(m.relation || m.relationship || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.age || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.sex || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.status || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.education || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.address || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(m.occupation || '')) ] })
  ] }));
  const agencyRows = (Array.isArray(caseData.agencies) ? caseData.agencies : []).map((ag, i) => new TableRow({ children: [
    new TableCell({ children: [ new Paragraph(String(ag.name || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(ag.addressDateDuration || ag.address_date_duration || '')) ] }),
    new TableCell({ children: [ new Paragraph(String(ag.servicesReceived || ag.services_received || '')) ] })
  ] }));

  const padRows = (rows, min, cols) => {
    const out = [...rows];
    while (out.length < min) {
      out.push(new TableRow({ children: Array.from({ length: cols }).map(() => new TableCell({ children: [ new Paragraph('') ] })) }));
    }
    return out;
  };
  const familyRowsPadded = padRows(familyRows, 4, 8);
  const extRowsPadded = padRows(extRows, 3, 8);
  const agencyRowsPadded = padRows(agencyRows, 3, 3);

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: textColor }, paragraph: { spacing: { line: 276 } } },
        heading1: { run: { font: 'Calibri', size: 32, color: primaryColor } },
        heading2: { run: { font: 'Calibri', size: 26, color: primaryColor } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: [
    new Paragraph({ children: [ new TextRun({ text: 'GENERAL INTAKE FORM', bold: true, size: 32, color: textColor }) ], alignment: AlignmentType.CENTER, spacing: { after: 180 } }),
    inlineField('Date', caseData.intakeDate || caseData.date || '', 7600, 24, 3600),
    inlineField('Time', caseData.intakeTime || caseData.time || '', 7600, 24, 3600),
    inlineField('Site of Intake', caseData.intakeSite || caseData.siteOfIntake || '', 7600, 24, 3600),
    sectionTitle("I. CLIENT'S IDENTIFYING INFORMATION"),
    inlineRow(['Name', 'Nickname/a.k.a'], [9000, 12600], 24),
    inlineRow(['Birthdate', 'Age', 'Sex'], [7200, 9800, 11800], 12),
    inlineRow(['Status', 'Nationality'], [9800], 22),
    inlineRow(['Religion', 'Birthplace'], [9800], 22),
    inlineField('Provincial/Permanent Address', provincialAddress, 9600, 28),
    inlineField('Present Address', presentAddress, 9600, 28),
    inlineRow(['Source of Referral', 'Date of Referral'], [9800], 22),
    inlineRow(['Address and Tel. #', 'Relation to client'], [9800], 22),
    sectionTitle('EDUCATIONAL ATTAINMENT'),
    tableWithHeader(['LEVEL','NAME OF SCHOOL','SCHOOL ADDRESS','YEAR'], [
      ...['elementary','highSchool','seniorHighSchool','vocationalCourse','college','others'].map(key => {
        const row = (edu && edu[key]) || {};
        const label = key === 'others' ? 'Others' : key === 'vocationalCourse' ? 'Vocational Course' : key === 'seniorHighSchool' ? 'Senior High School' : key === 'highSchool' ? 'High School' : key === 'elementary' ? 'Elementary' : 'College';
        return new TableRow({ children: [
          new TableCell({ children: [ new Paragraph(label) ] }),
          new TableCell({ children: [ new Paragraph(val(row.schoolName || '')) ] }),
          new TableCell({ children: [ new Paragraph(val(row.schoolAddress || '')) ] }),
          new TableCell({ children: [ new Paragraph(val(row.year || '')) ] })
        ] });
      })
    ] ),
    sectionTitle('SACRAMENTAL RECORD'),
    tableWithHeader(['Sacrament','Date Received','Place/Parish'], [
      ...['baptism','firstCommunion','confirmation','others'].map(key => {
        const row = (sacr && sacr[key]) || {};
        const label = key === 'firstCommunion' ? 'First Communion' : key === 'confirmation' ? 'Confirmation' : key === 'baptism' ? 'Baptism' : 'Others';
        return new TableRow({ children: [
          new TableCell({ children: [ new Paragraph(label) ] }),
          new TableCell({ children: [ new Paragraph(val(row.dateReceived || '')) ] }),
          new TableCell({ children: [ new Paragraph(val(row.placeParish || '')) ] })
        ] });
      })
    ] ),
    sectionTitle('II. FAMILY/HOUSEHOLD COMPOSITION'),
    nameCheckboxLine('Husband/Father', 22, father.living, 720, 14),
    inlineRowCustom(['Birthdate','Age','Educational Attainment'], [7800, 9800, 12600], [9, 5, 20]),
    inlineRowCustom(['Occupation','Other Skills','Income'], [7800, 9800, 12600], [18, 18, 12]),
    inlineField('Address and Tel. Nos.', father.address, 9600, 40),
    nameCheckboxLine('Mother/Wife', 22, mother.living, 720, 14),
    inlineRowCustom(['Birthdate','Age','Educational Attainment'], [7800, 9800, 12600], [9, 5, 20]),
    inlineRowCustom(['Occupation','Other Skills','Income'], [7800, 9800, 12600], [18, 18, 12]),
    inlineField('Address and Tel. Nos.', mother.address, 9600, 40),
    inlineRowCustom(['Guardian','Relation to the client'], [10400], [20, 20]),
    inlineField('Address', guardian.address, 9600, 48),
    sectionTitle('CIVIL STATUS OF PARENTS'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: textColor },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: textColor },
        left: { style: BorderStyle.SINGLE, size: 2, color: textColor },
        right: { style: BorderStyle.SINGLE, size: 2, color: textColor },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: textColor },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: textColor },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: ' ', size: 1 }) ] }) ] }),
            new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: 'Date and Place', bold: true }) ], alignment: AlignmentType.CENTER }) ] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [ new Paragraph(`${box(marriedInChurch)} Married in church`) ] }),
            new TableCell({ children: [ new Paragraph('') ] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [ new Paragraph(`${box(liveInCommonLaw)} Live-in/Common Law`) ] }),
            new TableCell({ children: [ new Paragraph('') ] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [ new Paragraph(`${box(civilMarriage)} Civil Marriage`) ] }),
            new TableCell({ children: [ new Paragraph('') ] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [ new Paragraph(`${box(separated)} Separated`) ] }),
            new TableCell({ children: [ new Paragraph('') ] }),
          ],
        }),
      ],
    }),
    sectionTitle('FAMILY COMPOSITION (Siblings/Children)'),
    tableWithHeader(['Name','Relation to the client','Age/DOB','Sex','Status','Edu. Attainment','Address','Occupation/Income'], [
      ...familyRowsPadded
    ] ),
    sectionTitle('OTHERS EXTENDED FAMILY'),
    tableWithHeader(['Name','Relation to the client','Age/DOB','Sex','Status','Edu. Attainment','Address','Occupation/Income'], [
      ...extRowsPadded
    ] ),
    sectionTitle('SERVICES RECEIVED FROM OTHER AGENCIES/INDIVIDUALS'),
    tableWithHeader(['Name of agencies/persons','Address/date/duration','Services Received'], [
      ...agencyRowsPadded
    ] ),
    sectionTitle('III. BRIEF DESCRIPTION OF THE CLIENT UPON INTAKE'),
    new Paragraph({ children: [ new TextRun({ text: 'Client:', bold: true }) ] }),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    new Paragraph({ children: [ new TextRun({ text: 'Parents / Relatives / Guardian:', bold: true }) ] }),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    sectionTitle('IV. PROBLEM PRESENTED'),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    sectionTitle('V. BRIEF HISTORY OF THE PROBLEM'),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    sectionTitle('VI. MEDICAL HISTORY / HEALTH STATUS'),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    sectionTitle('VII. ECONOMIC SITUATION'),
    ...Array.from({ length: 4 }, () => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } }, spacing: { after: 60 } })),
    sectionTitle('VIII. FAMILY BACKGROUND'),
    new Paragraph(val(caseData.familyBackground || caseData.family_background || '')),
    sectionTitle('IX. ASSESSMENT'),
    new Paragraph(val(caseData.assessment || '')),
    new Paragraph({ children: [ new TextRun({ text: 'Client is eligible for the following programs/services:', bold: true }) ] }),
    new Paragraph(box(caseData.programType === 'Children') + ' Children'),
    new Paragraph(box(caseData.programType === 'Youth') + ' Youth (SAVES)'),
    new Paragraph(box(caseData.programType === 'Mother') + ' Mother/Short Crisis Intervention'),
    sectionTitle('X. RECOMMENDATION/PLAN OF ACTION'),
    new Paragraph(val(caseData.recommendation || '')),
    new Paragraph(''),
    new Paragraph({ children: [ new TextRun({ text: '____________________', bold: true }) ] , alignment: AlignmentType.RIGHT }),
    new Paragraph({ children: [ new TextRun({ text: 'Intake Worker', color: textColor }) ], alignment: AlignmentType.RIGHT }),
    new Paragraph(''),
    new Paragraph({ children: [ new TextRun({ text: '____________________', bold: true }) ] , alignment: AlignmentType.RIGHT }),
    new Paragraph({ children: [ new TextRun({ text: 'Head, DSWD', color: textColor }) ], alignment: AlignmentType.RIGHT }),
    new Paragraph(''),
    new Paragraph({ children: [ new TextRun({ text: '____________________', bold: true }) ] , alignment: AlignmentType.RIGHT }),
    new Paragraph({ children: [ new TextRun({ text: 'Administrator', color: textColor }) ], alignment: AlignmentType.RIGHT })
  ] }] });

  const buffer = await Packer.toBlob(doc);
  const fileName = `General_Intake_Form_${caseData.lastName || caseData.last_name || 'Unknown'}_${caseData.firstName || caseData.first_name || 'Unknown'}_${new Date().toISOString().split('T')[0]}.docx`;
  const url = window.URL.createObjectURL(buffer);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};