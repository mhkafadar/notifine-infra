import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { Subnet } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ECSALBProps {
  name: string;
  subnetId: string;
}

export class ApplicationLoadBalancedECS {
  constructor(scope: Construct, props: ECSALBProps) {
    const loadBalancedFargateService =
      new ApplicationLoadBalancedFargateService(scope, 'Service', {
        memoryLimitMiB: 1024,
        desiredCount: 1,
        cpu: 512,
        taskImageOptions: {
          image: ContainerImage.fromRegistry('mhkafadar/notifine'),
        },
        taskSubnets: {
          subnets: [Subnet.fromSubnetId(scope, 'subnet', props.subnetId)],
        },
        loadBalancerName: props.name,
      });
  }
}
