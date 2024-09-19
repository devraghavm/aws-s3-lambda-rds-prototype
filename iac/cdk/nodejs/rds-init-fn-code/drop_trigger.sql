-- drop a trigger on ReportRunAudit table
IF EXISTS (SELECT *
FROM sys.triggers
WHERE name = 'ReportRunAuditTrigger')
BEGIN
  -- Drop the trigger
  DROP TRIGGER ReportRunAuditTrigger;
END;