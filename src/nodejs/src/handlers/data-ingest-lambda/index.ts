import { S3Event, SNSEvent, Context, Callback } from "aws-lambda";
import * as AWS from "aws-sdk";
import csv from "csv-parser";
import { Connection, ConnectionConfiguration, Request } from "tedious";
import { Readable } from "stream";

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION });

const s3 = new AWS.S3();
const sns = new AWS.SNS();

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

// Create RDS client
const rds = new AWS.RDS.Signer();

// Generate DB authentication token
const databasePassword = rds.getAuthToken({
  hostname: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USER,
});

const config: ConnectionConfiguration = {
  server: process.env.DB_SERVER || "",
  authentication: {
    type: "default",
    options: {
      userName: process.env.DB_USER || "",
      password: databasePassword || "",
    },
  },
  options: {
    database: process.env.DB_NAME || "",
    encrypt: true,
  },
};

export const handler = async (
  event: SNSEvent,
  context: Context,
  callback: Callback,
) => {
  try {
    const s3Event: S3Event = JSON.parse(event.Records[0].Sns.Message);
    const record: S3EventRecord = s3Event.Records[0];

    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    const s3Object = await s3.getObject(params).promise();

    const csvData = s3Object.Body as Readable;

    const rows: CsvRow[] = [];
    csvData
      .pipe(csv())
      .on("data", (data: CsvRow) => rows.push(data))
      .on("end", async () => {
        const connection = new Connection(config);

        connection.on("connect", (err) => {
          if (err) {
            console.error("Connection Failed", err);
            callback(err);
          } else {
            rows.forEach((row) => {
              const request = new Request(
                `INSERT INTO EmployerData (fein, employer_name, employer_address, employer_city, employer_state, employer_zip, employer_phone, employer_email, total_paid_wages) 
              VALUES ('${row.fein}', '${row.employer_name}', '${row.employer_address}', '${row.employer_city}', '${row.employer_state}', '${row.employer_zip}', '${row.employer_phone}', '${row.employer_email}', '${row.total_paid_wages}')`,
                (err) => {
                  if (err) {
                    console.error("Insert Failed", err);
                  }
                },
              );
              connection.execSql(request);
            });
            callback(null, "Success");
          }
        });

        connection.connect();
      });
  } catch (error: Error | any) {
    console.error("Error processing SNS event", error);
    callback(error);
  }
};
