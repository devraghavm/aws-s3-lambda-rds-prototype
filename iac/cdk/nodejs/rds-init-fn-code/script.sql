-- Use the database
USE fti940db;

-- create a sequence for the primary key
IF NOT EXISTS (SELECT *
FROM sys.sequences
WHERE name = 'ReportJobSeq')
BEGIN
  -- Create the sequence
  CREATE SEQUENCE ReportJobSeq
  AS INT
  START WITH 1
  INCREMENT BY 1;
END;

-- create a ReportJob table containing job_id, job_name, job_description, job_timestamp
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'ReportJob')
BEGIN
  -- Create the table
  CREATE TABLE ReportJob
  (
    job_id INT NOT NULL DEFAULT NEXT VALUE FOR ReportJobSeq,
    job_name VARCHAR(255) NOT NULL,
    job_description VARCHAR(255) NOT NULL,
    job_timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (job_id)
  );

  -- Insert job record into the table
  INSERT INTO ReportJob
    (job_name, job_description)
  VALUES
    ('IRS_940_JOB', 'IRS 940 Job to process employer data');
END;

-- create a sequence for the primary key
IF NOT EXISTS (SELECT *
FROM sys.sequences
WHERE name = 'ReportJobRunSeq')
BEGIN
  -- Create the sequence
  CREATE SEQUENCE ReportJobRunSeq
  AS INT
  START WITH 1
  INCREMENT BY 1;
END;

-- create a ReportJobRun table containing run_id, run_name, run_description, run_timestamp, job_id (foreign key)
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'ReportJobRun')
BEGIN
  -- Create the table
  CREATE TABLE ReportJobRun
  (
    run_id INT NOT NULL DEFAULT NEXT VALUE FOR ReportJobRunSeq,
    run_name VARCHAR(255) NOT NULL,
    run_description VARCHAR(255) NOT NULL,
    run_timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    job_id INT NOT NULL,
    PRIMARY KEY (run_id),
    FOREIGN KEY (job_id) REFERENCES ReportJob(job_id)
  );
END;

-- create a ReportRunStatus table containing run_id (foreign key), run_status, run_message
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'ReportRunStatus')
BEGIN
  -- Create the table
  CREATE TABLE ReportRunStatus
  (
    run_id INT NOT NULL,
    run_status VARCHAR(255) NOT NULL,
    run_message VARCHAR(255) NOT NULL,
    PRIMARY KEY (run_id, run_status),
    FOREIGN KEY (run_id) REFERENCES ReportJobRun(run_id)
  );
END;

-- create a ReportRunAudit table containing run_id (foreign key), audit_timestamp, audit_message
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'ReportRunAudit')
BEGIN
  -- Create the table
  CREATE TABLE ReportRunAudit
  (
    run_id INT NOT NULL,
    audit_timestamp DATETIME NOT NULL,
    audit_message VARCHAR(MAX) NOT NULL,
    PRIMARY KEY (run_id, audit_timestamp),
    FOREIGN KEY (run_id) REFERENCES ReportJobRun(run_id)
  );
END;

-- Create the IrsEmployerData table
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'IrsEmployerData')
BEGIN
  -- Create the table
  CREATE TABLE IrsEmployerData
  (
    byte_count VARCHAR(4),
    tc150_state_code VARCHAR(2) NOT NULL,
    ein VARCHAR(9) NOT NULL,
    dln VARCHAR(14) NOT NULL,
    tax_period VARCHAR(6) NOT NULL,
    check_digit VARCHAR(2) NOT NULL,
    total_federal_taxable_wages VARCHAR(15) NOT NULL,
    zip_code VARCHAR(12) NOT NULL,
    address_state_code VARCHAR(2) NOT NULL,
    city VARCHAR(25) NOT NULL,
    address VARCHAR(35) NOT NULL,
    first_name_line VARCHAR(35) NOT NULL,
    second_name_line VARCHAR(35) NOT NULL,
    third_name_line VARCHAR(35) NOT NULL,
    fourth_name_line VARCHAR(35) NOT NULL,
    name_control VARCHAR(4) NOT NULL,
    cross_reference_ein VARCHAR(9) NOT NULL,
    state_reporting_number VARCHAR(15) NOT NULL,
    form_indicator VARCHAR(1) NOT NULL,
    run_id INT NOT NULL,
    PRIMARY KEY(fein, run_id),
    FOREIGN KEY(run_id) REFERENCES ReportJobRun(run_id)
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
    byte_count VARCHAR(4),
    tc150_state_code VARCHAR(2) NOT NULL,
    ein VARCHAR(9) NOT NULL,
    dln VARCHAR(14) NOT NULL,
    tax_period VARCHAR(6) NOT NULL,
    check_digit VARCHAR(2) NOT NULL,
    total_federal_taxable_wages VARCHAR(15) NOT NULL,
    zip_code VARCHAR(12) NOT NULL,
    address_state_code VARCHAR(2) NOT NULL,
    city VARCHAR(25) NOT NULL,
    address VARCHAR(35) NOT NULL,
    first_name_line VARCHAR(35) NOT NULL,
    second_name_line VARCHAR(35) NOT NULL,
    third_name_line VARCHAR(35) NOT NULL,
    fourth_name_line VARCHAR(35) NOT NULL,
    name_control VARCHAR(4) NOT NULL,
    cross_reference_ein VARCHAR(9) NOT NULL,
    state_reporting_number VARCHAR(15) NOT NULL,
    form_indicator VARCHAR(1) NOT NULL,
    run_id INT NOT NULL,
    PRIMARY KEY (fein, run_id),
    FOREIGN KEY (run_id) REFERENCES ReportJobRun(run_id)
  );
END;

-- Create the IrsEmployerCompareData table
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'IrsEmployerCompareData')
BEGIN
  -- Create the table
  CREATE TABLE IrsEmployerCompareData
  (
    byte_count VARCHAR(4),
    tc150_state_code VARCHAR(2) NOT NULL,
    ein VARCHAR(9) NOT NULL,
    dln VARCHAR(14) NOT NULL,
    tax_period VARCHAR(6) NOT NULL,
    check_digit VARCHAR(2) NOT NULL,
    total_federal_taxable_wages VARCHAR(15) NOT NULL,
    zip_code VARCHAR(12) NOT NULL,
    address_state_code VARCHAR(2) NOT NULL,
    city VARCHAR(25) NOT NULL,
    address VARCHAR(35) NOT NULL,
    first_name_line VARCHAR(35) NOT NULL,
    second_name_line VARCHAR(35) NOT NULL,
    third_name_line VARCHAR(35) NOT NULL,
    fourth_name_line VARCHAR(35) NOT NULL,
    name_control VARCHAR(4) NOT NULL,
    cross_reference_ein VARCHAR(9) NOT NULL,
    state_reporting_number VARCHAR(15) NOT NULL,
    form_indicator VARCHAR(1) NOT NULL,
    run_id INT NOT NULL,
    PRIMARY KEY(fein, run_id),
    FOREIGN KEY(run_id) REFERENCES ReportJobRun(run_id)
  );
END;
-- End of script