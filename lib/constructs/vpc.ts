import { Construct } from 'constructs';
import {
  FlowLogDestination,
  FlowLogTrafficType,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
  IpAddresses,
  IVpc,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

interface VPCProps {
  name: string;
}

export class VPC {
  publicSubnetIds: string[];
  vpc: IVpc;
  constructor(scope: Construct, props: VPCProps) {
    // const cwLogs = new LogGroup(scope, 'Log', {
    //   logGroupName: '/aws/vpc/flowlogs',
    // });
    // log group from name
    const cwLogs = LogGroup.fromLogGroupName(scope, 'Log', '/aws/vpc/flowlogs');

    const vpc = new Vpc(scope, props.name, {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'privateisolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        s3: {
          destination: FlowLogDestination.toCloudWatchLogs(cwLogs),
          trafficType: FlowLogTrafficType.ALL,
        },
      },
    });

    // add secret manager to vpc
    vpc.addInterfaceEndpoint('SecretManager', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
    });

    // add ecr to vpc
    vpc.addInterfaceEndpoint('ECR', {
      service: InterfaceVpcEndpointAwsService.ECR,
      privateDnsEnabled: true,
    });

    this.publicSubnetIds = vpc.publicSubnets.map((subnet) => subnet.subnetId);
    this.vpc = vpc;
  }
}
