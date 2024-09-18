import { IResult } from "mssql";
import { createConnectionPool } from "../config/db.config";
import { IrsCsvRow } from "../interface/irs.csv.row";
import * as sql from "mssql";
import { IService } from "../contract/iservice";
import logger from "../config/logger.config";

export class IrsEmployerService implements IService<IrsCsvRow> {
  constructor() {}
  async genreateId(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // Create operation
  async insert(row: IrsCsvRow): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting row ${row}`);
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
      request.input("run_id", sql.Int, row.run_id);
      const query = `
        INSERT INTO IrsEmployerData (
          fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages, run_id
        ) 
        VALUES (
          @fein, @employer_name, @employer_address, @employer_city, @employer_state, @employer_zip, @employer_phone, @employer_email, @total_paid_wages, @run_id
        )`;
      let result = await request.query(query);
      await transaction.commit();
      logger.info(`Inserted row ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error inserting data ${error}`);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Create Many operation
  async insertMany(rows: IrsCsvRow[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${JSON.stringify(rows)}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("IrsEmployerData");
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
      table.columns.add("run_id", sql.Int, { nullable: false });
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
          row.run_id,
        );
      }
      let result = await request.bulk(table);
      await transaction.commit();
      logger.info(`Inserted rows ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error("Error inserting data", error);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read operation
  async readAll(): Promise<IResult<IrsCsvRow[]>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      let result: IResult<IrsCsvRow[]> = await request.query(`
        SELECT 
          fein,
          employer_name,
          employer_address,
          employer_city,
          employer_state,
          employer_zip,
          employer_phone,
          employer_email,
          total_paid_wages,
          run_id
        FROM IrsEmployerData
      `);
      logger.info(`Read data ${result?.recordset}`);
      return result;
    } catch (error) {
      logger.error("Error reading data", error);
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read by ID operation
  async readById(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // Read by Run ID operation
  async readByRunId(run_id: number): Promise<IResult<IrsCsvRow[]>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      request.input("run_id", sql.Int, run_id);
      let result: IResult<IrsCsvRow[]> = await request.query(`
        SELECT 
          fein,
          employer_name,
          employer_address,
          employer_city,
          employer_state,
          employer_zip,
          employer_phone,
          employer_email,
          total_paid_wages,
          run_id
        FROM IrsEmployerData
        WHERE run_id = @run_id
      `);
      logger.info(`Read data ${result?.recordset}`);
      return result;
    } catch (error) {
      logger.error("Error reading data", error);
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Update operation
  async update(id: number, row: IrsCsvRow): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // Delete operation
  async delete(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export default IrsEmployerService;
