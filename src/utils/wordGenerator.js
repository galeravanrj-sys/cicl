import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export const generateCaseReportWord = (caseData) => {
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
  const templateUrl = '/template/GENERAL_INTAKEFORM_ASILO.docx';
  const fileName = `Case_Report_${caseData.lastName || 'Unknown'}_${caseData.firstName || 'Unknown'}_${new Date().toISOString().split('T')[0]}.docx`;

  const buildTemplateData = (c) => ({
    // Common identity fields (add more keys as your template supports)
    first_name: c.firstName || c.first_name || '',
    middle_name: c.middleName || c.middle_name || '',
    last_name: c.lastName || c.last_name || '',
    sex: c.sex || '',
    birthdate: c.birthdate || '',
    age: c.age || '',
    civil_status: c.status || '',
    religion: c.religion || '',
    address: c.address || '',
    barangay: c.barangay || '',
    municipality: c.municipality || '',
    province: c.province || '',
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
    guardian_address: c.guardianAddress || c.guardian_address || '',

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

  try {
    const res = await fetch(templateUrl);
    if (!res.ok) throw new Error(`Template fetch failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    const zip = new PizZip(ab);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.setData(buildTemplateData(caseData));
    // If the template has no tags, render() still passes; tags remain as-is.
    doc.render();
    const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const url = window.URL.createObjectURL(out);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  } catch (err) {
    console.error('Template-based Word render failed, falling back to dynamic DOCX:', err);
    // Fallback: dynamically generate a professional DOCX without template
    try {
      const doc = generateCaseReportWord(caseData);
      const buffer = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(buffer);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return;
    } catch (fallbackErr) {
      console.error('Dynamic DOCX generation failed:', fallbackErr);
      alert('Error generating Word document.');
      return;
    }
  }
  // No fallback: only use provided template
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