import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Duration } from 'aws-cdk-lib';
import {
  Code,
  DockerImageCode,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { SnsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { CdkResourceInitializer } from './resource-initializer';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DATABASE_NAME } from './stack-constants';

export class NodejsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VpcLambda', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'privatelambda',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
    });

    const dbInstance = new rds.DatabaseInstance(this, 'Instance', {
      engine: rds.DatabaseInstanceEngine.sqlServerEx({
        version: rds.SqlServerEngineVersion.VER_16,
      }),
      // optional, defaults to m5.large
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      maxAllocatedStorage: 200,
      publiclyAccessible: true,
    });

    const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc,
    });

    // potentially allow connections to the RDS instance...
    // dbInstance.connections.allowFrom ...

    const initializer = new CdkResourceInitializer(this, 'MyRdsInit', {
      config: {
        dbSecretName: dbInstance.secret?.secretName || '',
      },
      fnLogRetention: RetentionDays.FIVE_MONTHS,
      fnCode: DockerImageCode.fromImageAsset(
        path.join(__dirname, '..', 'rds-init-fn-code'),
        {}
      ),
      fnTimeout: Duration.minutes(2),
      fnSecurityGroups: [lambdaSG],
      vpc,
      subnetsSelection: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
    });
    // manage resources dependency
    initializer.customResource.node.addDependency(dbInstance);

    // allow the initializer function to connect to the RDS instance
    dbInstance.connections.allowFrom(initializer.function, ec2.Port.tcp(1433));

    // allow initializer function to read RDS instance creds secret
    dbInstance.secret?.grantRead(initializer.function);

    /* eslint no-new: 0 */
    new cdk.CfnOutput(this, 'RdsInitFnResponse', {
      value: cdk.Token.asString(initializer.response),
    });

    const s3Bucket = new s3.Bucket(this, 'DataIngestBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: 'devraghavm-data-ingest-bucket',
    });

    const snsTopic = new sns.Topic(this, 'DataIngestTopic', {
      displayName: 'Data Ingest Topic',
      topicName: 'DataIngestTopic',
    });

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(snsTopic),
      {
        prefix: 'irs/',
        suffix: '.csv',
      }
    );

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(snsTopic),
      {
        prefix: 'myui/',
        suffix: '.csv',
      }
    );

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          '@aws-sdk/*', // Use the AWS SDK for JS v3 available in the Lambda runtime
          'aws-lambda', // Use the 'aws-lambda' available in the Layer
          'csv-parser', // Use the 'csv-parser' available in the Layer
          'mssql', // Use the 'mssql' available in the Layer
          'winston', // Use the 'winston' available in the Layer
        ],
      },
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(3), // Default is 3 seconds
      memorySize: 256,
    };

    const dependenciesLayer = new LayerVersion(this, 'DependenciesLayer', {
      code: Code.fromAsset(path.join(__dirname, '/dist/layers/deps-layer')),
    });

    const servicesLayer = new LayerVersion(this, 'ServicesLayer', {
      code: Code.fromAsset(
        path.join(__dirname, '/dist/src/layers/service-layer')
      ),
    });

    const rdsLambdaFn = new NodejsFunction(this, 'rdsLambdaFn', {
      entry: path.join(
        __dirname,
        '/dist/src/handlers/data-ingest-lambda',
        'index.js'
      ),
      ...nodeJsFunctionProps,
      functionName: 'rdsLambdaFn',
      environment: {
        DB_ENDPOINT_ADDRESS: dbInstance.dbInstanceEndpointAddress,
        DB_NAME: DATABASE_NAME,
        DB_SECRET_ARN: dbInstance.secret?.secretFullArn || '',
      },
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      securityGroups: [lambdaSG],
      layers: [dependenciesLayer, servicesLayer],
    });

    s3Bucket.grantRead(rdsLambdaFn);

    dbInstance.secret?.grantRead(rdsLambdaFn);

    dbSecurityGroup.addIngressRule(
      lambdaSG,
      ec2.Port.tcp(1433),
      'Lambda to SQL Server database'
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(1433),
      'My Machine to SQL Server database'
    );

    rdsLambdaFn.addEventSource(new SnsEventSource(snsTopic));
  }
}
