const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./middleware/auth');

// Get all cases for statistics (no pagination)
router.get('/all', auth, async (req, res) => {
  try {
    // Get all cases for dashboard and reports statistics with optimized query
    const result = await db.query(
      'SELECT id, first_name, last_name, middle_name, sex, birthdate, status, program_type, last_updated, created_at, profile_picture FROM cases ORDER BY last_updated DESC, created_at DESC'
    );
    
    // Format the data for the frontend
    const cases = result.rows.map(caseItem => ({
      id: caseItem.id,
      name: `${caseItem.first_name} ${caseItem.last_name}`,
      firstName: caseItem.first_name,
      lastName: caseItem.last_name,
      age: calculateAge(caseItem.birthdate),
      birthdate: caseItem.birthdate,
      programType: caseItem.program_type,
      status: caseItem.status,
      lastUpdated: caseItem.last_updated || caseItem.created_at,
      createdAt: caseItem.created_at,
      profilePicture: caseItem.profile_picture
    }));
    
    res.json(cases);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Another case with this name and birthdate already exists.' });
    }
    res.status(500).send('Server error');
  }
});

// Get all cases
router.get('/', auth, async (req, res) => {
  try {
    // Check if this is a name uniqueness validation request
    if (req.query.checkName === 'true' && req.query.firstName && req.query.lastName) {
      const birthdateParam = req.query.birthdate || null;
      const existingCase = await db.query(
        'SELECT 1 FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND birthdate IS NOT DISTINCT FROM $3',
        [req.query.firstName, req.query.lastName, birthdateParam]
      );
      
      return res.json({ 
        exists: existingCase.rows.length > 0,
        message: existingCase.rows.length > 0 ? 
          'A case with this name and birthdate already exists.' : 
          'Name and birthdate are unique and available.'
      });
    }
    
    // Normal case listing flow with pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count with optimized query
    const countResult = await db.query('SELECT COUNT(*) FROM cases');
    const totalCases = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCases / limit);
    
    // Get paginated cases with optimized query and indexes
    const result = await db.query(
      'SELECT id, first_name, last_name, middle_name, sex, birthdate, status, program_type, last_updated, created_at, profile_picture FROM cases ORDER BY last_updated DESC, created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    // Format the data for the frontend
    const cases = result.rows.map(caseItem => ({
      id: caseItem.id,
      name: `${caseItem.first_name} ${caseItem.last_name}`,
      birthdate: caseItem.birthdate,
      sex: caseItem.sex,
      age: calculateAge(caseItem.birthdate),
      programType: caseItem.program_type,
      status: caseItem.status, // Preserve actual database status
      lastUpdated: formatDate(caseItem.last_updated || caseItem.created_at),
      profilePicture: caseItem.profile_picture
    }));
    
    // Return paginated response
    res.json({
      cases,
      pagination: {
        currentPage: page,
        totalPages,
        totalCases,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get case by ID with all related data
router.get('/:id', auth, async (req, res) => {
  try {
    // Get main case data
    const caseResult = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const caseData = caseResult.rows[0];

    // Get related data from all tables
    const [
      lifeSkillsResult,
      vitalSignsResult,
      educationalResult,
      sacramentalResult,
      agenciesResult,
      familyMembersResult,
      extendedFamilyResult
    ] = await Promise.all([
      db.query('SELECT * FROM life_skills WHERE case_id = $1 ORDER BY date_completed DESC', [req.params.id]),
      db.query('SELECT * FROM vital_signs WHERE case_id = $1 ORDER BY date_recorded DESC', [req.params.id]),
      db.query('SELECT * FROM educational_attainment WHERE case_id = $1 ORDER BY level', [req.params.id]),
      db.query('SELECT * FROM sacramental_records WHERE case_id = $1 ORDER BY date_received', [req.params.id]),
      db.query('SELECT * FROM agencies_persons WHERE case_id = $1 ORDER BY name', [req.params.id]),
      db.query('SELECT * FROM family_members WHERE case_id = $1 ORDER BY relation, name', [req.params.id]),
      db.query('SELECT * FROM extended_family WHERE case_id = $1 ORDER BY relationship, name', [req.params.id])
    ]);

    // Combine all data
    const completeCase = {
      ...caseData,
      lifeSkills: lifeSkillsResult.rows,
      vitalSigns: vitalSignsResult.rows,
      educationalAttainment: educationalResult.rows,
      sacramentalRecords: sacramentalResult.rows,
      agencies: agenciesResult.rows,
      familyMembers: familyMembersResult.rows,
      extendedFamily: extendedFamilyResult.rows
    };

    res.json(completeCase);
  } catch (err) {
    console.error('Case fetch error:', err.message);
    console.error('Full error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Create a new case
router.post('/', auth, async (req, res) => {
  try {
    const toDateOnly = (d) => {
      if (d === null || d === undefined) return null;
      const s = String(d).trim();
      if (!s) return null;
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0,10);
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (m) {
        const mm = m[1].padStart(2,'0');
        const dd = m[2].padStart(2,'0');
        let yy = m[3];
        if (yy.length === 2) yy = (parseInt(yy,10) >= 70 ? '19' : '20') + yy; // handle 2-digit
        return `${yy}-${mm}-${dd}`;
      }
      return null;
    };
    console.log('=== CASE CREATION DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      firstName, lastName, middleName, sex, birthdate, status, religion,
      address, sourceOfReferral, caseType, assignedHouseParent, programType, program_type,
      problemPresented, briefHistory, economicSituation, medicalHistory,
      familyBackground, checklist, recommendation, assessment, clientDescription, parentsDescription,
      // New personal details fields
      nickname, birthplace, nationality, provincialAddress, presentAddress,
      // New referral fields
      otherSourceOfReferral, dateOfReferral, addressAndTel, relationToClient,
      // Parent/Guardian fields
      fatherName, fatherAge, fatherEducation, fatherOccupation, fatherOtherSkills,
      fatherAddress, fatherIncome, fatherLiving,
      motherName, motherAge, motherEducation, motherOccupation, motherOtherSkills,
      motherAddress, motherIncome, motherLiving,
      guardianName, guardianAge, guardianEducation, guardianOccupation, guardianOtherSkills,
      guardianRelation, guardianAddress, guardianIncome, guardianLiving, guardianDeceased,
      // Civil status fields
      marriedInChurch, liveInCommonLaw, civilMarriage, separated, marriageDatePlace,
      // Family data arrays
      familyMembers, extendedFamily,
      // Also accept snake_case keys for compatibility
      first_name, last_name, middle_name, source_of_referral, case_type,
      assigned_house_parent, problem_presented, brief_history, economic_situation,
      medical_history, family_background, provincial_address, present_address,
      other_source_of_referral, date_of_referral, address_and_tel, relation_to_client,
      father_name, father_age, father_education, father_occupation, father_other_skills,
      father_address, father_income, father_living, mother_name, mother_age, mother_education,
      mother_occupation, mother_other_skills, mother_address, mother_income, mother_living,
      guardian_name, guardian_age, guardian_education, guardian_occupation, guardian_other_skills,
      guardian_relation, guardian_address, guardian_income, guardian_living, guardian_deceased,
      married_in_church, live_in_common_law, civil_marriage, marriage_date_place,
      family_members, extended_family
    } = req.body;

    // Resolve actual values from camelCase or snake_case
    const actualFirstName = firstName || first_name;
    const actualLastName = lastName || last_name;
    const actualMiddleName = middleName || middle_name;
    const actualSourceOfReferral = sourceOfReferral || source_of_referral;
    const actualCaseType = caseType || case_type;
    const actualAssignedHouseParent = assignedHouseParent || assigned_house_parent;
    const actualProblemPresented = problemPresented || problem_presented;
    const actualBriefHistory = briefHistory || brief_history;
    const actualEconomicSituation = economicSituation || economic_situation;
    const actualMedicalHistory = medicalHistory || medical_history;
    const actualFamilyBackground = familyBackground || family_background;
    const actualClientDescription = clientDescription || req.body.client_description;
    const actualParentsDescription = parentsDescription || req.body.parents_description;
    
    // Resolve new fields
    const actualNickname = nickname;
    const actualBirthplace = birthplace;
    const actualNationality = nationality;
    const actualProvincialAddress = provincialAddress || provincial_address;
    const actualPresentAddress = presentAddress || present_address;
    const actualOtherSourceOfReferral = otherSourceOfReferral || other_source_of_referral;
    const actualDateOfReferral = dateOfReferral || date_of_referral;
    const actualAddressAndTel = addressAndTel || address_and_tel;
    const actualRelationToClient = relationToClient || relation_to_client;
    
    // Parent/Guardian fields
    const actualFatherName = fatherName || father_name;
    const actualFatherAge = fatherAge || father_age;
    const actualFatherEducation = fatherEducation || father_education;
    const actualFatherOccupation = fatherOccupation || father_occupation;
    const actualFatherOtherSkills = fatherOtherSkills || father_other_skills;
    const actualFatherAddress = fatherAddress || father_address;
    const actualFatherIncome = fatherIncome || father_income;
    const actualFatherLiving = fatherLiving !== undefined ? fatherLiving : father_living;
    
    const actualMotherName = motherName || mother_name;
    const actualMotherAge = motherAge || mother_age;
    const actualMotherEducation = motherEducation || mother_education;
    const actualMotherOccupation = motherOccupation || mother_occupation;
    const actualMotherOtherSkills = motherOtherSkills || mother_other_skills;
    const actualMotherAddress = motherAddress || mother_address;
    const actualMotherIncome = motherIncome || mother_income;
    const actualMotherLiving = motherLiving !== undefined ? motherLiving : mother_living;
    
    const actualGuardianName = guardianName || guardian_name;
    const actualGuardianAge = guardianAge || guardian_age;
    const actualGuardianEducation = guardianEducation || guardian_education;
    const actualGuardianOccupation = guardianOccupation || guardian_occupation;
    const actualGuardianOtherSkills = guardianOtherSkills || guardian_other_skills;
    const actualGuardianRelation = guardianRelation || guardian_relation;
    const actualGuardianAddress = guardianAddress || guardian_address;
    const actualGuardianIncome = guardianIncome || guardian_income;
    const actualGuardianLiving = guardianLiving !== undefined ? guardianLiving : guardian_living;
    const actualGuardianDeceased = guardianDeceased !== undefined ? guardianDeceased : guardian_deceased;
    
    // Civil status fields
    const actualMarriedInChurch = marriedInChurch !== undefined ? marriedInChurch : married_in_church;
    const actualLiveInCommonLaw = liveInCommonLaw !== undefined ? liveInCommonLaw : live_in_common_law;
    const actualCivilMarriage = civilMarriage !== undefined ? civilMarriage : civil_marriage;
    const actualSeparated = separated;
    const actualMarriageDatePlace = marriageDatePlace || marriage_date_place;
    
    // Family data
    const actualFamilyMembers = familyMembers || family_members || [];
    const actualExtendedFamily = extendedFamily || extended_family || [];

    console.log('Processed fields:', {
      actualFirstName, actualLastName, actualMiddleName, sex, birthdate, status, religion,
      address, actualSourceOfReferral, actualCaseType, actualAssignedHouseParent,
      programType, program_type, actualProblemPresented, actualBriefHistory,
      actualEconomicSituation, actualMedicalHistory, actualFamilyBackground,
      checklist, recommendation, assessment
    });

    // Validate required fields
    if (!actualFirstName || !actualLastName) {
      console.log('Missing required fields - firstName:', actualFirstName, 'lastName:', actualLastName);
      return res.status(400).json({ 
        message: 'First name and last name are required fields.'
      });
    }
    
    // Enforce uniqueness on case-insensitive name + birthdate
    const normalizedBirthdate = toDateOnly(birthdate);
    const dupCheck = await db.query(
      'SELECT 1 FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND birthdate IS NOT DISTINCT FROM $3',
      [actualFirstName, actualLastName, normalizedBirthdate]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Another case with this name and birthdate already exists.'
      });
    }
    
    // Use program_type if provided, otherwise use programType, caseType (resolved), then fallback to default
    const actualProgramType = program_type || programType || actualCaseType || 'Children';
    
    const normalizedDateOfReferral = toDateOnly(actualDateOfReferral);
    const result = await db.query(
      `INSERT INTO cases (
        first_name, last_name, middle_name, sex, birthdate, status, religion,
        address, source_of_referral, case_type, assigned_house_parent, program_type,
        problem_presented, brief_history, economic_situation, medical_history,
        family_background, client_description, parents_description, checklist, recommendation, assessment, last_updated,
        nickname, birthplace, nationality, provincial_address, present_address,
        other_source_of_referral, date_of_referral, address_and_tel, relation_to_client,
        father_name, father_age, father_education, father_occupation, father_other_skills,
        father_address, father_income, father_living,
        mother_name, mother_age, mother_education, mother_occupation, mother_other_skills,
        mother_address, mother_income, mother_living,
        guardian_name, guardian_age, guardian_education, guardian_occupation, guardian_other_skills,
        guardian_relation, guardian_address, guardian_income, guardian_living, guardian_deceased,
        married_in_church, live_in_common_law, civil_marriage, separated, marriage_date_place
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
        $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
        $59, $60, $61, $62, $63
      ) RETURNING *`,
      [
        actualFirstName, actualLastName, actualMiddleName, sex, normalizedBirthdate, status, religion,
        address, actualSourceOfReferral, actualCaseType, actualAssignedHouseParent, actualProgramType,
        actualProblemPresented, actualBriefHistory, actualEconomicSituation, actualMedicalHistory,
        actualFamilyBackground, actualClientDescription || '', actualParentsDescription || '', JSON.stringify(checklist || []), recommendation, assessment || '', new Date(),
        actualNickname, actualBirthplace, actualNationality, actualProvincialAddress, actualPresentAddress,
        actualOtherSourceOfReferral, normalizedDateOfReferral, actualAddressAndTel, actualRelationToClient,
        actualFatherName, actualFatherAge, actualFatherEducation, actualFatherOccupation, actualFatherOtherSkills,
        actualFatherAddress, actualFatherIncome, actualFatherLiving,
        actualMotherName, actualMotherAge, actualMotherEducation, actualMotherOccupation, actualMotherOtherSkills,
        actualMotherAddress, actualMotherIncome, actualMotherLiving,
        actualGuardianName, actualGuardianAge, actualGuardianEducation, actualGuardianOccupation, actualGuardianOtherSkills,
        actualGuardianRelation, actualGuardianAddress, actualGuardianIncome, actualGuardianLiving, actualGuardianDeceased,
        actualMarriedInChurch, actualLiveInCommonLaw, actualCivilMarriage, actualSeparated, actualMarriageDatePlace
      ]
    );
    
    console.log('Case created successfully:', result.rows[0]);
    const newCase = result.rows[0];
    
    // Save family members if provided
    if (actualFamilyMembers && actualFamilyMembers.length > 0) {
      for (const member of actualFamilyMembers) {
        if (member.name && member.name.trim()) {
          await db.query(
            `INSERT INTO family_members (
              case_id, name, relation, age, sex, status, education, address, occupation, income
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              newCase.id, member.name, member.relation, member.age, member.sex,
              member.status, member.education, member.address, member.occupation, member.income
            ]
          );
        }
      }
    }
    
    // Save extended family if provided
    if (actualExtendedFamily && actualExtendedFamily.length > 0) {
      for (const member of actualExtendedFamily) {
        if (member.name && member.name.trim()) {
          await db.query(
            `INSERT INTO extended_family (
              case_id, name, relationship, age, sex, status, education, occupation, income
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              newCase.id, member.name, member.relationship, member.age, member.sex,
              member.status, member.education, member.occupation, member.income
            ]
          );
        }
      }
    }

    // Save educational attainment if provided
    const educationalAttainment = req.body.educationalAttainment;
    if (educationalAttainment && typeof educationalAttainment === 'object') {
      const levelLabels = {
        elementary: 'Elementary',
        highSchool: 'High School',
        seniorHighSchool: 'Senior High School',
        vocationalCourse: 'Vocational Course',
        college: 'College',
        others: 'Others'
      };
      for (const [key, data] of Object.entries(educationalAttainment)) {
        const level = levelLabels[key] || key;
        const schoolName = data?.schoolName?.trim();
        const schoolAddress = data?.schoolAddress?.trim();
        const yearCompleted = data?.year?.trim();
        if (schoolName) {
          await db.query(
            `INSERT INTO educational_attainment (case_id, level, school_name, school_address, year_completed)
             VALUES ($1, $2, $3, $4, $5)`,
            [newCase.id, level, schoolName, schoolAddress || null, yearCompleted || null]
          );
        }
      }
    }

    // Save sacramental records if provided
    const sacramentalRecord = req.body.sacramentalRecord;
    if (sacramentalRecord && typeof sacramentalRecord === 'object') {
      const sacramentLabels = {
        baptism: 'Baptism',
        firstCommunion: 'First Communion',
        confirmation: 'Confirmation',
        others: 'Others'
      };
      for (const [key, data] of Object.entries(sacramentalRecord)) {
        const sacrament = sacramentLabels[key] || key;
        const dateReceived = data?.dateReceived || null;
        const placeParish = data?.placeParish?.trim() || null;
        if (dateReceived || placeParish) {
          await db.query(
            `INSERT INTO sacramental_records (case_id, sacrament, date_received, place_parish)
             VALUES ($1, $2, $3, $4)`,
            [newCase.id, sacrament, dateReceived || null, placeParish]
          );
        }
      }
    }

    // Save agencies/persons if provided
    const agencies = Array.isArray(req.body.agencies) ? req.body.agencies : [];
    if (agencies.length > 0) {
      for (const agency of agencies) {
        const name = agency?.name?.trim();
        const addressDateDuration = agency?.addressDateDuration?.trim() || null;
        const servicesReceived = agency?.servicesReceived?.trim() || null;
        if (name) {
          await db.query(
            `INSERT INTO agencies_persons (case_id, name, address_date_duration, services_received)
             VALUES ($1, $2, $3, $4)`,
            [newCase.id, name, addressDateDuration, servicesReceived]
          );
        }
      }
    }
    
    res.status(201).json(newCase);
  } catch (err) {
    console.error('Error creating case:', err.message);
    console.error('Full error:', err);
    
    // Handle unique constraint violation for name + birthdate
    if (err.code === '23505') {
      return res.status(400).json({ 
        message: 'Another case with this name and birthdate already exists.',
        error: err.code
      });
    }

    // Handle other database errors
    if (err.code) {
      return res.status(400).json({ 
        message: 'Database error occurred while creating the case.',
        error: err.code,
        details: err.message
      });
    }
    
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a case
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log the entire request body for debugging
    console.log("Full request body received:", JSON.stringify(req.body, null, 2));
    
    const {
      firstName, lastName, middleName, sex, birthdate, status, religion,
      address, sourceOfReferral, caseType, assignedHouseParent, programType, program_type,
      problemPresented, briefHistory, economicSituation, medicalHistory,
      familyBackground, checklist, recommendation, assessment, profilePicture, clientDescription, parentsDescription,
      // New personal details fields
      nickname, birthplace, nationality, provincialAddress, presentAddress,
      // New referral fields
      otherSourceOfReferral, dateOfReferral, addressAndTel, relationToClient,
      // Parent/Guardian fields
      fatherName, fatherAge, fatherEducation, fatherOccupation, fatherOtherSkills,
      fatherAddress, fatherIncome, fatherLiving,
      motherName, motherAge, motherEducation, motherOccupation, motherOtherSkills,
      motherAddress, motherIncome, motherLiving,
      guardianName, guardianAge, guardianEducation, guardianOccupation, guardianOtherSkills,
      guardianRelation, guardianAddress, guardianIncome, guardianLiving, guardianDeceased,
      // Civil status fields
      marriedInChurch, liveInCommonLaw, civilMarriage, separated, marriageDatePlace,
      // Family data arrays
      familyMembers, extendedFamily,
      // Also handle snake_case versions for compatibility
      first_name, last_name, middle_name, source_of_referral, case_type,
      assigned_house_parent, problem_presented, brief_history, economic_situation,
      medical_history, family_background, provincial_address, present_address,
      client_description, parents_description,
      other_source_of_referral, date_of_referral, address_and_tel, relation_to_client,
      father_name, father_age, father_education, father_occupation, father_other_skills,
      father_address, father_income, father_living, mother_name, mother_age, mother_education,
      mother_occupation, mother_other_skills, mother_address, mother_income, mother_living,
      guardian_name, guardian_age, guardian_education, guardian_occupation, guardian_other_skills,
      guardian_relation, guardian_address, guardian_income, guardian_living, guardian_deceased,
      married_in_church, live_in_common_law, civil_marriage, marriage_date_place,
      family_members, extended_family
    } = req.body;
    
    // Use camelCase if available, otherwise fall back to snake_case
    const actualFirstName = firstName || first_name;
    const actualLastName = lastName || last_name;
    const actualMiddleName = middleName || middle_name;
    const actualSourceOfReferral = sourceOfReferral || source_of_referral;
    const actualCaseType = caseType || case_type;
    const actualAssignedHouseParent = assignedHouseParent || assigned_house_parent;
    const actualProblemPresented = problemPresented || problem_presented;
    const actualBriefHistory = briefHistory || brief_history;
    const actualEconomicSituation = economicSituation || economic_situation;
    const actualMedicalHistory = medicalHistory || medical_history;
    const actualFamilyBackground = familyBackground || family_background;
    const actualClientDescription = clientDescription || client_description;
    const actualParentsDescription = parentsDescription || parents_description;
    
    // Resolve new fields for update
    const actualNickname = nickname;
    const actualBirthplace = birthplace;
    const actualNationality = nationality;
    const actualProvincialAddress = provincialAddress || provincial_address;
    const actualPresentAddress = presentAddress || present_address;
    const actualOtherSourceOfReferral = otherSourceOfReferral || other_source_of_referral;
    const actualDateOfReferral = dateOfReferral || date_of_referral;
    const actualAddressAndTel = addressAndTel || address_and_tel;
    const actualRelationToClient = relationToClient || relation_to_client;
    
    // Parent/Guardian fields
    const actualFatherName = fatherName || father_name;
    const actualFatherAge = fatherAge || father_age;
    const actualFatherEducation = fatherEducation || father_education;
    const actualFatherOccupation = fatherOccupation || father_occupation;
    const actualFatherOtherSkills = fatherOtherSkills || father_other_skills;
    const actualFatherAddress = fatherAddress || father_address;
    const actualFatherIncome = fatherIncome || father_income;
    const actualFatherLiving = fatherLiving !== undefined ? fatherLiving : father_living;
    
    const actualMotherName = motherName || mother_name;
    const actualMotherAge = motherAge || mother_age;
    const actualMotherEducation = motherEducation || mother_education;
    const actualMotherOccupation = motherOccupation || mother_occupation;
    const actualMotherOtherSkills = motherOtherSkills || mother_other_skills;
    const actualMotherAddress = motherAddress || mother_address;
    const actualMotherIncome = motherIncome || mother_income;
    const actualMotherLiving = motherLiving !== undefined ? motherLiving : mother_living;
    
    const actualGuardianName = guardianName || guardian_name;
    const actualGuardianAge = guardianAge || guardian_age;
    const actualGuardianEducation = guardianEducation || guardian_education;
    const actualGuardianOccupation = guardianOccupation || guardian_occupation;
    const actualGuardianOtherSkills = guardianOtherSkills || guardian_other_skills;
    const actualGuardianRelation = guardianRelation || guardian_relation;
    const actualGuardianAddress = guardianAddress || guardian_address;
    const actualGuardianIncome = guardianIncome || guardian_income;
    const actualGuardianLiving = guardianLiving !== undefined ? guardianLiving : guardian_living;
    const actualGuardianDeceased = guardianDeceased !== undefined ? guardianDeceased : guardian_deceased;
    
    // Civil status fields
    const actualMarriedInChurch = marriedInChurch !== undefined ? marriedInChurch : married_in_church;
    const actualLiveInCommonLaw = liveInCommonLaw !== undefined ? liveInCommonLaw : live_in_common_law;
    const actualCivilMarriage = civilMarriage !== undefined ? civilMarriage : civil_marriage;
    const actualSeparated = separated;
    const actualMarriageDatePlace = marriageDatePlace || marriage_date_place;
    
    // Family data
    const actualFamilyMembers = familyMembers || family_members || [];
    const actualExtendedFamily = extendedFamily || extended_family || [];
    
    console.log("Processed field values:", {
      actualFirstName,
      actualLastName,
      actualMiddleName,
      status,
      sex,
      birthdate
    });
    
    // Check if the case exists
    const existingCase = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
    
    if (existingCase.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Enforce uniqueness on case-insensitive name + birthdate for updates
    const normalizedBirthdate = toDateOnly(birthdate);
    const duplicateCheck = await db.query(
      'SELECT 1 FROM cases WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND birthdate IS NOT DISTINCT FROM $3 AND id != $4',
      [actualFirstName, actualLastName, normalizedBirthdate, id]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Another case with this name and birthdate already exists.' });
    }
    
    // Use program_type if provided, otherwise use programType, caseType, and only fall back to default as last resort
    const actualProgramType = program_type || programType || actualCaseType;
    
    console.log("Update case - Program type received:", { programType, program_type, caseType: actualCaseType, actualProgramType });
    
    const normalizedDateOfReferral = toDateOnly(dateOfReferral || date_of_referral);
    const result = await db.query(
      `UPDATE cases SET
        first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), middle_name = COALESCE($3, middle_name), sex = COALESCE($4, sex), birthdate = COALESCE($5, birthdate),
        status = COALESCE($6, status), religion = COALESCE($7, religion), address = COALESCE($8, address), source_of_referral = COALESCE($9, source_of_referral),
        case_type = COALESCE($10, case_type), assigned_house_parent = COALESCE($11, assigned_house_parent), program_type = COALESCE($12, program_type),
        problem_presented = COALESCE($13, problem_presented), brief_history = COALESCE($14, brief_history), economic_situation = COALESCE($15, economic_situation),
        medical_history = COALESCE($16, medical_history), family_background = COALESCE($17, family_background), checklist = COALESCE($18, checklist),
        recommendation = COALESCE($19, recommendation), assessment = COALESCE($20, assessment), profile_picture = COALESCE($21, profile_picture),
        updated_at = CURRENT_TIMESTAMP, last_updated = COALESCE($22, last_updated),
        nickname = COALESCE($23, nickname), birthplace = COALESCE($24, birthplace), nationality = COALESCE($25, nationality), provincial_address = COALESCE($26, provincial_address), present_address = COALESCE($27, present_address),
        other_source_of_referral = COALESCE($28, other_source_of_referral), date_of_referral = COALESCE($29, date_of_referral), address_and_tel = COALESCE($30, address_and_tel), relation_to_client = COALESCE($31, relation_to_client),
        father_name = COALESCE($32, father_name), father_age = COALESCE($33, father_age), father_education = COALESCE($34, father_education), father_occupation = COALESCE($35, father_occupation), father_other_skills = COALESCE($36, father_other_skills),
        father_address = COALESCE($37, father_address), father_income = COALESCE($38, father_income), father_living = COALESCE($39, father_living),
        mother_name = COALESCE($40, mother_name), mother_age = COALESCE($41, mother_age), mother_education = COALESCE($42, mother_education), mother_occupation = COALESCE($43, mother_occupation), mother_other_skills = COALESCE($44, mother_other_skills),
        mother_address = COALESCE($45, mother_address), mother_income = COALESCE($46, mother_income), mother_living = COALESCE($47, mother_living),
        guardian_name = COALESCE($48, guardian_name), guardian_age = COALESCE($49, guardian_age), guardian_education = COALESCE($50, guardian_education), guardian_occupation = COALESCE($51, guardian_occupation), guardian_other_skills = COALESCE($52, guardian_other_skills),
        guardian_relation = COALESCE($53, guardian_relation), guardian_address = COALESCE($54, guardian_address), guardian_income = COALESCE($55, guardian_income), guardian_living = COALESCE($56, guardian_living), guardian_deceased = COALESCE($57, guardian_deceased),
        married_in_church = COALESCE($58, married_in_church), live_in_common_law = COALESCE($59, live_in_common_law), civil_marriage = COALESCE($60, civil_marriage), separated = COALESCE($61, separated), marriage_date_place = COALESCE($62, marriage_date_place),
        client_description = COALESCE($63, client_description), parents_description = COALESCE($64, parents_description)
        WHERE id = $65 RETURNING *`,
      [
        actualFirstName, actualLastName, actualMiddleName, sex, normalizedBirthdate, status, religion,
        address, actualSourceOfReferral, actualCaseType, actualAssignedHouseParent, actualProgramType,
        actualProblemPresented, actualBriefHistory, actualEconomicSituation, actualMedicalHistory,
        actualFamilyBackground, checklist !== undefined ? JSON.stringify(checklist) : null, recommendation, assessment !== undefined ? assessment : null,
        profilePicture !== undefined ? profilePicture : null, new Date(),
        actualNickname, actualBirthplace, actualNationality, actualProvincialAddress, actualPresentAddress,
        actualOtherSourceOfReferral, normalizedDateOfReferral, actualAddressAndTel, actualRelationToClient,
        actualFatherName, actualFatherAge, actualFatherEducation, actualFatherOccupation, actualFatherOtherSkills,
        actualFatherAddress, actualFatherIncome, actualFatherLiving,
        actualMotherName, actualMotherAge, actualMotherEducation, actualMotherOccupation, actualMotherOtherSkills,
        actualMotherAddress, actualMotherIncome, actualMotherLiving,
        actualGuardianName, actualGuardianAge, actualGuardianEducation, actualGuardianOccupation, actualGuardianOtherSkills,
        actualGuardianRelation, actualGuardianAddress, actualGuardianIncome, actualGuardianLiving, actualGuardianDeceased,
        actualMarriedInChurch, actualLiveInCommonLaw, actualCivilMarriage, actualSeparated, actualMarriageDatePlace,
        actualClientDescription !== undefined ? actualClientDescription : null, actualParentsDescription !== undefined ? actualParentsDescription : null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    const updatedCase = result.rows[0];
    
    // Update family members if provided
    if (actualFamilyMembers && actualFamilyMembers.length > 0) {
      // Delete existing family members for this case
      await db.query('DELETE FROM family_members WHERE case_id = $1', [id]);
      
      // Insert new family members
      for (const member of actualFamilyMembers) {
        if (member.name && member.name.trim()) {
          await db.query(
            `INSERT INTO family_members (
              case_id, name, relation, age, sex, status, education, address, occupation, income
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              id, member.name, member.relation, member.age, member.sex,
              member.status, member.education, member.address, member.occupation, member.income
            ]
          );
        }
      }
    }
    
    // Update extended family if provided
    if (actualExtendedFamily && actualExtendedFamily.length > 0) {
      // Delete existing extended family for this case
      await db.query('DELETE FROM extended_family WHERE case_id = $1', [id]);
      
      // Insert new extended family members
      for (const member of actualExtendedFamily) {
        if (member.name && member.name.trim()) {
          await db.query(
            `INSERT INTO extended_family (
              case_id, name, relationship, age, sex, status, education, occupation, income
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              id, member.name, member.relationship, member.age, member.sex,
              member.status, member.education, member.occupation, member.income
            ]
          );
        }
      }
    }

    // Update educational attainment if provided
    const educationalAttainmentUpdate = req.body.educationalAttainment;
    if (educationalAttainmentUpdate && typeof educationalAttainmentUpdate === 'object') {
      await db.query('DELETE FROM educational_attainment WHERE case_id = $1', [id]);
      const levelLabels = {
        elementary: 'Elementary',
        highSchool: 'High School',
        seniorHighSchool: 'Senior High School',
        vocationalCourse: 'Vocational Course',
        college: 'College',
        others: 'Others'
      };
      for (const [key, data] of Object.entries(educationalAttainmentUpdate)) {
        const level = levelLabels[key] || key;
        const schoolName = data?.schoolName?.trim();
        const schoolAddress = data?.schoolAddress?.trim();
        const yearCompleted = data?.year?.trim();
        if (schoolName) {
          await db.query(
            `INSERT INTO educational_attainment (case_id, level, school_name, school_address, year_completed)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, level, schoolName, schoolAddress || null, yearCompleted || null]
          );
        }
      }
    }

    // Update sacramental records if provided
    const sacramentalRecordUpdate = req.body.sacramentalRecord;
    if (sacramentalRecordUpdate && typeof sacramentalRecordUpdate === 'object') {
      await db.query('DELETE FROM sacramental_records WHERE case_id = $1', [id]);
      const sacramentLabels = {
        baptism: 'Baptism',
        firstCommunion: 'First Communion',
        confirmation: 'Confirmation',
        others: 'Others'
      };
      for (const [key, data] of Object.entries(sacramentalRecordUpdate)) {
        const sacrament = sacramentLabels[key] || key;
        const dateReceived = data?.dateReceived || null;
        const placeParish = data?.placeParish?.trim() || null;
        if (dateReceived || placeParish) {
          await db.query(
            `INSERT INTO sacramental_records (case_id, sacrament, date_received, place_parish)
             VALUES ($1, $2, $3, $4)`,
            [id, sacrament, dateReceived || null, placeParish]
          );
        }
      }
    }

    // Update agencies/persons if provided
    const agenciesUpdate = Array.isArray(req.body.agencies) ? req.body.agencies : [];
    if (agenciesUpdate.length > 0) {
      await db.query('DELETE FROM agencies_persons WHERE case_id = $1', [id]);
      for (const agency of agenciesUpdate) {
        const name = agency?.name?.trim();
        const addressDateDuration = agency?.addressDateDuration?.trim() || null;
        const servicesReceived = agency?.servicesReceived?.trim() || null;
        if (name) {
          await db.query(
            `INSERT INTO agencies_persons (case_id, name, address_date_duration, services_received)
             VALUES ($1, $2, $3, $4)`,
            [id, name, addressDateDuration, servicesReceived]
          );
        }
      }
    }

    res.json(updatedCase);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Another case with this name and birthdate already exists.' });
    }
    res.status(500).send('Server error');
  }
});

// Helper functions
function calculateAge(birthdate) {
  if (!birthdate) return '';
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatDate(date) {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
}

// DELETE a case by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if case exists
    const caseExists = await db.query(
      'SELECT * FROM cases WHERE id = $1',
      [id]
    );
    
    if (caseExists.rows.length === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Delete the case
    await db.query(
      'DELETE FROM cases WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error('Error deleting case:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Life Skills Routes

// Get all life skills for a case
router.get('/:id/life-skills', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM life_skills WHERE case_id = $1 ORDER BY date_completed DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add a new life skill entry
router.post('/:id/life-skills', auth, async (req, res) => {
  try {
    const { activity, dateCompleted, performanceRating, notes } = req.body;
    const caseId = req.params.id;
    
    const result = await db.query(
      `INSERT INTO life_skills (case_id, activity, date_completed, performance_rating, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [caseId, activity, dateCompleted, performanceRating, notes || '']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a life skill entry
router.put('/:id/life-skills/:skillId', auth, async (req, res) => {
  try {
    const { activity, dateCompleted, performanceRating, notes } = req.body;
    const { id: caseId, skillId } = req.params;
    
    const result = await db.query(
      `UPDATE life_skills 
       SET activity = $1, date_completed = $2, performance_rating = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND case_id = $6 RETURNING *`,
      [activity, dateCompleted, performanceRating, notes || '', skillId, caseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Life skill entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a life skill entry
router.delete('/:id/life-skills/:skillId', auth, async (req, res) => {
  try {
    const { id: caseId, skillId } = req.params;
    
    const result = await db.query(
      'DELETE FROM life_skills WHERE id = $1 AND case_id = $2 RETURNING *',
      [skillId, caseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Life skill entry not found' });
    }
    
    res.json({ message: 'Life skill entry deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Vital Signs Routes

// Get all vital signs for a case
router.get('/:id/vital-signs', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM vital_signs WHERE case_id = $1 ORDER BY date_recorded DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add a new vital signs entry
router.post('/:id/vital-signs', auth, async (req, res) => {
  try {
    const { date, bloodPressure, heartRate, temperature, weight, height, notes } = req.body;
    const caseId = parseInt(req.params.id, 10);
    const bp = bloodPressure ? String(bloodPressure).slice(0, 20).trim() : null;
    const hr = heartRate !== undefined && heartRate !== null && `${heartRate}` !== '' ? parseInt(heartRate, 10) : null;
    const temp = temperature !== undefined && temperature !== null && `${temperature}` !== '' ? Number(parseFloat(temperature).toFixed(1)) : null;
    const wt = weight !== undefined && weight !== null && `${weight}` !== '' ? Number(parseFloat(weight).toFixed(1)) : null;
    const ht = height !== undefined && height !== null && `${height}` !== '' ? parseInt(height, 10) : null;
    const ns = notes || '';
    
    const result = await db.query(
      `INSERT INTO vital_signs (case_id, date_recorded, blood_pressure, heart_rate, temperature, weight, height, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [caseId, date, bp, hr, temp, wt, ht, ns]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a vital signs entry
router.put('/:id/vital-signs/:vitalId', auth, async (req, res) => {
  try {
    const { date, bloodPressure, heartRate, temperature, weight, height, notes } = req.body;
    const { id: caseId, vitalId } = req.params;
    const bp = bloodPressure ? String(bloodPressure).slice(0, 20).trim() : null;
    const hr = heartRate !== undefined && heartRate !== null && `${heartRate}` !== '' ? parseInt(heartRate, 10) : null;
    const temp = temperature !== undefined && temperature !== null && `${temperature}` !== '' ? Number(parseFloat(temperature).toFixed(1)) : null;
    const wt = weight !== undefined && weight !== null && `${weight}` !== '' ? Number(parseFloat(weight).toFixed(1)) : null;
    const ht = height !== undefined && height !== null && `${height}` !== '' ? parseInt(height, 10) : null;
    const ns = notes || '';
    
    const result = await db.query(
      `UPDATE vital_signs 
       SET date_recorded = $1, blood_pressure = $2, heart_rate = $3, temperature = $4, 
           weight = $5, height = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND case_id = $9 RETURNING *`,
      [date, bp, hr, temp, wt, ht, ns, vitalId, caseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vital signs entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a vital signs entry
router.delete('/:id/vital-signs/:vitalId', auth, async (req, res) => {
  try {
    const { id: caseId, vitalId } = req.params;
    
    const result = await db.query(
      'DELETE FROM vital_signs WHERE id = $1 AND case_id = $2 RETURNING *',
      [vitalId, caseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vital signs entry not found' });
    }
    
    res.json({ message: 'Vital signs entry deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;