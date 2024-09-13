-- Use the database
USE fti940db;

-- Create the IrsEmployerData table
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'IrsEmployerData')
BEGIN
  -- Create the table
  CREATE TABLE IrsEmployerData
  (
    fein INT NOT NULL,
    employer_name VARCHAR(255) NOT NULL,
    employer_address VARCHAR(255) NOT NULL,
    employer_city VARCHAR(100) NOT NULL,
    employer_state VARCHAR(50) NOT NULL,
    employer_zip VARCHAR(20) NOT NULL,
    employer_phone VARCHAR(20) NOT NULL,
    employer_email VARCHAR(100) NOT NULL,
    total_paid_wages DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (fein)
  );
END;

-- Create the MyuiEmployerData table
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'MyuiEmployerData')
BEGIN
  -- Create the table
  CREATE TABLE MyuiEmployerData
  (
    fein INT NOT NULL,
    employer_name VARCHAR(255) NOT NULL,
    employer_address VARCHAR(255) NOT NULL,
    employer_city VARCHAR(100) NOT NULL,
    employer_state VARCHAR(50) NOT NULL,
    employer_zip VARCHAR(20) NOT NULL,
    employer_phone VARCHAR(20) NOT NULL,
    employer_email VARCHAR(100) NOT NULL,
    total_paid_wages DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (fein)
  );
END;

-- create a sequence for the primary key
IF NOT EXISTS (SELECT *
FROM sys.sequences
WHERE name = 'Irs940JobSeq')
BEGIN
  -- Create the sequence
  CREATE SEQUENCE Irs940JobSeq
  AS INT
  START WITH 1
  INCREMENT BY 1;
END;

-- create a Irs940Job table containing job_id, job_start_time, job_end_time, job_status, job_message, and job_type
-- End of script