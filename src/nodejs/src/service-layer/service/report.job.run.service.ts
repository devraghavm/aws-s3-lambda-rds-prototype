import { createConnectionPool } from "../config/db.config";
import logger from "../config/logger.config";
import { IService } from "../contract/iservice";
import { ReportJobRun } from "../interface/report.job.run";
import * as sql from "mssql";

export class ReportJobRunService implements IService<ReportJobRun> {
  async genreateId(): Promise<number> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      const result = await request.query(
        "SELECT NEXT VALUE FOR ReportJobRunSeq AS run_id",
      );
      logger.info(`Generated run id ${result}`);
      return result.recordset[0].run_id;
    } catch (error) {
      logger.error(`Error generating run id ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }

  async insert(row: ReportJobRun): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting row ${row}`);
      await transaction.begin();
      const request = pool.request();
      request.input("run_id", sql.Int, row.run_id);
      request.input("run_name", sql.VarChar, row.run_name);
      request.input("run_description", sql.VarChar, row.run_description);
      request.input("job_id", sql.Int, row.job_id);
      const query = `
        INSERT INTO ReportJobRun (
          run_id, run_name, run_description, job_id
        ) 
        VALUES (
          @run_id, @run_name, @run_description, @job_id
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
  async insertMany(rows: ReportJobRun[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${rows}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("ReportJobRun");
      table.columns.add("run_id", sql.Int, { nullable: false });
      table.columns.add("run_name", sql.VarChar, { nullable: false });
      table.columns.add("run_description", sql.VarChar, { nullable: false });
      table.columns.add("job_id", sql.Int, { nullable: false });
      rows.forEach((row) => {
        table.rows.add(
          row.run_id,
          row.run_name,
          row.run_description,
          row.job_id,
        );
      });
      const result = await request.bulk(table);
      await transaction.commit();
      logger.info(`Inserted rows ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error inserting data ${error}`);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }
  async readAll(): Promise<sql.IResult<ReportJobRun[]>> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      const result = await request.query("SELECT * FROM ReportJobRun");
      logger.info(`Read all rows ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error reading data ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }
  async readById(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async readByRunId(runId: number): Promise<sql.IResult<ReportJobRun[]>> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      request.input("run_id", sql.Int, runId);
      const query = `
        SELECT * FROM ReportJobRun WHERE run_id = @run_id
      `;
      const result = await request.query(query);
      logger.info(`Read by run id ${result}`);
      return result;
    } catch (error) {
      logger.error(`Error reading data ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }
  async update(id: number, row: ReportJobRun): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async delete(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
