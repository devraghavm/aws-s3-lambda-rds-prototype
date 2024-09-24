export interface IrsEmployerCompareData {
  fein: number;
  employer_name: string;
  employer_address: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  employer_phone: string;
  employer_email: string;
  total_paid_wages: number;
  compare_result: string;
  run_id?: number;
}
