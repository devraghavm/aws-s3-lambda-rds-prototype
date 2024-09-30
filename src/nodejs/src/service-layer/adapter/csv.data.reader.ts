import { IrsRow } from "../interface/irs.row";
import { MyuiRow } from "../interface/myui.row";
import { IDataReader } from "./data.reader";
import { Readable } from "stream";
import csv from "csv-parser";
import logger from "../config/logger.config";

export class CsvDataReader implements IDataReader<IrsRow[] | MyuiRow[]> {
  public async readData(
    csvData: Readable,
    runId: number,
    type?: string,
  ): Promise<IrsRow[] | MyuiRow[]> {
    return new Promise<IrsRow[] | MyuiRow[]>((resolve, reject) => {
      if (type === "irs") {
        const rows: IrsRow[] = [];
        csvData
          .pipe(csv())
          .on("data", (data: IrsRow) => rows.push({ ...data, run_id: runId }))
          .on("end", () => resolve(rows))
          .on("error", (error: Error) => {
            logger.error("Error processing CSV data", error);
            reject(error);
          });
      } else if (type === "myui") {
        const rows: MyuiRow[] = [];
        csvData
          .pipe(csv())
          .on("data", (data: MyuiRow) => rows.push({ ...data, run_id: runId }))
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
