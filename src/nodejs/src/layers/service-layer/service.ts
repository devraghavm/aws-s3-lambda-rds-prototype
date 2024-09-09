import { IResult } from "mssql";
import { createConnectionPool } from "./config/db.config";
import { CsvRow } from "./interfaces/csv.row";
import * as sql from "mssql";

export class Service {
  constructor() {}

  // Create operation
  async insert(row: CsvRow): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      console.log("Inserting row", row);
      await transaction.begin();
      const request = pool.request();
      request.input("fein", sql.Int, row.fein);
      request.input("employer_name", sql.VarChar, row.employer_name);
      request.input("employer_address", sql.VarChar, row.employer_address);
      request.input("employer_city", sql.VarChar, row.employer_city);
      request.input("employer_state", sql.VarChar, row.employer_state);
      request.input("employer_zip", sql.VarChar, row.employer_zip);
      request.input("employer_phone", sql.VarChar, row.employer_phone);
      request.input("employer_email", sql.VarChar, row.employer_email);
      request.input(
        "total_paid_wages",
        sql.Decimal(18, 2),
        row.total_paid_wages,
      );
      const query = `
        INSERT INTO EmployerData (
          fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages
        ) 
        VALUES (
          @fein, @employer_name, @employer_address, @employer_city, @employer_state, @employer_zip, @employer_phone, @employer_email, @total_paid_wages
        )`;
      let result = await request.query(query);
      await transaction.commit();
      console.log("Inserted row", result);
      return result;
    } catch (error) {
      console.error("Error inserting data", error);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Create Many operation
  async insertMany(rows: CsvRow[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      console.log("Inserting rows", rows);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("EmployerData");
      table.columns.add("fein", sql.Int, {
        nullable: false,
        primary: true,
      });
      table.columns.add("employer_name", sql.VarChar, { nullable: false });
      table.columns.add("employer_address", sql.VarChar, { nullable: false });
      table.columns.add("employer_city", sql.VarChar, { nullable: false });
      table.columns.add("employer_state", sql.VarChar, { nullable: false });
      table.columns.add("employer_zip", sql.VarChar, { nullable: false });
      table.columns.add("employer_phone", sql.VarChar, { nullable: false });
      table.columns.add("employer_email", sql.VarChar, { nullable: false });
      table.columns.add("total_paid_wages", sql.Decimal(18, 2), {
        nullable: false,
      });
      for (const row of rows) {
        table.rows.add(
          row.fein,
          row.employer_name,
          row.employer_address,
          row.employer_city,
          row.employer_state,
          row.employer_zip,
          row.employer_phone,
          row.employer_email,
          row.total_paid_wages,
        );
      }
      let result = await request.bulk(table);
      await transaction.commit();
      console.log("Inserted rows", result);
      return result;
    } catch (error) {
      console.error("Error inserting data", error);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read operation
  async readAll(): Promise<IResult<CsvRow[]>> {
    const pool = await createConnectionPool();
    try {
      console.log("Reading data");
      const request = pool.request();
      let result: IResult<CsvRow[]> = await request.query(`
        SELECT 
          fein,
          employer_name,
          employer_address,
          employer_city,
          employer_state,
          employer_zip,
          employer_phone,
          employer_email,
          total_paid_wages
        FROM EmployerData
      `);
      console.log("Read data", result?.recordset);
      return result;
    } catch (error) {
      console.error("Error reading data", error);
      throw error;
    } finally {
      await pool.close();
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
