import { Construct } from 'constructs';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';

interface VPCProps {
  name: string;
}

export class VPC {
  constructor(scope: Construct, props: VPCProps) {
    new Vpc(this, props.name, {
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
          name: 'private_isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
  }
}
