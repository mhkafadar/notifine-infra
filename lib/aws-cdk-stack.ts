import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC } from './constructs/vpc';
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
};

export class AwsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new VPC(this, {
      name: config.vpc.name,
    });
  }
}
