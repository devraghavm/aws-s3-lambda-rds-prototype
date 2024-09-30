import { IResult } from "mssql";
import { createConnectionPool } from "../config/db.config";
import { IrsRow } from "../interface/irs.row";
import * as sql from "mssql";
import { IService } from "../contract/iservice";
import logger from "../config/logger.config";

export class IrsEmployerService implements IService<IrsRow> {
  constructor() {}
  async genreateId(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // Create operation
  async insert(row: IrsRow): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting row ${JSON.stringify(row)}`);
      await transaction.begin();
      const request = pool.request();
      request.input("byte_count", sql.VarChar, row.byte_count);
      request.input("tc150_state_code", sql.VarChar, row.tc150_state_code);
      request.input("ein", sql.VarChar, row.ein);
      request.input("dln", sql.VarChar, row.dln);
      request.input("tax_period", sql.VarChar, row.tax_period);
      request.input("check_digit", sql.VarChar, row.check_digit);
      request.input(
        "total_federal_taxable_wages",
        sql.VarChar,
        row.total_federal_taxable_wages,
      );
      request.input("zip_code", sql.VarChar, row.zip_code);
      request.input("address_state_code", sql.VarChar, row.address_state_code);
      request.input("city", sql.VarChar, row.city);
      request.input("address", sql.VarChar, row.address);
      request.input("first_name_line", sql.VarChar, row.first_name_line);
      request.input("second_name_line", sql.VarChar, row.second_name_line);
      request.input("third_name_line", sql.VarChar, row.third_name_line);
      request.input("fourth_name_line", sql.VarChar, row.fourth_name_line);
      request.input("name_control", sql.VarChar, row.name_control);
      request.input(
        "cross_reference_ein",
        sql.VarChar,
        row.cross_reference_ein,
      );
      request.input(
        "state_reporting_number",
        sql.VarChar,
        row.state_reporting_number,
      );
      request.input("form_indicator", sql.VarChar, row.form_indicator);
      request.input("run_id", sql.Int, row.run_id);

      const query = `
        INSERT INTO IrsEmployerData (
          byte_count, tc150_state_code, ein, dln, tax_period, check_digit, total_federal_taxable_wages, zip_code, address_state_code, city, address, first_name_line, second_name_line, third_name_line, fourth_name_line, name_control, cross_reference_ein, state_reporting_number, form_indicator, run_id
        ) 
        VALUES (
          @byte_count, @tc150_state_code, @ein, @dln, @tax_period, @check_digit, @total_federal_taxable_wages, @zip_code, @address_state_code, @city, @address, @first_name_line, @second_name_line, @third_name_line, @fourth_name_line, @name_control, @cross_reference_ein, @state_reporting_number, @form_indicator, @run_id
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

  // Create Many operation
  async insertMany(rows: IrsRow[]): Promise<any> {
    const pool = await createConnectionPool();
    let transaction = pool.transaction();
    try {
      logger.info(`Inserting rows ${JSON.stringify(rows)}`);
      await transaction.begin();
      const request = pool.request();
      const table = new sql.Table("IrsEmployerData");
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
          row.run_id ?? null,
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
  async readAll(): Promise<IResult<IrsRow[]>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      let result: IResult<IrsRow[]> = await request.query(`
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
  async readByRunId(run_id: number): Promise<IResult<IrsRow[]>> {
    const pool = await createConnectionPool();
    try {
      logger.info("Reading data");
      const request = pool.request();
      request.input("run_id", sql.Int, run_id);
      let result: IResult<IrsRow[]> = await request.query(`
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
  async update(id: number, row: IrsRow): Promise<any> {
    throw new Error("Method not implemented.");
  }

  // Delete operation
  async delete(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export default IrsEmployerService;
