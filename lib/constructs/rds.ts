import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  StorageType,
} from 'aws-cdk-lib/aws-rds';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { allowedIps } from '../../allowed-ips';

interface StackProps {
  // this is useful when deploying to multiple environments e.g. prod, dev
  prefix: string;
  vpc: IVpc;
  user: string;
  port: number;
  database: string;
  secretName: string;
}

/**
 * Creates a PG DB on AWS RDS
 *
 * @param  {cdk.Construct} scope stack application scope
 * @param  {StackProps} props props needed to create the resource
 *
 */
export class PGRdsInstance {
  public readonly databaseSecretName: string;

  constructor(scope: Construct, props: StackProps) {
    // create the security group for RDS instance
    const ingressSecurityGroup = new SecurityGroup(
      scope,
      `${props.prefix}-rds-ingress`,
      {
        vpc: props.vpc,
        securityGroupName: `${props.prefix}-rds-ingress-sg`,
        allowAllOutbound: false,
      },
    );

    ingressSecurityGroup.addIngressRule(
      // defaultVPC.vpcCidrBlock refers to all the IP addresses in defaultVPC
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(props.port),
      'Allows only local resources inside VPC to access this Postgres port',
    );

    for (const allowedIp of allowedIps) {
      for (const ip of allowedIp.IPs) {
        ingressSecurityGroup.addIngressRule(
          // defaultVPC.vpcCidrBlock refers to all the IP addresses in defaultVPC
          ec2.Peer.ipv4(ip),
          ec2.Port.tcp(props.port),
          'Allows static ip to access this port',
        );
      }
    }

    // Dynamically generate the username and password, then store in secrets manager
    const databaseCredentialsSecret = new Secret(
      scope,
      `${props.prefix}-PGCredentialsSecret`,
      {
        secretName: props.secretName,
        description: 'Credentials to access PG Database on RDS',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: props.user }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      },
    );

    const pgRDSInstance = new DatabaseInstance(
      scope,
      `${props.prefix}-PGRDSInstance`,
      {
        credentials: Credentials.fromSecret(databaseCredentialsSecret),
        engine: DatabaseInstanceEngine.postgres({
          version: PostgresEngineVersion.VER_13_4,
        }),
        databaseName: props.database,
        port: props.port,
        allocatedStorage: 20,
        storageType: StorageType.GP2,
        backupRetention: Duration.days(7),
        // t2.micro is free tier so we use it
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
        vpc: props.vpc,
        // we chose to place our database in an isolated subnet of our VPC
        vpcSubnets: { subnetType: SubnetType.PUBLIC }, // TODO for development
        // if we destroy our database, AWS will take a snapshot of the database instance before terminating it
        removalPolicy: RemovalPolicy.DESTROY,
        // accidental deletion protection -- you need to manually disable this in AWS web console to delete the database
        deletionProtection: true,
        securityGroups: [ingressSecurityGroup],
      },
    );
  }
}
