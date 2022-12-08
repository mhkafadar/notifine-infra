import { Construct } from 'constructs';
import { User } from 'aws-cdk-lib/aws-iam';
import {
  AuthorizationToken,
  IRepository,
  Repository,
} from 'aws-cdk-lib/aws-ecr';

interface ECRProps {
  name: string;
}

export class ECR {
  repository: IRepository;
  constructor(scope: Construct, props: ECRProps) {
    const user = new User(scope, props.name + '-user');
    AuthorizationToken.grantRead(user);

    this.repository = new Repository(scope, props.name + '-Repository');
  }
}
