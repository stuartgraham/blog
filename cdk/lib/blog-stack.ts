import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';


export class BlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // S3 bucket for AWS Instance Scheduler
    const blogBucket = new s3.Bucket(this, 'blogS3Bucket', {
      bucketName: process.env.BUCKET_NAME,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // ACM
    const arn : string = process.env.CERTIFICATE_ARN!;
    const blogAcmCertificate = acm.Certificate.fromCertificateArn(this, 'blogAcmCertificate', arn);

    // Origin Access Identity
    const blogoriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'blogOriginAccessIdentity');
    blogBucket.grantRead(blogoriginAccessIdentity);


    // Cloudfront
    const blogCloudfrontDistro = new cloudfront.Distribution(this, 'blogCFDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(blogBucket) },
      domainNames: ['blog.rstu.xyz'],
      certificate: blogAcmCertificate,
      defaultRootObject: 'index.html',
    });

    // IAM Role for Lambda Edge
    const lambdaEdgeRole = new iam.Role(this, 'LambdaEdgeRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('edgelambda.amazonaws.com'),
        new iam.ServicePrincipal('lambda.amazonaws.com')
        )
    });

    const lambdaEdgePolicy = new iam.Policy(this, 'lambdaEdgePolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          resources: ['arn:aws:logs:*:*:*'],
        })
      ],
    });

    lambdaEdgeRole.attachInlinePolicy(lambdaEdgePolicy)


    // Lambda Function
    const urlRewriterFunction = new lambda.Function(this, 'UrlRewriterFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/url-rewriter')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.seconds(5),
      role: lambdaEdgeRole
    });


    // Cfn Output
    new cdk.CfnOutput(this, 'blogCloudfrontDistributionId', {
      value: blogCloudfrontDistro.distributionId,
      description: 'Distribution ID for blog.rstu.xyz',
      exportName: 'DistributionID',
    });

    new cdk.CfnOutput(this, 'blogCloudfrontDomainName', {
      value: blogCloudfrontDistro.domainName,
      description: 'CF domain name for blog.rstu.xyz',
      exportName: 'DomainName',
    });

  }
}
