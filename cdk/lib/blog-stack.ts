import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';


export class BlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // S3 bucket for blog
    const blogBucket = new s3.Bucket(this, 'blogS3Bucket', {
      bucketName: process.env.BUCKET_NAME,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // ACM
    const arn : string = process.env.CERTIFICATE_ARN!;
    const blogAcmCertificate = acm.Certificate.fromCertificateArn(this, 'blogAcmCertificate', arn);

    // Origin Access Identity
    const blogOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'blogOriginAccessIdentity');
    blogBucket.grantRead(blogOriginAccessIdentity);

    // Cloudfront Function
    const urlRewriterCfFunction = new cloudfront.Function(this, "UrlRewriterCfFunction", {
      code: cloudfront.FunctionCode.fromFile({
        filePath: (path.join(__dirname, '../cloudfront-function/url-rewriter/main.js'))
      }),
    });

    // Cloudfront errors
    const error403: cloudfront.ErrorResponse = {
      httpStatus: 403,
      responseHttpStatus: 404,
      responsePagePath: '/404.html',
      ttl: cdk.Duration.minutes(30),
    }
    const error404: cloudfront.ErrorResponse = {
      httpStatus: 404,
      responseHttpStatus: 404,
      responsePagePath: '/404.html',
      ttl: cdk.Duration.minutes(30),
    }
    const error503: cloudfront.ErrorResponse = {
      httpStatus: 503,
      responseHttpStatus: 404,
      responsePagePath: '/404.html',
      ttl: cdk.Duration.minutes(30),
    }

    // Cloudfront
    const blogCloudfrontDistro = new cloudfront.Distribution(this, 'blogCFDistribution', {
      defaultBehavior: { 
        origin: new origins.S3Origin(blogBucket),
        functionAssociations: [
          {
            function: urlRewriterCfFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          }
        ],
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      errorResponses: [error403, error404, error503],
      domainNames: ['blog.rstu.xyz'],
      certificate: blogAcmCertificate,
      defaultRootObject: 'index.html',
      comment: 'blog.rstu.xyz'
    });

    // Cfn Output
    new cdk.CfnOutput(this, 'blogCloudfrontDistributionId', {
      value: blogCloudfrontDistro.distributionId,
      description: 'Distribution ID for blog.rstu.xyz',
      exportName: 'BlogDistributionID',
    });

    new cdk.CfnOutput(this, 'blogCloudfrontDomainName', {
      value: blogCloudfrontDistro.domainName,
      description: 'CF domain name for blog.rstu.xyz',
      exportName: 'BlogDomainName',
    });

  }
}
