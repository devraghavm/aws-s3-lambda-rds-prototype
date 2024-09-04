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