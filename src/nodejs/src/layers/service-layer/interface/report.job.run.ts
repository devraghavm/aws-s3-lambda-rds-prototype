export interface ReportJobRun {
  run_id?: number;
  run_name: string;
  run_description: string;
  run_timestamp?: Date;
  job_id: number | undefined;
}
