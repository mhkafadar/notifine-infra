import { PublicHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface Route53Props {
  name: string;
  domainName: string;
}

export class Route53 {
  constructor(scope: Construct, props: Route53Props) {
    new PublicHostedZone(scope, props.name + '-HostedZone', {
      zoneName: props.domainName,
    });
  }
}
