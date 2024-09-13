const mssql = require('mssql');
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');
const fs = require('fs');
const path = require('path');

const secrets = new SecretsManager({});

exports.handler = async (e) => {
  try {
    const { config } = e.params;
    const { password, username, host } = await getSecretValue(
      config.dbSecretName
    );
    const dbConfig = {
      user: username || '',
      password: password,
      port: 1433,
      server: host || '',
      database: 'master' || '',
      parseJSON: true,
      options: {
        enableArithAbort: true,
        encrypt: true,
        trustServerCertificate: true,
      },
    };
    const pool = await mssql.connect(dbConfig);

    const databaseScript = fs
      .readFileSync(path.join(__dirname, 'database.sql'))
      .toString();
    const databaseResult = await query(pool, databaseScript);
    const sqlScript = fs
      .readFileSync(path.join(__dirname, 'script.sql'))
      .toString();
    const sqlResult = await query(pool, sqlScript);

    return {
      status: 'OK',
      results: `Database and tables created successfully: ${databaseResult} ${sqlResult}`,
    };
  } catch (err) {
    return {
      status: 'ERROR',
      err,
      message: err.message,
    };
  }
};

function query(pool, sql) {
  return new Promise((resolve, reject) => {
    pool
      .request()
      .query(sql)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function getSecretValue(secretId) {
  return new Promise((resolve, reject) => {
    secrets.getSecretValue({ SecretId: secretId }, (err, data) => {
      if (err) return reject(err);

      return resolve(JSON.parse(data.SecretString));
    });
  });
}
