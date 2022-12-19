#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BlogCdkStack } from '../lib/blog_cdk-stack';

const app = new cdk.App();
new BlogCdkStack(app, 'BlogCdkStack', {
});