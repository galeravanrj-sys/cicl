# CICL Database Schema

## Overview
This directory contains the consolidated database schema for the CICL Case Management System. All previous migrations have been consolidated into a single `schema.sql` file for easier deployment and maintenance.

## Schema Structure

### Core Tables
- **users**: User authentication and profile information
- **cases**: Case management records with comprehensive client information
- **life_skills**: Life skills activities and performance tracking for cases
- **vital_signs**: Health metrics and vital signs tracking for cases

### Extended Tables
- **educational_attainment**: Educational background and school records for cases
- **sacramental_records**: Religious sacramental records for cases
- **agencies_persons**: Agencies and persons involved in case management and service provision
- **family_members**: Immediate family members and siblings linked to cases
- **extended_family**: Extended family members linked to cases

### Key Features
- **Unique Case Identifier**: Case-insensitive unique index on `first_name` + `last_name` + `birthdate` (NULL `birthdate` values do not conflict)
- **Profile Pictures**: Support for Base64/URL profile pictures (cases and users)
- **Life Skills Tracking**: Comprehensive activity and performance monitoring
- **Vital Signs Monitoring**: Health metrics tracking with timestamps
- **Educational Records**: Track educational progression from elementary to college level
- **Sacramental Records**: Track religious sacraments (Baptism, First Communion, Confirmation, etc.)
- **Agency Tracking**: Monitor involved agencies and service providers
- **Automatic Timestamps**: Triggers for automatic updated_at field updates

## Files

### Core Files
- **`schema.sql`**: Complete consolidated database schema
- **`test_data.sql`**: Comprehensive test data for all tables

### Documentation
- **`README.md`**: This file - complete database documentation

## Migration History (Consolidated)

The following migrations have been consolidated into `schema.sql`:

1. **Life Skills & Vital Signs**: Added life skills and vital signs tables with indexes and triggers
2. **Unique Case Identifier**: Added unique case-insensitive index for `first_name` + `last_name` + `birthdate` (replaces legacy non-unique name-only index)
3. **Profile Pictures**: Added profile picture support to cases and users tables
4. **Educational & Sacramental**: Added educational attainment, sacramental records, and agencies/persons tables
5. **Cases Missing Fields**: Added comprehensive personal, referral, parent/guardian, and civil status fields to cases
6. **Family Tables**: Added family_members and extended_family tables with indexes and triggers

## Usage

### New Database Setup
To set up a new database, simply run:

```sql
psql -U postgres -d auth_system -f schema.sql
```

Or using the Node runner:

```
node d:\cicl\database\run_migration.js
```

### Load Test Data (Optional)
To populate with test data for development:

```sql
psql -U postgres -d auth_system -f test_data.sql
```

### Query Examples

```sql
-- Get all educational records for a case
SELECT * FROM educational_attainment WHERE case_id = 1;

-- Get all sacramental records for a case
SELECT * FROM sacramental_records WHERE case_id = 1;

-- Get cases with college education
SELECT DISTINCT c.* FROM cases c 
JOIN educational_attainment ea ON c.id = ea.case_id 
WHERE ea.level = 'College';

-- Get cases who have received Confirmation
SELECT DISTINCT c.* FROM cases c 
JOIN sacramental_records sr ON c.id = sr.case_id 
WHERE sr.sacrament = 'Confirmation';

-- Get all agencies involved with a case
SELECT * FROM agencies_persons WHERE case_id = 1;

-- Get immediate family members for a case
SELECT * FROM family_members WHERE case_id = 1;

-- Get extended family members for a case
SELECT * FROM extended_family WHERE case_id = 1;
```

## Technical Notes

- The schema uses PostgreSQL-specific features (SERIAL, JSONB, etc.)
- All tables include proper foreign key constraints and cascading deletes
- Indexes are optimized for common query patterns
- The schema is designed to be idempotent (can be run multiple times safely)
- Case uniqueness is enforced by a unique index on case-insensitive `first_name` + `last_name` + `birthdate`; rows with NULL `birthdate` are allowed and do not violate the unique index
- All tables with timestamps have automatic update triggers

## Data Structure Details

### Educational Levels
- Elementary, High School, Senior High School, Vocational Course, College, Others

### Sacrament Types
- Baptism, First Communion, Confirmation, Others

### Case Management Features
- Comprehensive client information storage
- Life skills activity tracking with performance ratings
- Health metrics monitoring (blood pressure, heart rate, temperature, weight, height)
- Educational progression tracking
- Religious sacramental record keeping
- Agency and service provider involvement tracking