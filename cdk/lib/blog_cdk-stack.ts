import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class BlogCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for AWS Instance Scheduler
    const blogBucket = new s3.Bucket(this, 'blogBucket', {
      bucketName: process.env.BUCKET_NAME
    });

    // ACM
    const arn = process.env.CERTIFICATE_ARN;
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', arn);

    // Cloudfront
    new cloudfront.Distribution(this, 'blogCFDistribution', {
      defaultBehavior: { origin: new origins.S3Origin(blogBucket) },
    });

    // IAM Role for Lambda Edge

    // Lambda

    new cdk.CfnOutput(this, 'bucketName', {
      value: blogBucket.bucketName,
      description: 'blog bucket',
      exportName: 'bucket_name',
    });

  }
}
