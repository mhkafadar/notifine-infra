import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import {
  Cluster,
  ContainerImage,
  Secret,
  TaskDefinition,
} from 'aws-cdk-lib/aws-ecs';
import { IVpc, SecurityGroup, Subnet } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { ISecret, Secret as SMSecret } from 'aws-cdk-lib/aws-secretsmanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IRepository, Repository } from 'aws-cdk-lib/aws-ecr';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { HostedZone } from 'aws-cdk-lib/aws-route53';

interface ECSALBProps {
  name: string;
  subnetId: string;
  vpc: IVpc;
  // repository: IRepository;
  repositoryName: string;
  domainName: string;
  zoneId: string;
  ecsArn: string;
  taskDefinitionArn: string;
  webhookBaseUrl: string;
  telegramAdminId: string;
}

export class ApplicationLoadBalancedECS {
  constructor(scope: Construct, props: ECSALBProps) {
    const gitlabTeloxideSecret = new SMSecret(scope, 'GITLAB_TELOXIDE_SECRET');
    const githubTeloxideSecret = new SMSecret(scope, 'GITHUB_TELOXIDE_SECRET');
    const beepTeloxideSecret = new SMSecret(scope, 'BEEP_TELOXIDE_SECRET');
    const trelloTeloxideSecret = new SMSecret(scope, 'TRELLO_TELOXIDE_SECRET');
    const dbUrlSecret = new SMSecret(scope, 'DB_URL_SECRET');

    const cluster = new Cluster(scope, props.name + '-Cluster-id', {
      clusterName: props.name + '-Cluster-name',
      vpc: props.vpc,
    });

    const ecsSecurityGroup = new SecurityGroup(
      scope,
      `${props.name}-ecs-egress`,
      {
        vpc: props.vpc,
        securityGroupName: `${props.name}-ecs-egress-sg`,
        allowAllOutbound: true,
      },
    );

    // get ecr repository from uri
    const repository = Repository.fromRepositoryName(
      scope,
      'repository',
      props.repositoryName,
    );

    const loadBalancedFargateService =
      new ApplicationLoadBalancedFargateService(
        scope,
        props.name + '-id-ALBedECS',
        {
          loadBalancerName: props.name + '-ALB-name',
          memoryLimitMiB: 1024,
          desiredCount: 1,
          cpu: 512,
          assignPublicIp: true,
          taskImageOptions: {
            secrets: {
              GITLAB_TELOXIDE_TOKEN:
                Secret.fromSecretsManager(gitlabTeloxideSecret),
              GITHUB_TELOXIDE_TOKEN:
                Secret.fromSecretsManager(githubTeloxideSecret),
              BEEP_TELOXIDE_TOKEN:
                Secret.fromSecretsManager(beepTeloxideSecret),
              TRELLO_TELOXIDE_TOKEN:
                Secret.fromSecretsManager(trelloTeloxideSecret),
              DATABASE_URL: Secret.fromSecretsManager(dbUrlSecret),
            },
            environment: {
              WEBHOOK_BASE_URL: props.webhookBaseUrl,
              TELEGRAM_ADMIN_CHAT_ID: props.telegramAdminId,
            },
            image: ContainerImage.fromEcrRepository(repository),
            containerPort: 8080,
          },
          cluster,
          taskSubnets: {
            subnets: [Subnet.fromSubnetId(scope, 'subnet', props.subnetId)],
          },
          securityGroups: [ecsSecurityGroup],
          protocol: ApplicationProtocol.HTTPS,
          domainName: props.domainName,
          domainZone: HostedZone.fromHostedZoneAttributes(scope, 'zone', {
            hostedZoneId: props.zoneId,
            zoneName: props.domainName,
          }),
          redirectHTTP: true,
        },
      );

    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/health',
    });

    // loadBalancedFargateService.taskDefinition.defaultContainer.

    // const cluster = Cluster.fromClusterArn(scope, 'Cluster', props.ecsArn);
    //
    // const taskDefinition = TaskDefinition.fromTaskDefinitionArn(
    //   scope,
    //   'TaskDefinition',
    //   props.taskDefinitionArn,
    // )
    //
    // taskDefinition.
  }
}
