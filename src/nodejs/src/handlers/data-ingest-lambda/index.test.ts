import { handler } from "./index";
import { S3 } from "@aws-sdk/client-s3";
import { Context, Callback, SNSEvent } from "aws-lambda";
import { Readable } from "stream";
import { Service } from "../../layers/service-layer/service";
import { CsvRow } from "../../layers/service-layer/interfaces/csv.row";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/client-sns");
jest.mock("../../layers/service-layer/service");

describe("data-ingest-lambda handler", () => {
  let mockS3GetObject: jest.Mock;
  let mockServiceInsertMany: jest.Mock;
  let mockServiceReadAll: jest.Mock;

  beforeEach(() => {
    mockS3GetObject = jest.fn();
    (S3 as jest.Mock).mockImplementation(() => ({
      getObject: mockS3GetObject,
    }));

    mockServiceInsertMany = jest.fn();
    mockServiceReadAll = jest.fn();
    (Service as jest.Mock).mockImplementation(() => ({
      insertMany: mockServiceInsertMany,
      readAll: mockServiceReadAll,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should process SNS event and insert CSV data into the database", async () => {
    const mockCsvData = Readable.from(["header1,header2\nvalue1,value2"]);
    mockS3GetObject.mockResolvedValue({ Body: mockCsvData });
    mockServiceInsertMany.mockResolvedValue({});

    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: { key: "test-key" },
                  },
                },
              ],
            }),
          },
        },
      ],
    } as any;

    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(mockS3GetObject).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "test-key",
    });
    expect(mockServiceInsertMany).toHaveBeenCalledWith([
      { header1: "value1", header2: "value2" },
    ]);
    expect(callback).toHaveBeenCalledWith(null, "Data inserted successfully");
  });

  it("should process non-SNS event and return all rows from the database", async () => {
    const mockRows: CsvRow[] = [
      {
        fein: 123456789,
        employer_name: "Test Employer",
        employer_address: "123 Test St",
        employer_city: "Test City",
        employer_state: "TS",
        employer_zip: "12345",
        employer_phone: "123-456-7890",
        employer_email: "abc@gmail.com",
        total_paid_wages: 123456.78,
      },
    ];
    mockServiceReadAll.mockResolvedValue({ recordset: mockRows });

    const event = {} as any;
    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(mockServiceReadAll).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(null, JSON.stringify(mockRows));
  });

  it("should handle errors and call the callback with the error", async () => {
    const error = new Error("Test error");
    mockS3GetObject.mockRejectedValue(error);

    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: { key: "test-key" },
                  },
                },
              ],
            }),
          },
        },
      ],
    } as any;

    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledWith(error);
  });
});
