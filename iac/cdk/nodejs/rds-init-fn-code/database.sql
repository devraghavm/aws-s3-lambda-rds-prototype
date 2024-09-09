-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT *
FROM sys.databases
WHERE name = 'fti940db')
BEGIN
  CREATE DATABASE fti940db;
END;