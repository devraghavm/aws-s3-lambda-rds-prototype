import { createConnectionPool } from "../config/db.config";
import logger from "../config/logger.config";
import { IService } from "../contract/iservice";
import { ReportRunStatus } from "../interface/report.run.status";
import * as sql from "mssql";

export class ReportRunStatusService implements IService<ReportRunStatus> {
  async retrieveRunId(): Promise<number> {
    //return the max run id from the table where the run status is not completed
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      const result = await request.query(
        `
        SELECT DISTINCT run_id
        FROM ReportRunStatus
        WHERE run_id NOT IN (
          SELECT run_id 
          FROM ReportRunStatus 
          WHERE run_status = 'COMPLETED'
        )
        `,
      );
      logger.info(`Retrieved max run id ${result}`);
      return result.recordset[0].run_id;
    } catch (error) {
      logger.error(`Error retrieving max run id ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }
  genreateId(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  async insert(row: ReportRunStatus): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting row ${JSON.stringify(row)}`);
      await transaction.begin();
      const request = pool.request();
      request.input("run_id", sql.Int, row.run_id);
      request.input("run_status", sql.VarChar, row.run_status);
      request.input("run_message", sql.VarChar, row.run_message);
      const query = `
        INSERT INTO ReportRunStatus (
          run_id, run_status, run_message
        ) 
        VALUES (
          @run_id, @run_status, @run_message
        )`;
      let result = await request.query(query);
      await transaction.commit();
      logger.info(`Inserted row ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`Error inserting data ${error}`);
      await transaction.rollback();
      throw error;
    } finally {
      await pool.close();
    }
  }
  async insertMany(rows: ReportRunStatus[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${rows}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("ReportRunStatus");
      table.columns.add("run_id", sql.Int, { nullable: false });
      table.columns.add("run_status", sql.VarChar, { nullable: false });
      table.columns.add("run_message", sql.VarChar, { nullable: false });
      rows.forEach((row) => {
        table.rows.add(row.run_id, row.run_status, row.run_message);
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
  async readAll(): Promise<sql.IResult<ReportRunStatus[]>> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      const result = await request.query("SELECT * FROM ReportRunStatus");
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
  async readByRunId(runId: number): Promise<sql.IResult<ReportRunStatus[]>> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      request.input("run_id", sql.Int, runId);
      const query = `
        SELECT * 
        FROM ReportRunStatus 
        WHERE run_id = @run_id`;
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
  async update(id: number, row: ReportRunStatus): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async delete(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async isStageCompleted(runId: number): Promise<boolean> {
    const pool = await createConnectionPool();
    try {
      const request = pool.request();
      request.input("run_id", sql.Int, runId);
      const result = await request.query(
        `
        SELECT count(*) as run_count
        FROM ReportRunStatus
        WHERE run_id = @run_id
        AND run_status in ('IRS_STAGE_COMPLETED', 'MYUI_STAGE_COMPLETED')
        `,
      );
      logger.info(`Retrieved run status ${result}`);
      return result.recordset[0].run_count === 2;
    } catch (error) {
      logger.error(`Error retrieving run status ${error}`);
      throw error;
    } finally {
      await pool.close();
    }
  }
}
