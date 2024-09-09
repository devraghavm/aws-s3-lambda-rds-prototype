import { ConnectionPool, IResult } from "mssql";
import { createConnectionPool } from "./config/db.config";
import { CsvRow } from "./interfaces/csv.row";

export class Service {
  private connection: ConnectionPool = null!;

  constructor() {
    createConnectionPool().then((pool) => {
      this.connection = pool;
    });
  }

  // Create operation
  async create(row: CsvRow): Promise<any> {
    try {
      const query = `
        INSERT INTO EmployerData (
          fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages
        ) 
        VALUES (
          ${row.fein}, ${row.employer_name}, ${row.employer_address}, ${row.employer_city}, ${row.employer_state}, ${row.employer_zip}, ${row.employer_phone}, ${row.employer_email}, ${row.total_paid_wages}
        )`;
      const result = await this.connection.query`${query}`;
      return result;
    } catch (error) {
      console.error("Error inserting data", error);
      throw error;
    } finally {
      this.connection.close();
    }
  }

  // Read operation
  async readAll(): Promise<IResult<CsvRow>> {
    try {
      const result = await this.connection.query`SELECT * FROM EmployerData`;
      return result;
    } catch (error) {
      console.error("Error reading data", error);
      throw error;
    } finally {
      this.connection.close();
    }
  }

  // Update operation
  async update(id: string, data: any): Promise<any> {
    // Implement your update logic here
    // Use this.connection to interact with the database
    // Return the updated data
  }

  // Delete operation
  async delete(id: string): Promise<void> {
    // Implement your delete logic here
    // Use this.connection to interact with the database
  }
}

export default Service;
