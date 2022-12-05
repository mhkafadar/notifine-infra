import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC } from './constructs/vpc';
import { ECR } from './constructs/ecr';
import {ApplicationLoadBalancedECS} from "./constructs/ecs-alb";
require('dotenv').config();

const config = {
  projectName: process.env.PROJECT_NAME,
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_ACCOUNT_REGION,
  },
  vpc: {
    name: process.env.VPC_NAME as string,
  },
  ecr: {
    name: process.env.ECR_REPOSITORY_NAME as string,
  },
  ecs: {

  }
  alb: {
    name: process.env.ALB_NAME as string,
  }
};

export class AwsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ECR(scope, config.ecr);

    const vpc = new VPC(scope, config.vpc);
    const publicSubnetId = vpc.publicSubnetIds[0];

    const ecs = new ApplicationLoadBalancedECS(scope, {
      name: config.alb.name,
      subnetId: publicSubnetId,
    })
  }
}
