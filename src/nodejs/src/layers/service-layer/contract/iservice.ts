export interface IService<T> {
  insert(row: T): Promise<any>;
  insertMany(rows: T[]): Promise<any>;
  readAll(): Promise<any>;
  readById(id: number): Promise<any>;
  update(id: number, row: T): Promise<any>;
  delete(id: number): Promise<any>;
}
