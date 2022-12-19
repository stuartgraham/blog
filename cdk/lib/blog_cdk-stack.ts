import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class BlogCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for AWS Instance Scheduler
    const blogBucket = new s3.Bucket(this, 'blogBucket', {
      bucketName: process.env.BUCKET_NAME
    });

    // ACM
    
    // Cloudfront
    
    // IAM Role for Lambda Edge

    // Lambda

    // Test


  }
}
