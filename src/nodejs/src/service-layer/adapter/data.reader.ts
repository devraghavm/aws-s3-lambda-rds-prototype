import { Readable } from "stream";
export interface IDataReader<T> {
  readData(csvData: Readable, runId: number, type?: string): Promise<T>;
}
