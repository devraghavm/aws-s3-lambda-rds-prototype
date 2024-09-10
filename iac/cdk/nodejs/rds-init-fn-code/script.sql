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

-- Check if the tables were created and do a truncate
IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'IrsEmployerData')
BEGIN
  -- Print an error message
  TRUNCATE TABLE IrsEmployerData;
END;

-- Check if the tables were created and do a truncate
IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'MyuiEmployerData')
BEGIN
  -- Print an error message
  TRUNCATE TABLE MyuiEmployerData;
END;
-- End of script