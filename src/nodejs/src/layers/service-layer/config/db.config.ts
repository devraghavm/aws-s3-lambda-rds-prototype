import {
  GetSecretValueCommandInput,
  SecretsManager,
} from "@aws-sdk/client-secrets-manager";
import * as sql from "mssql";

async function retrieveSecret(secretArn: string): Promise<string> {
  const secretManager = new SecretsManager({
    region: "us-west-2",
  });
  const secretParams: GetSecretValueCommandInput = {
    SecretId: secretArn,
  };
  const secret = await secretManager.getSecretValue(secretParams);
  const secretString = secret.SecretString || "";

  if (!secretString) {
    throw new Error("secret string is empty");
  }
  return secretString;
}

export function createConnectionPool(): Promise<sql.ConnectionPool> {
  const secretStr = retrieveSecret(process.env.DB_SECRET_ARN || "");
  let secretString = "";
  secretStr.then((secret) => {
    console.log("Secret retrieved successfully", secret);
    secretString = secret;
  });
  const { password, username } = JSON.parse(secretString);
  const config = {
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
  return sql.connect(config);
}
