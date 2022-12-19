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


export class BlogCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // temp
    // S3 bucket for AWS Instance Scheduler
    const blogBucket = new s3.Bucket(this, 'blogBucket', {
      bucketName: process.env.BUCKET_NAME
    });

    // ACM
    const arn : string = process.env.CERTIFICATE_ARN!;
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', arn);

    // Cloudfront
    new cloudfront.Distribution(this, 'blogCFDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(blogBucket) },
    });

    // IAM Role for Lambda Edge
    const lambdaEdgePolicy = new iam.PolicyStatement({
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resources: ['arn:aws:logs:*:*:*'],
    });

    // Lambda Function
    const urlRewriterFunction = new lambda.Function(this, 'UrlRewriterFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/url-rewriter')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.minutes(5)
    });
    // Service role - IAM Policy attachment
    urlRewriterFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'UrlRewriterFunctionInlinePolicy', {
        statements: [lambdaEdgePolicy],
      }),
    );

    new cdk.CfnOutput(this, 'bucketName', {
      value: blogBucket.bucketName,
      description: 'blog bucket',
      exportName: 'bucket_name',
    });

  }
}
