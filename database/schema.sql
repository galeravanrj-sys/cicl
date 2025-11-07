-- Consolidated Database Schema for CICL Case Management System
-- This schema includes all tables, indexes, constraints, and triggers

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  profile_picture TEXT, -- URL or base64 encoded profile picture from OAuth providers
  role VARCHAR(50) DEFAULT 'user',
  phone_number VARCHAR(20),
  address TEXT,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Cases table for case management with all features
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  nickname VARCHAR(100),
  sex VARCHAR(10),
  birthplace VARCHAR(255),
  nationality VARCHAR(100),
  birthdate DATE,
  status VARCHAR(50),
  religion VARCHAR(100),
  address TEXT,
  provincial_address TEXT,
  present_address TEXT,
  source_of_referral VARCHAR(100),
  other_source_of_referral VARCHAR(255),
  date_of_referral DATE,
  address_and_tel TEXT,
  relation_to_client VARCHAR(100),
  case_type VARCHAR(100),
  assigned_house_parent VARCHAR(100),
  program_type VARCHAR(100),
  problem_presented TEXT,
  brief_history TEXT,
  economic_situation TEXT,
  medical_history TEXT,
  family_background TEXT,
  recommendation TEXT,
  assessment TEXT,
  client_description TEXT,
  parents_description TEXT,
  father_name VARCHAR(255),
  father_age INTEGER,
  father_education VARCHAR(255),
  father_occupation VARCHAR(255),
  father_other_skills TEXT,
  father_address TEXT,
  father_income VARCHAR(100),
  father_living BOOLEAN DEFAULT true,
  mother_name VARCHAR(255),
  mother_age INTEGER,
  mother_education VARCHAR(255),
  mother_occupation VARCHAR(255),
  mother_other_skills TEXT,
  mother_address TEXT,
  mother_income VARCHAR(100),
  mother_living BOOLEAN DEFAULT true,
  guardian_name VARCHAR(255),
  guardian_age INTEGER,
  guardian_education VARCHAR(255),
  guardian_occupation VARCHAR(255),
  guardian_other_skills TEXT,
  guardian_relation VARCHAR(100),
  guardian_address TEXT,
  guardian_income VARCHAR(100),
  guardian_living BOOLEAN DEFAULT true,
  guardian_deceased BOOLEAN DEFAULT false,
  married_in_church BOOLEAN DEFAULT false,
  live_in_common_law BOOLEAN DEFAULT false,
  civil_marriage BOOLEAN DEFAULT false,
  separated BOOLEAN DEFAULT false,
  marriage_date_place VARCHAR(255),
  checklist JSONB,
  profile_picture TEXT, -- Base64 encoded profile picture data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  last_updated DATE
  -- Note: Name uniqueness is enforced by the case-insensitive index below
);

-- Life Skills table to track activities and performance
CREATE TABLE IF NOT EXISTS life_skills (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  activity VARCHAR(255) NOT NULL,
  date_completed DATE NOT NULL,
  performance_rating VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vital Signs table to track health metrics
CREATE TABLE IF NOT EXISTS vital_signs (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date_recorded DATE NOT NULL,
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,1),
  height INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educational Attainment table to track school records
CREATE TABLE IF NOT EXISTS educational_attainment (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  level VARCHAR(50) NOT NULL, -- Elementary, High School, Senior High School, Vocational Course, College, Others
  school_name VARCHAR(255) NOT NULL,
  school_address TEXT,
  year_completed VARCHAR(10), -- Year or year range (e.g., "2020" or "2018-2020")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sacramental Records table to track religious sacraments
CREATE TABLE IF NOT EXISTS sacramental_records (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sacrament VARCHAR(50) NOT NULL, -- Baptism, First Communion, Confirmation, Others
  date_received DATE,
  place_parish VARCHAR(255), -- Place/Parish where sacrament was received
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agencies/Persons table to track involved agencies and persons
CREATE TABLE IF NOT EXISTS agencies_persons (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Name of agency or person
  address_date_duration TEXT, -- Address/Date/Duration information
  services_received TEXT, -- Services received from this agency/person
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family Members table
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(100),
  age INTEGER,
  sex VARCHAR(10),
  status VARCHAR(100),
  education VARCHAR(255),
  address TEXT,
  occupation VARCHAR(255),
  income VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extended Family table
CREATE TABLE IF NOT EXISTS extended_family (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  age INTEGER,
  sex VARCHAR(10),
  status VARCHAR(100),
  education VARCHAR(255),
  occupation VARCHAR(255),
  income VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Unique index on case-insensitive first+last name combined with birthdate
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_name_birthdate_unique ON cases (LOWER(first_name), LOWER(last_name), birthdate);

-- Life Skills indexes for better performance
CREATE INDEX IF NOT EXISTS idx_life_skills_case_id ON life_skills(case_id);
CREATE INDEX IF NOT EXISTS idx_life_skills_date ON life_skills(date_completed);

-- Vital Signs indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vital_signs_case_id ON vital_signs(case_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_date ON vital_signs(date_recorded);

-- Educational Attainment indexes for better performance
CREATE INDEX IF NOT EXISTS idx_educational_attainment_case_id ON educational_attainment(case_id);
CREATE INDEX IF NOT EXISTS idx_educational_attainment_level ON educational_attainment(level);

-- Sacramental Records indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sacramental_records_case_id ON sacramental_records(case_id);
CREATE INDEX IF NOT EXISTS idx_sacramental_records_sacrament ON sacramental_records(sacrament);

-- Agencies/Persons indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agencies_persons_case_id ON agencies_persons(case_id);
CREATE INDEX IF NOT EXISTS idx_agencies_persons_name ON agencies_persons(name);

-- Family Members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_case_id ON family_members(case_id);
CREATE INDEX IF NOT EXISTS idx_family_members_relation ON family_members(relation);

-- Extended Family indexes
CREATE INDEX IF NOT EXISTS idx_extended_family_case_id ON extended_family(case_id);
CREATE INDEX IF NOT EXISTS idx_extended_family_relationship ON extended_family(relationship);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_life_skills_updated_at ON life_skills;
CREATE TRIGGER update_life_skills_updated_at 
    BEFORE UPDATE ON life_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vital_signs_updated_at ON vital_signs;
CREATE TRIGGER update_vital_signs_updated_at 
    BEFORE UPDATE ON vital_signs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_educational_attainment_updated_at ON educational_attainment;
CREATE TRIGGER update_educational_attainment_updated_at 
    BEFORE UPDATE ON educational_attainment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sacramental_records_updated_at ON sacramental_records;
CREATE TRIGGER update_sacramental_records_updated_at 
    BEFORE UPDATE ON sacramental_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agencies_persons_updated_at ON agencies_persons;
CREATE TRIGGER update_agencies_persons_updated_at 
    BEFORE UPDATE ON agencies_persons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Family Members trigger
DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at 
    BEFORE UPDATE ON family_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Extended Family trigger
DROP TRIGGER IF EXISTS update_extended_family_updated_at ON extended_family;
CREATE TRIGGER update_extended_family_updated_at 
    BEFORE UPDATE ON extended_family 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE users IS 'User authentication and profile information';
COMMENT ON TABLE cases IS 'Case management records with comprehensive client information';
COMMENT ON TABLE life_skills IS 'Life skills activities and performance tracking for cases';
COMMENT ON TABLE vital_signs IS 'Health metrics and vital signs tracking for cases';
COMMENT ON TABLE educational_attainment IS 'Educational background and school records for cases';
COMMENT ON TABLE sacramental_records IS 'Religious sacramental records for cases';
COMMENT ON TABLE agencies_persons IS 'Agencies and persons involved in case management and service provision';
COMMENT ON TABLE family_members IS 'Family members and siblings information for cases';
COMMENT ON TABLE extended_family IS 'Extended family members information for cases';

-- Column comments
COMMENT ON COLUMN cases.profile_picture IS 'Base64 encoded profile picture data for the case';
COMMENT ON COLUMN cases.checklist IS 'JSON data for case-specific checklists and assessments';
COMMENT ON COLUMN cases.last_updated IS 'Date field for tracking case updates (used for reporting)';
COMMENT ON COLUMN cases.client_description IS 'Brief description of the client upon intake';
COMMENT ON COLUMN cases.parents_description IS 'Brief description of the parents/relatives/guardian upon intake';
COMMENT ON COLUMN cases.nickname IS 'Nickname or preferred name of the case';
COMMENT ON COLUMN cases.birthplace IS 'Place of birth';
COMMENT ON COLUMN cases.nationality IS 'Nationality of the case';
COMMENT ON COLUMN cases.provincial_address IS 'Provincial address';
COMMENT ON COLUMN cases.present_address IS 'Current/present address';
COMMENT ON COLUMN cases.other_source_of_referral IS 'Other source of referral if not in predefined list';
COMMENT ON COLUMN cases.date_of_referral IS 'Date when the case was referred';
COMMENT ON COLUMN cases.address_and_tel IS 'Address and telephone number of referrer';
COMMENT ON COLUMN cases.relation_to_client IS 'Relationship of referrer to client';
COMMENT ON COLUMN cases.father_name IS 'Father full name';
COMMENT ON COLUMN cases.father_living IS 'Whether father is still living';
COMMENT ON COLUMN cases.mother_name IS 'Mother full name';
COMMENT ON COLUMN cases.mother_living IS 'Whether mother is still living';
COMMENT ON COLUMN cases.guardian_name IS 'Guardian full name';
COMMENT ON COLUMN cases.guardian_relation IS 'Guardian relationship to case';
COMMENT ON COLUMN cases.guardian_living IS 'Whether guardian is still living';
COMMENT ON COLUMN cases.guardian_deceased IS 'Whether guardian is deceased';
COMMENT ON COLUMN cases.married_in_church IS 'Parents married in church';
COMMENT ON COLUMN cases.live_in_common_law IS 'Parents live in common law';
COMMENT ON COLUMN cases.civil_marriage IS 'Parents have civil marriage';
COMMENT ON COLUMN cases.separated IS 'Parents are separated';
COMMENT ON COLUMN cases.marriage_date_place IS 'Date and place of marriage';
COMMENT ON COLUMN educational_attainment.level IS 'Educational level: Elementary, High School, Senior High School, Vocational Course, College, Others';
COMMENT ON COLUMN educational_attainment.year_completed IS 'Year or year range when education was completed';
COMMENT ON COLUMN sacramental_records.sacrament IS 'Type of sacrament: Baptism, First Communion, Confirmation, Others';
COMMENT ON COLUMN sacramental_records.place_parish IS 'Church or parish where the sacrament was received';
COMMENT ON COLUMN agencies_persons.name IS 'Name of the agency, organization, or person involved';
COMMENT ON COLUMN agencies_persons.address_date_duration IS 'Address, date, or duration information related to the involvement';
COMMENT ON COLUMN agencies_persons.services_received IS 'Description of services received from this agency or person';

-- Users column comments
COMMENT ON COLUMN users.profile_picture IS 'URL or base64 encoded profile picture from OAuth providers like Google';

-- Index comments
COMMENT ON INDEX idx_cases_name_birthdate_unique IS 'Unique index enforcing case-insensitive first+last name combined with birthdate; NULL birthdate values do not conflict';