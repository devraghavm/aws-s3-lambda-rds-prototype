import { createConnectionPool } from "../config/db.config";
import logger from "../config/logger.config";
import { IService } from "../contract/iservice";
import { IrsCompareResult } from "../enum/irs.compare.result";
import { IrsCsvRow } from "../interface/irs.csv.row";
import { IrsEmployerCompareData } from "../interface/irs.employer.compare.data";
import { MyuiCsvRow } from "../interface/myui.csv.row";
import IrsEmployerService from "./irs.employer.service";
import MyuiEmployerService from "./myui.employer.service";
import * as sql from "mssql";
import { json2csv } from "json-2-csv";

export class IrsCompareService implements IService<IrsEmployerCompareData> {
  async insert(row: IrsEmployerCompareData): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async insertMany(rows: IrsEmployerCompareData[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${JSON.stringify(rows)}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("IrsEmployerCompareData");
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
      table.columns.add("compare_result", sql.VarChar, { nullable: false });
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
          row.compare_result,
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
  async readAll(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async readById(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async readByRunId(runId: number): Promise<IrsEmployerCompareData[]> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      request.input("run_id", sql.Int, runId);
      let result: sql.IResult<IrsEmployerCompareData[]> = await request.query(`
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
          compare_result,
          run_id
        FROM IrsEmployerCompareData
        WHERE run_id = @run_id
        ORDER BY compare_result
      `);
      logger.info(`Read data ${result?.recordset}`);
      return result.recordset;
    } catch (error) {
      logger.error("Error reading data", error);
      throw error;
    } finally {
      await pool.close();
    }
  }
  async update(id: number, row: IrsEmployerCompareData): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async delete(id: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async genreateId(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  async compare(runId: number): Promise<any> {
    const irsEmployerService = new IrsEmployerService();
    const irsData: IrsCsvRow[] = (await irsEmployerService.readByRunId(runId))
      .recordset;
    const myuiEmployerService = new MyuiEmployerService();
    const myuiData: MyuiCsvRow[] = (
      await myuiEmployerService.readByRunId(runId)
    ).recordset;

    // Compare the data here
    const irsEmployerCompareData: IrsEmployerCompareData[] = irsData.map(
      (irsRow) => {
        const myuiRow = myuiData.find(
          (myuiRow) => myuiRow.fein === irsRow.fein,
        );
        if (myuiRow) {
          // Compare the data here
          if (irsRow.total_paid_wages === myuiRow.total_paid_wages) {
            // Insert the data into the compare table
            return { ...irsRow, compare_result: IrsCompareResult.MATCH };
          } else {
            return { ...irsRow, compare_result: IrsCompareResult.MISMATCH };
          }
        } else {
          return { ...irsRow, compare_result: IrsCompareResult.MISSING };
        }
      },
    );
    const result = await this.insertMany(irsEmployerCompareData);
    return result;
  }

  async generateCsv(
    irsEmployerCompareDatas: IrsEmployerCompareData[],
  ): Promise<string> {
    const csv = json2csv(irsEmployerCompareDatas, { excludeKeys: ["run_id"] });
    return csv;
  }
}
