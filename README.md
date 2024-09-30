# aws-s3-lambda-rds-prototype

## Generating dist directory

**Prerequisites**: Nodejs Version 20.x or higher, [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable) package manager

1. Clone the repo.
2. Navigate to `src/nodejs` folder and run `yarn install` to install project dependencies.

```sh
cd aws-s3-lambda-rds-prototype/src/nodejs
yarn install
```

3. Run the below command to clean the existing dist folder.

```sh
yarn clean
```

4. Run the below command to compile the `service-layer` source code and copy the output files to `dist` folder.

```sh
yarn build-service-layer
```

5. Run the below command to compile the `deps-layer` source code and copy the output files to `dist` folder.

```sh
yarn build-deps-layer
```

6. Run the below command to compile the `data-ingest-lambda` source code and copy the output files to `dist` folder.

```sh
yarn build-data-ingest-lambda
```

7. Run the below command to compile the `data-processing-lambda` source code and copy the output files to `dist` folder.

```sh
yarn build-data-processing-lambda
```

5.  (Optional) Run the below command to copy over `dist` folder to `iac/cdk/nodejs` for CDK buildout.

```sh
cp -r dist ../../iac/cdk/nodejs
```

## CDK

**Prerequisites**: Nodejs Version 20.x or higher, CDK Installed

### Deploy AWS CDK Stack

1. Clone the application.
2. Navigate to the `cdk` folder.

```sh
cd aws-s3-lambda-rds-prototype/iac/cdk/nodejs
```

3. Make sure your AWS credentials are set/ Run the below commands to initialize the stack. (This is a one-time job and we don't need to run all the time to deploy the infrastructure.)

```sh
cdk bootstrap
```

4. Run the below command to validate if the CDK code is valid.

```sh
cdk synth
```

This should produce the Cloud Formation code that is going to run as part the deploy.

5. Run the below command to deploy the cdk stack.

```sh
cdk deploy
```

Once the deploy is successful, you can navigate to AWS Console, go to Cloud Formation service and investigate the stack, its resources for the AWS Resources created.

### Testing the functionality

- Once the cdk stack is deployed, you should see an S3 Bucket with name `devraghavm-data-ingest-bucket`. Navigate to that bucket and create subfolder with name `irs`.
- Upload the `employer_data.csv` file under path `src/nodejs` folder in the repository to the `irs` folder in the S3 Bucket.
- You should see the following happen:
  1. An event notification triggered
  2. An SNS message produced with the S3 information in it
  3. Lambda function triggered as an SNS target.
  4. The Lambda function should call S3, fetch the respective file, process the csv, do a bulk insert into the EmployerData table in RDS.
  5. To test if the records are inserted you can run test in Lambda function with default payload and it should return the response payload based on RDS data.

### Destroy AWS CDK Stack

Run the below command to destroy the CDK stack:

```sh
cdk destroy
```

This command should cleanup all the resources in AWS.
