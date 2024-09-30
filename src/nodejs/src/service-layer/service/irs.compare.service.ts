import { createConnectionPool } from "../config/db.config";
import logger from "../config/logger.config";
import { IService } from "../contract/iservice";
import { IrsCompareResult } from "../enum/irs.compare.result";
import { IrsRow } from "../interface/irs.row";
import { IrsEmployerCompareData } from "../interface/irs.employer.compare.data";
import { MyuiRow } from "../interface/myui.row";
import IrsEmployerService from "./irs.employer.service";
import MyuiEmployerService from "./myui.employer.service";
import * as sql from "mssql";
import { json2csv } from "json-2-csv";
import { XMLBuilder, XmlBuilderOptions } from "fast-xml-parser";

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
      table.columns.add("byte_count", sql.VarChar, { nullable: false });
      table.columns.add("tc150_state_code", sql.VarChar, { nullable: false });
      table.columns.add("ein", sql.VarChar, { nullable: false });
      table.columns.add("dln", sql.VarChar, { nullable: false });
      table.columns.add("tax_period", sql.VarChar, { nullable: false });
      table.columns.add("check_digit", sql.VarChar, { nullable: false });
      table.columns.add("total_federal_taxable_wages", sql.VarChar, {
        nullable: false,
      });
      table.columns.add("zip_code", sql.VarChar, { nullable: false });
      table.columns.add("address_state_code", sql.VarChar, { nullable: false });
      table.columns.add("city", sql.VarChar, { nullable: false });
      table.columns.add("address", sql.VarChar, { nullable: false });
      table.columns.add("first_name_line", sql.VarChar, { nullable: false });
      table.columns.add("second_name_line", sql.VarChar, { nullable: false });
      table.columns.add("third_name_line", sql.VarChar, { nullable: false });
      table.columns.add("fourth_name_line", sql.VarChar, { nullable: false });
      table.columns.add("name_control", sql.VarChar, { nullable: false });
      table.columns.add("cross_reference_ein", sql.VarChar, {
        nullable: false,
      });
      table.columns.add("state_reporting_number", sql.VarChar, {
        nullable: false,
      });
      table.columns.add("form_indicator", sql.VarChar, { nullable: false });
      table.columns.add("run_id", sql.Int, { nullable: true });

      for (const row of rows) {
        table.rows.add(
          row.byte_count,
          row.tc150_state_code,
          row.ein,
          row.dln,
          row.tax_period,
          row.check_digit,
          row.total_federal_taxable_wages,
          row.zip_code,
          row.address_state_code,
          row.city,
          row.address,
          row.first_name_line,
          row.second_name_line,
          row.third_name_line,
          row.fourth_name_line,
          row.name_control,
          row.cross_reference_ein,
          row.state_reporting_number,
          row.form_indicator,
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
          byte_count,
          tc150_state_code,
          ein,
          dln,
          tax_period,
          check_digit,
          total_federal_taxable_wages,
          zip_code,
          address_state_code,
          city,
          address,
          first_name_line,
          second_name_line,
          third_name_line,
          fourth_name_line,
          name_control,
          cross_reference_ein,
          state_reporting_number,
          form_indicator,
          run_id
        FROM IrsEmployerCompareData
        WHERE run_id = @run_id
        ORDER BY ein
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
    const irsData: IrsRow[] = (await irsEmployerService.readByRunId(runId))
      .recordset;
    const myuiEmployerService = new MyuiEmployerService();
    const myuiData: MyuiRow[] = (await myuiEmployerService.readByRunId(runId))
      .recordset;

    // Compare the data here
    const irsEmployerCompareData: IrsEmployerCompareData[] = irsData.map(
      (irsRow) => {
        const myuiRow = myuiData.find((myuiRow) => myuiRow.ein === irsRow.ein);
        if (myuiRow) {
          // Compare the data here
          if (
            irsRow.total_federal_taxable_wages ===
            myuiRow.total_federal_taxable_wages
          ) {
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

  async generateXml(
    irsEmployerCompareDatas: IrsEmployerCompareData[],
  ): Promise<string> {
    const options: XmlBuilderOptions = {
      arrayNodeName: "data",
    };

    const xml = new XMLBuilder(options).build(irsEmployerCompareDatas);
    return xml;
  }
}
