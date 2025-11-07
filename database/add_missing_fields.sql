-- Migration script to add missing fields from AddCaseForm to the database
-- This script adds all the missing columns and creates new tables for family data

-- ============================================================================
-- ADD MISSING COLUMNS TO CASES TABLE
-- ============================================================================

-- Personal Details
ALTER TABLE cases ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS birthplace VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS provincial_address TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS present_address TEXT;

-- Referral Information
ALTER TABLE cases ADD COLUMN IF NOT EXISTS other_source_of_referral VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS date_of_referral DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS address_and_tel TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS relation_to_client VARCHAR(100);

-- Parent/Guardian Information
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_age INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_education VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_other_skills TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_address TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_income VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS father_living BOOLEAN DEFAULT true;

ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_age INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_education VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_other_skills TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_address TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_income VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mother_living BOOLEAN DEFAULT true;

ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_age INTEGER;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_education VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_occupation VARCHAR(255);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_other_skills TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_relation VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_address TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_income VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_living BOOLEAN DEFAULT true;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS guardian_deceased BOOLEAN DEFAULT false;

-- Civil Status of Parents
ALTER TABLE cases ADD COLUMN IF NOT EXISTS married_in_church BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS live_in_common_law BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS civil_marriage BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS separated BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS marriage_date_place VARCHAR(255);

-- Brief Description Fields (Client upon intake and Parents/Relatives/Guardian)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_description TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS parents_description TEXT;

-- ============================================================================
-- CREATE FAMILY MEMBERS TABLE
-- ============================================================================

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

-- ============================================================================
-- CREATE EXTENDED FAMILY TABLE
-- ============================================================================

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
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Family Members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_case_id ON family_members(case_id);
CREATE INDEX IF NOT EXISTS idx_family_members_relation ON family_members(relation);

-- Extended Family indexes
CREATE INDEX IF NOT EXISTS idx_extended_family_case_id ON extended_family(case_id);
CREATE INDEX IF NOT EXISTS idx_extended_family_relationship ON extended_family(relationship);

-- ============================================================================
-- ADD TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Family Members trigger
CREATE TRIGGER update_family_members_updated_at 
    BEFORE UPDATE ON family_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Extended Family trigger
CREATE TRIGGER update_extended_family_updated_at 
    BEFORE UPDATE ON extended_family 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE family_members IS 'Family members and siblings information for cases';
COMMENT ON TABLE extended_family IS 'Extended family members information for cases';

-- Column comments for new cases table columns
COMMENT ON COLUMN cases.nickname IS 'Nickname or preferred name of the case';
COMMENT ON COLUMN cases.birthplace IS 'Place of birth';
COMMENT ON COLUMN cases.nationality IS 'Nationality of the case';
COMMENT ON COLUMN cases.provincial_address IS 'Provincial address';
COMMENT ON COLUMN cases.present_address IS 'Current/present address';
COMMENT ON COLUMN cases.other_source_of_referral IS 'Other source of referral if not in predefined list';
COMMENT ON COLUMN cases.date_of_referral IS 'Date when the case was referred';
COMMENT ON COLUMN cases.address_and_tel IS 'Address and telephone number of referrer';
COMMENT ON COLUMN cases.relation_to_client IS 'Relationship of referrer to client';

-- Parent/Guardian column comments
COMMENT ON COLUMN cases.father_name IS 'Father full name';
COMMENT ON COLUMN cases.father_living IS 'Whether father is still living';
COMMENT ON COLUMN cases.mother_name IS 'Mother full name';
COMMENT ON COLUMN cases.mother_living IS 'Whether mother is still living';
COMMENT ON COLUMN cases.guardian_name IS 'Guardian full name';
COMMENT ON COLUMN cases.guardian_relation IS 'Guardian relationship to case';
COMMENT ON COLUMN cases.guardian_living IS 'Whether guardian is still living';
COMMENT ON COLUMN cases.guardian_deceased IS 'Whether guardian is deceased';

-- Civil status column comments
COMMENT ON COLUMN cases.married_in_church IS 'Parents married in church';
COMMENT ON COLUMN cases.live_in_common_law IS 'Parents live in common law';
COMMENT ON COLUMN cases.civil_marriage IS 'Parents have civil marriage';
COMMENT ON COLUMN cases.separated IS 'Parents are separated';
COMMENT ON COLUMN cases.marriage_date_place IS 'Date and place of marriage';

-- Brief description column comments
COMMENT ON COLUMN cases.client_description IS 'Brief description of the client upon intake';
COMMENT ON COLUMN cases.parents_description IS 'Brief description of the parents/relatives/guardian upon intake';

-- Family table column comments
COMMENT ON COLUMN family_members.relation IS 'Relationship to the case (sibling, child, etc.)';
COMMENT ON COLUMN extended_family.relationship IS 'Relationship to the case (aunt, uncle, cousin, etc.)';

COMMIT;