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

-- create a trigger to insert audit record into ReportRunAudit table
IF EXISTS (SELECT *
FROM sys.triggers
WHERE name = 'ReportRunAuditTrigger')
BEGIN
  -- Drop the trigger
  DROP TRIGGER ReportRunAuditTrigger;
END;

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
    run_id INT NOT NULL,
    PRIMARY KEY(fein, run_id),
    FOREIGN KEY(run_id) REFERENCES ReportJobRun(run_id)
  );
END;

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'IrsEmployerData')
BEGIN
  SELECT *
  from IrsEmployerData;
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
    run_id INT NOT NULL,
    PRIMARY KEY (fein, run_id),
    FOREIGN KEY (run_id) REFERENCES ReportJobRun(run_id)
  );
END;
-- End of script