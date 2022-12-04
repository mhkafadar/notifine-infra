#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsCdkStack } from '../lib/aws-cdk-stack';
require('dotenv').config();

const app = new cdk.App();
new AwsCdkStack(app, process.env.PROJECT_NAME as string, {
  description: process.env.PROJECT_DESCRIPTION,
});
