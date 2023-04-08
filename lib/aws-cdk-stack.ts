import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC } from './constructs/vpc';
import { ApplicationLoadBalancedECS } from './constructs/ecs-alb';
import { PGRdsInstance } from './constructs/rds';
import { ECR } from './constructs/ecr';
import { Route53 } from './constructs/route53';
require('dotenv').config();

const config = {
  projectName: process.env.PROJECT_NAME as string,
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER as string,
    region: process.env.AWS_ACCOUNT_REGION as string,
  },
  vpc: {
    name: process.env.VPC_NAME as string,
  },
  ecr: {
    name: process.env.ECR_REPOSITORY_NAME as string,
    repositoryName: process.env.ECR_REPOSITORY_NAME as string,
  },
  ecs: {
    ecsClusterArn: process.env.ECS_CLUSTER_ARN as string,
    taskDefinitionArn: process.env.ECS_TASK_DEFINITION_ARN as string,
    webhookBaseUrl: process.env.ECS_WEBHOOK_BASE_URL as string,
    telegramAdminId: process.env.ECS_TELEGRAM_ADMIN_ID as string,
  },
  alb: {
    name: process.env.ALB_NAME as string,
    domainName: process.env.ALB_DOMAIN_NAME as string,
    zone: process.env.ALB_HOSTED_ZONE_ID as string,
  },
  rds: {
    dbUser: process.env.RDS_DB_USER as string,
    dbName: process.env.RDS_DB_NAME as string,
    dbPort: parseInt(process.env.RDS_DB_PORT as string),
  },
  route53: {
    name: process.env.ROUTE53_NAME as string,
    domainName: process.env.ROUTE53_DOMAIN_NAME as string,
  },
};

export class AwsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new VPC(this, config.vpc);
    const publicSubnetId = vpc.publicSubnetIds[0];

    new CfnOutput(this, 'publicsubnet Id', {
      value: publicSubnetId,
    });

    // const ecr = new ECR(this, config.ecr);

    const ecs = new ApplicationLoadBalancedECS(this, {
      name: config.alb.name,
      subnetId: publicSubnetId,
      vpc: vpc.vpc,
      // repository: ecr.repository,
      repositoryName: config.ecr.repositoryName,
      domainName: config.alb.domainName,
      zoneId: config.alb.zone,
      ecsArn: config.ecs.ecsClusterArn,
      taskDefinitionArn: config.ecs.taskDefinitionArn,
      webhookBaseUrl: config.ecs.webhookBaseUrl,
      telegramAdminId: config.ecs.telegramAdminId,
    });

    const route53 = new Route53(this, config.route53);

    const rds = new PGRdsInstance(this, {
      prefix: config.projectName,
      user: config.rds.dbUser,
      vpc: vpc.vpc,
      database: config.rds.dbName,
      port: config.rds.dbPort,
      // DB credentials will be saved under this pathname in AWS Secrets Manager
      secretName: `${config.projectName}/rds/postgres/credentials`, // secret pathname
    });
  }
}
