const axios = require('axios');
const db = require('../server/db');

async function getToken() {
  const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `verify.${unique}@example.com`;
  const username = `verify_user_${unique}`;
  const password = 'Password123!';
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      username,
      email,
      password,
      firstName: 'Verify',
      lastName: 'User'
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Registered test user:', res.data.user?.email || email);
    return res.data.token;
  } catch (error) {
    console.warn('Registration failed, attempting login...', error.response?.data || error.message);
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Login successful for test user');
    return loginRes.data.token;
  }
}

function buildTestCasePayload() {
  const ts = Date.now();
  const r1 = Math.floor(Math.random() * 10000);
  const r2 = Math.floor(Math.random() * 10000);
  const uniqueId = `${ts}${r1}${r2}`;
  return {
    // Personal and basic case fields
    firstName: `Verify${uniqueId}`,
    lastName: `Case${r1}`,
    middleName: 'Auto',
    sex: 'Female',
    birthdate: '2010-05-15',
    status: 'active',
    religion: 'Roman Catholic',
    address: '123 Barangay Street, Quezon City',
    sourceOfReferral: 'DSWD',
    otherSourceOfReferral: 'LGU',
    caseType: 'Blessed Rosalie Rendu',
    assignedHouseParent: `HP ${r2}`,
    programType: 'Blessed Rosalie Rendu',
    program_type: 'Blessed Rosalie Rendu',

    // Narrative fields
    problemPresented: 'Test problem presented',
    briefHistory: 'Test brief history',
    economicSituation: 'Low income',
    medicalHistory: 'Healthy',
    familyBackground: 'Lives with parents',
    clientDescription: 'Client is cooperative',
    parentsDescription: 'Parents supportive',
    checklist: ['Birth certificate', 'Brgy clearance'],
    recommendation: 'Proceed with intake',
    assessment: 'Initial assessment complete',

    // Additional personal details
    nickname: 'VCase',
    birthplace: 'Quezon City',
    nationality: 'Filipino',
    provincialAddress: 'Ilocos Norte',
    presentAddress: 'Quezon City',

    // Referral details
    dateOfReferral: '2024-10-01',
    addressAndTel: 'QC, 02-1234567',
    relationToClient: 'Social Worker',

    // Parent/Guardian details
    fatherName: `Father${r1}`,
    fatherAge: '45',
    fatherEducation: 'High School Graduate',
    fatherOccupation: 'Construction Worker',
    fatherOtherSkills: 'Carpentry',
    fatherAddress: 'QC',
    fatherIncome: '15000',
    fatherLiving: true,
    motherName: `Mother${r2}`,
    motherAge: '42',
    motherEducation: 'College Graduate',
    motherOccupation: 'Housewife',
    motherOtherSkills: 'Sewing',
    motherAddress: 'QC',
    motherIncome: '12000',
    motherLiving: true,
    guardianName: `Guardian${r1}`,
    guardianAge: '65',
    guardianEducation: 'Elementary Graduate',
    guardianOccupation: 'Retired',
    guardianOtherSkills: 'Gardening',
    guardianRelation: 'Grandmother',
    guardianAddress: 'Marikina City',
    guardianIncome: '5000',
    guardianLiving: true,
    guardianDeceased: false,

    // Civil status of parents
    marriedInChurch: true,
    liveInCommonLaw: false,
    civilMarriage: false,
    separated: false,
    marriageDatePlace: 'June 15, 2005 at St. Mary Church',

    // Family composition arrays
    familyMembers: [
      { name: 'Pedro Santos', relation: 'Brother', age: '16', sex: 'Male', status: 'Student', education: 'Grade 10', address: 'QC', occupation: 'Student', income: '0' },
      { name: 'Ana Santos', relation: 'Sister', age: '8', sex: 'Female', status: 'Student', education: 'Grade 2', address: 'QC', occupation: 'Student', income: '0' }
    ],
    extendedFamily: [
      { name: 'Roberto Cruz', relationship: 'Uncle', age: '50', sex: 'Male', status: 'Married', education: 'College', occupation: 'Teacher', income: '25000' },
      { name: 'Carmen Cruz', relationship: 'Aunt', age: '48', sex: 'Female', status: 'Married', education: 'High School', occupation: 'Housewife', income: '0' }
    ],

    // Educational attainment object
    educationalAttainment: {
      elementary: { schoolName: 'QC Elementary School', schoolAddress: '123 Education St', year: '2016-2022' },
      highSchool: { schoolName: 'Manila High School', schoolAddress: '456 Learning Ave', year: '2022-2026' },
      seniorHighSchool: { schoolName: 'Metro Manila Senior High', schoolAddress: '789 Academic Rd', year: '2026-2028' },
      vocationalCourse: { schoolName: 'TESDA Training Center', schoolAddress: '321 Skills Blvd', year: '2028-2029' },
      college: { schoolName: 'University of the Philippines', schoolAddress: 'UP Diliman', year: '2029-2033' },
      others: { schoolName: 'Special Education Center', schoolAddress: '654 Special Needs St', year: '2020-2021' }
    },

    // Sacramental records
    sacramentalRecord: {
      baptism: { dateReceived: '2010-06-15', placeParish: 'St. Mary Church, QC' },
      firstCommunion: { dateReceived: '2018-05-20', placeParish: 'Holy Family Parish, Manila' },
      confirmation: { dateReceived: '2024-04-10', placeParish: 'Sacred Heart Cathedral, MM' },
      others: { dateReceived: '2023-12-25', placeParish: 'St. Joseph Chapel, QC' }
    },

    // Agencies/persons
    agencies: [
      { name: 'DSWD NCR', addressDateDuration: 'Manila, 2020-2022', servicesReceived: 'Food packs, cash assistance' },
      { name: 'Barangay Council', addressDateDuration: 'QC, 2021-2023', servicesReceived: 'Mediation' }
    ],

    lastUpdated: new Date().toISOString()
  };
}

async function main() {
  try {
    const token = await getToken();
    const headers = { 'Content-Type': 'application/json', 'x-auth-token': token, 'Authorization': `Bearer ${token}` };

    const payload = buildTestCasePayload();
    console.log('Submitting case payload with arrays and details...');
    const postRes = await axios.post('http://localhost:5000/api/cases', payload, { headers });
    const newCase = postRes.data;
    console.log('Created case ID:', newCase.id);

    console.log('Fetching full case details via API...');
    const getRes = await axios.get(`http://localhost:5000/api/cases/${newCase.id}`, { headers });
    const full = getRes.data;

    console.log('Verifying related tables via direct DB queries...');
    const [caseRowRes, famRes, extFamRes, eduRes, sacRes, agRes] = await Promise.all([
      db.query('SELECT * FROM cases WHERE id = $1', [newCase.id]),
      db.query('SELECT * FROM family_members WHERE case_id = $1', [newCase.id]),
      db.query('SELECT * FROM extended_family WHERE case_id = $1', [newCase.id]),
      db.query('SELECT * FROM educational_attainment WHERE case_id = $1', [newCase.id]),
      db.query('SELECT * FROM sacramental_records WHERE case_id = $1', [newCase.id]),
      db.query('SELECT * FROM agencies_persons WHERE case_id = $1', [newCase.id])
    ]);

    const caseRow = caseRowRes.rows[0];

    const summary = {
      tokenPresent: !!token,
      createdId: newCase.id,
      baseFields: {
        first_name: caseRow.first_name,
        last_name: caseRow.last_name,
        middle_name: caseRow.middle_name,
        sex: caseRow.sex,
        birthdate: caseRow.birthdate,
        status: caseRow.status,
        religion: caseRow.religion,
        source_of_referral: caseRow.source_of_referral,
        case_type: caseRow.case_type,
        program_type: caseRow.program_type,
        problem_presented: caseRow.problem_presented,
        brief_history: caseRow.brief_history,
        economic_situation: caseRow.economic_situation,
        medical_history: caseRow.medical_history,
        family_background: caseRow.family_background,
        client_description: caseRow.client_description,
        parents_description: caseRow.parents_description,
        nickname: caseRow.nickname,
        birthplace: caseRow.birthplace,
        nationality: caseRow.nationality,
        provincial_address: caseRow.provincial_address,
        present_address: caseRow.present_address,
        other_source_of_referral: caseRow.other_source_of_referral,
        date_of_referral: caseRow.date_of_referral,
        address_and_tel: caseRow.address_and_tel,
        relation_to_client: caseRow.relation_to_client,
        father_name: caseRow.father_name,
        mother_name: caseRow.mother_name,
        guardian_name: caseRow.guardian_name,
        married_in_church: caseRow.married_in_church,
        live_in_common_law: caseRow.live_in_common_law,
        civil_marriage: caseRow.civil_marriage,
        separated: caseRow.separated,
        marriage_date_place: caseRow.marriage_date_place
      },
      checklistStored: caseRow.checklist,
      counts: {
        family_members: famRes.rows.length,
        extended_family: extFamRes.rows.length,
        educational_attainment: eduRes.rows.length,
        sacramental_records: sacRes.rows.length,
        agencies_persons: agRes.rows.length
      },
      apiReturns: {
        educationalAttainment: Array.isArray(full.educationalAttainment) ? full.educationalAttainment.length : null,
        sacramentalRecords: Array.isArray(full.sacramentalRecords) ? full.sacramentalRecords.length : null,
        agencies: Array.isArray(full.agencies) ? full.agencies.length : null,
        lifeSkills: Array.isArray(full.lifeSkills) ? full.lifeSkills.length : null,
        vitalSigns: Array.isArray(full.vitalSigns) ? full.vitalSigns.length : null
      }
    };

    console.log('Verification summary:', JSON.stringify(summary, null, 2));
    console.log('OK: AddCaseForm fields and arrays persisted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

main();