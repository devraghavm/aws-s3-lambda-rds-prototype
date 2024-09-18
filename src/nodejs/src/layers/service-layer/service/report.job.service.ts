import { createConnectionPool } from "../config/db.config";
import logger from "../config/logger.config";
import { IService } from "../contract/iservice";
import { ReportJob } from "../interface/report.job";
import * as sql from "mssql";

export class ReportJobService implements IService<ReportJob> {
  constructor() {}
  genreateId(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // Create operation
  async insert(row: ReportJob): Promise<any> {
    // Implement the insert operation here
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting row ${row}`);
      await transaction.begin();
      const request = pool.request();
      request.input("job_id", sql.Int, row.job_id);
      request.input("job_name", sql.VarChar, row.job_name);
      request.input("job_description", sql.VarChar, row.job_description);
      const query = `
        INSERT INTO ReportJob (
          job_id, job_name, job_description
        ) 
        VALUES (
          @job_id, @job_name, @job_description
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
  async insertMany(rows: ReportJob[]): Promise<any> {
    // Implement the insertMany operation here
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${rows}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("ReportJob");
      table.columns.add("job_id", sql.Int, { nullable: false });
      table.columns.add("job_name", sql.VarChar, { nullable: false });
      table.columns.add("job_description", sql.VarChar, { nullable: false });
      rows.forEach((row) => {
        table.rows.add(row.job_id, row.job_name, row.job_description);
      });
      const result = await request.bulk(table);
      await transaction.commit();
      logger.info(`Inserted rows ${result}`);
      return rows;
    } catch (error) {
      logger.error(`Error inserting data ${error}`);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read All
  async readAll(): Promise<sql.IResult<ReportJob[]>> {
    // Implement the readAll operation here
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      const query = `SELECT * FROM ReportJob`;
      const result = await request.query(query);
      return result;
    } catch (error) {
      logger.error(`Error reading data ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read By Id
  async readById(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // Read By Run Id
  async readByRunId(runId: number): Promise<sql.IResult<ReportJob[]>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      request.input("run_id", sql.Int, runId);
      const query = `
        SELECT 
          job_id, job_name, job_description, job_timestamp
        FROM ReportJob
        WHERE run_id = @run_id
      `;
      const result = await request.query(query);
      logger.info(`Read data ${result?.recordset}`);
      return result;
    } catch (error) {
      logger.error(`Error reading data ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Read By Job Status
  async readByJobName(jobName: string): Promise<sql.IResult<ReportJob>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      request.input("job_name", sql.VarChar, jobName);
      const query = `
        SELECT 
          job_id, job_name, job_description, job_timestamp
        FROM ReportJob
        WHERE job_name = @job_name
      `;
      const result = await request.query(query);
      logger.info(`Read data ${result?.recordset}`);
      return result;
    } catch (error) {
      logger.error(`Error reading data ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }

  // Update operation
  async update(id: number, row: ReportJob): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // Delete operation
  async delete(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
