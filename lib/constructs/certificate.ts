import { Construct } from 'constructs';
import { CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ApplicationListenerCertificate } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface CertificateProps {
  name: string;
  domainName: string;
}

// export class Certificate {
//   constructor(scope: Construct, props: CertificateProps) {
//     const cert = new ApplicationListenerCertificate(
//       scope,
//       props.name + '-Certificate',
//       {
//         // domainName: props.domainName,
//         // validation: CertificateValidation.fromDns(),
//       },
//     );
//   }
// }
