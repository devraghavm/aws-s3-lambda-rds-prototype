import { MyuiEmployerService } from "../myui.employer.service";
import { createConnectionPool } from "../../config/db.config";
import { MyuiCsvRow } from "../../interface/myui.csv.row";
import * as sql from "mssql";

jest.mock("./config/db.config");
jest.mock("mssql");

describe("MyuiEmployerService", () => {
  let service: MyuiEmployerService;
  let mockPool: any;
  let mockTransaction: any;
  let mockRequest: any;

  beforeEach(() => {
    service = new MyuiEmployerService();
    mockPool = {
      transaction: jest.fn().mockReturnThis(),
      request: jest.fn().mockReturnThis(),
      close: jest.fn(),
    };
    mockTransaction = {
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    mockRequest = {
      input: jest.fn(),
      query: jest.fn(),
      bulk: jest.fn(),
    };
    (createConnectionPool as jest.Mock).mockResolvedValue(mockPool);
    (sql.Table as jest.Mock).mockImplementation(() => ({
      columns: { add: jest.fn() },
      rows: { add: jest.fn() },
    }));
    mockPool.transaction.mockReturnValue(mockTransaction);
    mockPool.request.mockReturnValue(mockRequest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("insert", () => {
    it("should insert a row into the database", async () => {
      const row: MyuiCsvRow = {
        fein: 123456789,
        employer_name: "Test Employer",
        employer_address: "123 Test St",
        employer_city: "Test City",
        employer_state: "TS",
        employer_zip: "12345",
        employer_phone: "123-456-7890",
        employer_email: "test@example.com",
        total_paid_wages: 1000.0,
      };

      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await service.insert(row);

      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledTimes(9);
      expect(mockRequest.query).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ recordset: [] });
    });

    it("should rollback transaction if an error occurs", async () => {
      const row: MyuiCsvRow = {
        fein: 123456789,
        employer_name: "Test Employer",
        employer_address: "123 Test St",
        employer_city: "Test City",
        employer_state: "TS",
        employer_zip: "12345",
        employer_phone: "123-456-7890",
        employer_email: "test@example.com",
        total_paid_wages: 1000.0,
      };

      mockRequest.query.mockRejectedValue(new Error("Test Error"));

      await expect(service.insert(row)).rejects.toThrow("Test Error");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("insertMany", () => {
    it("should insert multiple rows into the database", async () => {
      const rows: MyuiCsvRow[] = [
        {
          fein: 123456789,
          employer_name: "Test Employer 1",
          employer_address: "123 Test St",
          employer_city: "Test City",
          employer_state: "TS",
          employer_zip: "12345",
          employer_phone: "123-456-7890",
          employer_email: "test1@example.com",
          total_paid_wages: 1000.0,
        },
        {
          fein: 987654321,
          employer_name: "Test Employer 2",
          employer_address: "456 Test Ave",
          employer_city: "Test City",
          employer_state: "TS",
          employer_zip: "54321",
          employer_phone: "098-765-4321",
          employer_email: "test2@example.com",
          total_paid_wages: 2000.0,
        },
      ];

      mockRequest.bulk.mockResolvedValue({ rowsAffected: [2] });

      const result = await service.insertMany(rows);

      expect(mockTransaction.begin).toHaveBeenCalled();
      expect(mockRequest.bulk).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ rowsAffected: [2] });
    });

    it("should rollback transaction if an error occurs", async () => {
      const rows: MyuiCsvRow[] = [
        {
          fein: 123456789,
          employer_name: "Test Employer 1",
          employer_address: "123 Test St",
          employer_city: "Test City",
          employer_state: "TS",
          employer_zip: "12345",
          employer_phone: "123-456-7890",
          employer_email: "test1@example.com",
          total_paid_wages: 1000.0,
        },
      ];

      mockRequest.bulk.mockRejectedValue(new Error("Test Error"));

      await expect(service.insertMany(rows)).rejects.toThrow("Test Error");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("readAll", () => {
    it("should read all rows from the database", async () => {
      const mockResult = {
        recordset: [
          {
            fein: 123456789,
            employer_name: "Test Employer",
            employer_address: "123 Test St",
            employer_city: "Test City",
            employer_state: "TS",
            employer_zip: "12345",
            employer_phone: "123-456-7890",
            employer_email: "test@example.com",
            total_paid_wages: 1000.0,
          },
        ],
      };

      mockRequest.query.mockResolvedValue(mockResult);

      const result = await service.readAll();

      expect(mockRequest.query).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("should throw an error if reading fails", async () => {
      mockRequest.query.mockRejectedValue(new Error("Test Error"));

      await expect(service.readAll()).rejects.toThrow("Test Error");
    });
  });
});
