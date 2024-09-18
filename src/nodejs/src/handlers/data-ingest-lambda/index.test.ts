import { handler } from "./index";
import { S3 } from "@aws-sdk/client-s3";
import { Context, Callback, SNSEvent } from "aws-lambda";
import { Readable } from "stream";
import { IrsEmployerService } from "../../layers/service-layer/service/irs.employer.service";
import { MyuiEmployerService } from "../../layers/service-layer/service/myui.employer.service";
import { ReportJobRunService } from "../../layers/service-layer/service/report.job.run.service";
import { IrsCsvRow } from "../../layers/service-layer/interface/irs.csv.row";
import { MyuiCsvRow } from "../../layers/service-layer/interface/myui.csv.row";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/client-sns");
jest.mock("../../layers/service-layer/service/irs.employer.service");
jest.mock("../../layers/service-layer/service/myui.employer.service");
jest.mock("../../layers/service-layer/service/report.job.run.service");

describe("data-ingest-lambda handler", () => {
  let mockS3GetObject: jest.Mock;
  let mockIrsServiceInsertMany: jest.Mock;
  let mockMyuiServiceInsertMany: jest.Mock;
  let mockIrsServiceReadAll: jest.Mock;
  let mockMyuiServiceReadAll: jest.Mock;
  let mockReportJobRunServiceInsert: jest.Mock;

  beforeEach(() => {
    mockS3GetObject = jest.fn();
    (S3 as jest.Mock).mockImplementation(() => ({
      getObject: mockS3GetObject,
    }));

    mockIrsServiceInsertMany = jest.fn();
    mockMyuiServiceInsertMany = jest.fn();
    mockIrsServiceReadAll = jest.fn();
    mockMyuiServiceReadAll = jest.fn();
    mockReportJobRunServiceInsert = jest.fn();

    (IrsEmployerService as jest.Mock).mockImplementation(() => ({
      insertMany: mockIrsServiceInsertMany,
      readAll: mockIrsServiceReadAll,
    }));
    (MyuiEmployerService as jest.Mock).mockImplementation(() => ({
      insertMany: mockMyuiServiceInsertMany,
      readAll: mockMyuiServiceReadAll,
    }));
    (ReportJobRunService as jest.Mock).mockImplementation(() => ({
      insert: mockReportJobRunServiceInsert,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should process SNS event and insert CSV data into the IRS database", async () => {
    const mockCsvData = Readable.from(["header1,header2\nvalue1,value2"]);
    mockS3GetObject.mockResolvedValue({ Body: mockCsvData });
    mockIrsServiceInsertMany.mockResolvedValue({});

    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: { key: "irs-test-key" },
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
      Key: "irs-test-key",
    });
    expect(mockIrsServiceInsertMany).toHaveBeenCalledWith([
      { header1: "value1", header2: "value2" },
    ]);
    expect(callback).toHaveBeenCalledWith(null, "Data inserted successfully");
  });

  it("should process SNS event and insert CSV data into the MyUI database", async () => {
    const mockCsvData = Readable.from(["header1,header2\nvalue1,value2"]);
    mockS3GetObject.mockResolvedValue({ Body: mockCsvData });
    mockMyuiServiceInsertMany.mockResolvedValue({});

    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: { key: "myui-test-key" },
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
      Key: "myui-test-key",
    });
    expect(mockMyuiServiceInsertMany).toHaveBeenCalledWith([
      { header1: "value1", header2: "value2" },
    ]);
    expect(callback).toHaveBeenCalledWith(null, "Data inserted successfully");
  });

  it("should process non-SNS event and return all rows from the IRS database", async () => {
    const mockRows: IrsCsvRow[] = [
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
        run_id: 1,
      },
    ];
    const payload = {
      size: mockRows.length,
      rows: mockRows,
    };
    mockIrsServiceReadAll.mockResolvedValue({ recordset: mockRows });

    const event = { type: "irs-read-all" } as any;
    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(mockIrsServiceReadAll).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(null, JSON.stringify(payload));
  });

  it("should process non-SNS event and return all rows from the MyUI database", async () => {
    const mockRows: MyuiCsvRow[] = [
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
        run_id: 1,
      },
    ];
    const payload = {
      size: mockRows.length,
      rows: mockRows,
    };
    mockMyuiServiceReadAll.mockResolvedValue({ recordset: mockRows });

    const event = { type: "myui-read-all" } as any;
    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(mockMyuiServiceReadAll).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(null, JSON.stringify(payload));
  });

  it("should generate a report run ID", async () => {
    const mockReportJobRun = {
      run_name: "Test Run",
      run_description: "Test Run Description",
      job_id: 1,
    };
    mockReportJobRunServiceInsert.mockResolvedValue(mockReportJobRun);

    const event = { type: "generate-report-run-id" } as any;
    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(mockReportJobRunServiceInsert).toHaveBeenCalledWith(
      mockReportJobRun,
    );
    expect(callback).toHaveBeenCalledWith(null, mockReportJobRun);
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

    expect(callback).toHaveBeenCalledWith(
      new Error(`Error processing event: ${error.message}`),
    );
  });

  it("should throw an error for invalid object key in SNS event", async () => {
    const mockCsvData = Readable.from(["header1,header2\nvalue1,value2"]);
    mockS3GetObject.mockResolvedValue({ Body: mockCsvData });

    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: { key: "invalid-key" },
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

    expect(callback).toHaveBeenCalledWith(
      new Error("Invalid object key: invalid-key"),
    );
  });

  it("should throw an error for invalid event type in non-SNS event", async () => {
    const event = { type: "invalid" } as any;
    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledWith(
      new Error("Invalid event type: invalid"),
    );
  });

  it("should handle empty SNS event gracefully", async () => {
    const event: SNSEvent = {
      Records: [],
    } as any;

    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledWith(
      new Error(
        "Error processing event: Cannot read property 'Sns' of undefined",
      ),
    );
  });

  it("should handle empty S3 event gracefully", async () => {
    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [],
            }),
          },
        },
      ],
    } as any;

    const context: Context = {} as any;
    const callback: Callback = jest.fn();

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledWith(
      new Error(
        "Error processing event: Cannot read property 's3' of undefined",
      ),
    );
  });

  it("should handle missing S3 bucket name gracefully", async () => {
    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: {},
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

    expect(callback).toHaveBeenCalledWith(
      new Error(
        "Error processing event: Cannot read property 'name' of undefined",
      ),
    );
  });

  it("should handle missing S3 object key gracefully", async () => {
    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: "test-bucket" },
                    object: {},
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

    expect(callback).toHaveBeenCalledWith(
      new Error(
        "Error processing event: Cannot read property 'key' of undefined",
      ),
    );
  });
});
