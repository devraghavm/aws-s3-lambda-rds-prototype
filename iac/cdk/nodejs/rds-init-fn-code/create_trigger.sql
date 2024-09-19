-- Create the trigger
CREATE TRIGGER ReportRunAuditTrigger
  ON ReportRunStatus
  AFTER INSERT, UPDATE
  AS
  BEGIN
  DECLARE @run_id INT;
  DECLARE @run_status VARCHAR(255);
  DECLARE @run_message VARCHAR(255);
  DECLARE @audit_timestamp DATETIME;

  SELECT @run_id = run_id, @run_status = run_status, @run_message = run_message
  FROM inserted;

  SET @audit_timestamp = GETDATE();

  INSERT INTO ReportRunAudit
    (run_id, audit_timestamp, audit_message)
  VALUES
    (@run_id, @audit_timestamp, 'Run status: ' + @run_status + ', Run message: ' + @run_message);
END;