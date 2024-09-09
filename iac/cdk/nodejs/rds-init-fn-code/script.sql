-- Use the database
USE fti940db;

-- Create the table
IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'EmployerData')
BEGIN
  -- Create the table
  CREATE TABLE EmployerData
  (
    fein VARCHAR(50) NOT NULL,
    employer_name VARCHAR(255) NOT NULL,
    employer_address VARCHAR(255) NOT NULL,
    employer_city VARCHAR(100) NOT NULL,
    employer_state VARCHAR(50) NOT NULL,
    employer_zip VARCHAR(20) NOT NULL,
    employer_phone VARCHAR(20) NOT NULL,
    employer_email VARCHAR(100) NOT NULL,
    total_paid_wages DECIMAL(18, 2) NOT NULL,
    PRIMARY KEY (fein)
  );
END;

IF EXISTS (SELECT *
FROM sys.tables
WHERE name = 'EmployerData')
BEGIN
  -- Truncate the table
  TRUNCATE TABLE EmployerData;

-- Insert dummy records
-- INSERT INTO EmployerData
--   (fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages)
-- VALUES
--   ('FEIN1', 'Employer 1', 'Address 1', 'City 1', 'State 1', 'Zip 1', 'Phone 1', 'Email 1', 1000.00),
--   ('FEIN2', 'Employer 2', 'Address 2', 'City 2', 'State 2', 'Zip 2', 'Phone 2', 'Email 2', 2000.00),
--   ('FEIN3', 'Employer 3', 'Address 3', 'City 3', 'State 3', 'Zip 3', 'Phone 3', 'Email 3', 3000.00);
END;
-- End of script