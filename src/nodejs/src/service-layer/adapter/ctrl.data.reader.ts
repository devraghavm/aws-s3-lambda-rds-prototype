import { IrsRow } from "../interface/irs.row";
import { MyuiRow } from "../interface/myui.row";
import { IDataReader } from "./data.reader";
import { Readable } from "stream";
import csv from "csv-parser";
import logger from "../config/logger.config";

export class CtrlDataReader implements IDataReader<IrsRow[] | MyuiRow[]> {
  public async readData(
    ctrlData: Readable,
    runId: number,
    type?: string,
  ): Promise<IrsRow[] | MyuiRow[]> {
    return new Promise<IrsRow[] | MyuiRow[]>((resolve, reject) => {
      if (type === "irs") {
        const rows: IrsRow[] = [];
        ctrlData
          .on("data", (data: string) => {
            const row: IrsRow = {
              byte_count: data.slice(0, 4),
              tc150_state_code: data.slice(4, 6),
              ein: data.slice(6, 15),
              dln: data.slice(15, 29),
              tax_period: data.slice(29, 35),
              check_digit: data.slice(35, 37),
              total_federal_taxable_wages: data.slice(37, 52),
              zip_code: data.slice(52, 64),
              address_state_code: data.slice(64, 66),
              city: data.slice(66, 91),
              address: data.slice(91, 126),
              first_name_line: data.slice(126, 161),
              second_name_line: data.slice(161, 196),
              third_name_line: data.slice(196, 231),
              fourth_name_line: data.slice(231, 266),
              name_control: data.slice(266, 270),
              cross_reference_ein: data.slice(270, 279),
              state_reporting_number: data.slice(279, 294),
              form_indicator: data.slice(294, 295),
              run_id: runId,
            };
            rows.push(row);
          })
          .on("end", () => resolve(rows))
          .on("error", (error: Error) => {
            logger.error("Error processing CSV data", error);
            reject(error);
          });
      } else if (type === "myui") {
        const rows: MyuiRow[] = [];
        ctrlData
          .on("data", (data: string) => {
            const row: MyuiRow = {
              byte_count: data.slice(0, 4),
              tc150_state_code: data.slice(4, 6),
              ein: data.slice(6, 15),
              dln: data.slice(15, 29),
              tax_period: data.slice(29, 35),
              check_digit: data.slice(35, 37),
              total_federal_taxable_wages: data.slice(37, 52),
              zip_code: data.slice(52, 64),
              address_state_code: data.slice(64, 66),
              city: data.slice(66, 91),
              address: data.slice(91, 126),
              first_name_line: data.slice(126, 161),
              second_name_line: data.slice(161, 196),
              third_name_line: data.slice(196, 231),
              fourth_name_line: data.slice(231, 266),
              name_control: data.slice(266, 270),
              cross_reference_ein: data.slice(270, 279),
              state_reporting_number: data.slice(279, 294),
              form_indicator: data.slice(294, 295),
              run_id: runId,
            };
            rows.push(row);
          })
          .on("end", () => resolve(rows))
          .on("error", (error: Error) => {
            logger.error("Error processing CSV data", error);
            reject(error);
          });
      } else {
        reject(new Error("Invalid type"));
      }
    });
  }
}
