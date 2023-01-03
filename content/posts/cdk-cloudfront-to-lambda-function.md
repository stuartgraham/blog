---
title: "Cloudfront and Lambda Function URLs"
date: 2023-01-03T12:30:03+00:00
weight: 1
# aliases: ["/first"]
tags: ["cdk", "cloud", "aws", "lambda", "cloudfront"]
author: "Stuart Graham"
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: false
description: "Put Cloudfront infront of Lambda Function URLs using CDK"
summary: "Put Cloudfront infront of Lambda Function URLs using CDK"
canonicalURL: "https://blog.rstu.xyz/"
disableHLJS: false
disableShare: false
hideSummary: false
searchHidden: false
ShowReadingTime: false
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: false
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "<image path/url>" # image path/url
    alt: "<alt text>" # alt text
    caption: "<text>" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
---

# A different way of looking at web apps
In April 2022, AWS quietly announced support for Function URLs for Lambda. Function URLs allows for innovation of the function using a generated URL. You can use this run dynamic back end code and return JSON or synthesised HTML, using a template engine like Jinja. While AWS try not to undercut their API Gateway service, this service is really useful for complex web applications right through to very small utility applications. Using the AWS free tier carefully you can host web applications for close-to-free, so its well worth investigating.

One problem you will run again is that you may want to run these with an easy to remember URL and to do so with a SSL certificate to match this name, this is where Cloudfront and Certificate Manager comes in.

## The Lambda Function 
You can build out a Lambda function in CDK in a standard way, in this example I am building a Python based function using some self created layers for Jinja2 and Requests.

```
// Lambda Function - Web Interface
const WebInterfaceFunction = new lambda.Function(this, 'WebInterfaceFunction', {
    code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/web-interface')),
    handler: 'main.handler',
    layers: [simpleJsonLayer, requestsLayer, jinja2Layer],
    runtime: lambda.Runtime.PYTHON_3_9,
    timeout: cdk.Duration.seconds(3),
    architecture: lambda.Architecture.ARM_64,
    environment: {
    DYNAMODB_TABLE : webAppTable.tableName
    },
    logRetention: logs.RetentionDays.ONE_WEEK,
});
```

## Add a Function URL
Now add the Function URL to the function, in this case I am running with no auth, meaning anyone can call for the function. Function URLs also support IAM SigV4 authentication if you have this requirement.

```
// Function URL right to SSM Parameter in friendly for Cloudfront manner
const WebInterfaceFunctionUrl = WebInterfaceFunction.addFunctionUrl({
    authType: lambda.FunctionUrlAuthType.NONE,
});
```

A point to note here is that Cloudfront has a lot of requirements on US-EAST-1 region whilst you may deploy this function in a region closer to home. A way to mitigate this is to post the generated URL to a SSM Parameter for later reference in a US-EAST-1 stack that will deploy Cloudfront. CDK SSM Parameters do not support region specificity so you can mitigate this by using the `@pepperize/cdk-ssm-parameters-cross-region` library. In this example I wrangle the host name from the tokenised URL and sent it to a region specific SSM parameter using the aforementioned library.

```
const functionHostUrl = cdk.Fn.select(2, cdk.Fn.split('/', WebInterfaceFunctionUrl.url));

new ssmcross.StringParameter(this, "WebInterfaceFunctionHostUrlSsmParam", {
    region: "eu-west-1",
    parameterName: "/webapp/functionurlhost",
    stringValue: functionHostUrl,
});
```

## The Cloudfront Distribution
Now we have a function with an URL hosted in eu-west-1, lets give it a friendly name, a certificate and a Cloudfront distrubution.

In this example I have manually created the ACM certificate and referencing the ARN as an environment variable, you can use CDK to do this automatically at build time. 
```
// ACM
const arn : string = process.env.CERTIFICATE_ARN!;
const webAppAcmCertificate = acm.Certificate.fromCertificateArn(this, 'WebAppAcmCertificate', arn);

```

The we grab the SSM parameter from EU-WEST-1 using the same library as above.
```
// SSM Lookup
const originUrl = ssmcross.StringParameter.fromStringParameterName(this, "OriginUrl", 
    "eu-west-1", 
    "/webapp/functionurlhost");
```
Lastly we build the Cloudfront distribution, target the Function URL and disabled caching (my function is all dynamic content).

```
// Cloudfront
const busCloudfrontDistro = new cloudfront.Distribution(this, 'busCFDistribution', {
    defaultBehavior: { 
    origin: new origins.HttpOrigin(originUrl.stringValue),
    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED
    },
    domainNames: ['webapp.rstu.xyz'],
    certificate: webAppAcmCertificate
});
```  

