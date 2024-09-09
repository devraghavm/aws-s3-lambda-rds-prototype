import { S3Event, SNSEvent, Context, Callback } from "aws-lambda";
import { S3 } from "@aws-sdk/client-s3";
import {
  GetSecretValueCommandInput,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import { SNS } from "@aws-sdk/client-sns";
import csv from "csv-parser";
import { Readable } from "stream";
import * as sql from "mssql";

// Configure AWS SDK
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// AWS.config.update({ region: "us-west-2" });

const s3 = new S3({
  region: "us-west-2",
});
const sns = new SNS({
  region: "us-west-2",
});

interface S3EventRecord {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
    };
  };
}

interface CsvRow {
  // Define the structure of your CSV rows here
  fein: string;
  employer_name: string;
  employer_address: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  employer_phone: string;
  employer_email: string;
  total_paid_wages: string;
  // Add more columns as needed
}

export const handler = async (
  event: SNSEvent,
  context: Context,
  callback: Callback,
) => {
  try {
    // Process SNS event
    const dbSecretArn = process.env.DB_SECRET_ARN || "";
    const secretManager = new SecretsManager({
      region: "us-west-2",
    });
    const secretParams: GetSecretValueCommandInput = {
      SecretId: dbSecretArn,
    };
    const dbSecret = await secretManager.getSecretValue(secretParams);
    const secretString = dbSecret.SecretString || "";

    if (!secretString) {
      throw new Error("secret string is empty");
    }
    const { password, username } = JSON.parse(secretString);
    const config: sql.config = {
      user: username || "",
      password: password,
      port: 1433,
      server: process.env.DB_ENDPOINT_ADDRESS || "",
      database: process.env.DB_NAME || "",
      parseJSON: true,
      options: {
        enableArithAbort: true,
        encrypt: true,
        trustServerCertificate: true,
      },
    };
    if (event.Records && event.Records[0].Sns) {
      const s3Event: S3Event = JSON.parse(event.Records[0].Sns.Message);
      const record: S3EventRecord = s3Event.Records[0];

      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;
      console.log(
        `Processing S3 event from bucket ${bucketName} for object ${objectKey}`,
      );

      const params = {
        Bucket: bucketName,
        Key: objectKey,
      };

      const s3Object = await s3.getObject(params);

      console.log("Retrieved object from S3:", s3Object);
      const csvData = s3Object.Body as Readable;
      console.log("Parsing CSV data:", csvData);

      const rows: CsvRow[] = [];
      csvData
        .pipe(csv())
        .on("data", (data: CsvRow) => rows.push(data))
        .on("end", async () => {
          console.log("CSV data parsed:", rows);
          try {
            const pool = await sql.connect(config);
            console.log("Type of rows", typeof rows);
            for (const row of rows) {
              console.log("Inserting row", row);
              try {
                const request = new sql.Request(pool);
                const result = await request.query(
                  `INSERT INTO EmployerData (fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages) 
                  VALUES ('${row.fein}', '${row.employer_name}', '${row.employer_address}', '${row.employer_city}', '${row.employer_state}', '${row.employer_zip}', '${row.employer_phone}', '${row.employer_email}', '${row.total_paid_wages}')`,
                );
                console.log("Inserted row", result);
              } catch (error) {
                console.error("Error inserting row", error);
              }
            }
            pool.close();
            callback(null, "Data inserted successfully");
          } catch (error) {
            console.error("Error connecting to the database", error);
            callback(error as Error);
          }
        });
    } else {
      try {
        // Process non-SNS event
        console.log("Processing non-SNS event");
        const pool = await sql.connect(config);
        const request = new sql.Request(pool);
        const result: sql.IResult<CsvRow> = await request.query(
          "SELECT * FROM EmployerData",
        );
        const rows: CsvRow[] = result.recordset;
        pool.close();
        callback(null, JSON.stringify(rows));
      } catch (error) {
        console.error("Error connecting to the database", error);
        callback(error as Error);
      }
    }
  } catch (error) {
    console.error("Error processing event", error);
    callback(error as Error);
  }
};
