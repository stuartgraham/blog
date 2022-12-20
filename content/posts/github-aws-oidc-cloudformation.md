---
title: "AWS/GitHub OIDC Cloudformation"
date: 2022-12-18T12:30:03+00:00
weight: 1
tags: ["cloud", "oidc"]
author: "Stuart Graham"
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
description: "Quickly integrating AWS and GitHub using OIDC"
summary: "Quickly integrating AWS and GitHub using OIDC"
canonicalURL: "https://blog.rstu.xyz/"
disableHLJS: true
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowWordCount: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
cover:
    image: "img/cloudformation.png" # image path/url
    alt: "cloudformation logo" # alt text
    caption: "CloudFormation" # display caption under cover
    relative: false # when using page bundles set this to true
    hidden: true # only hide on current single page
editPost:
    URL: "https://github.com/stuartgraham/blog/content"
    Text: "Suggest edits"
    appendFilePath: true 
---

# Best Practises
GitHub's [documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) outlines the recommendation to use OIDC functionality between various cloud providers, this allows for the use of short level credentials as opposed to statically stored IAM secrets which need to be manaully creates and are prone to proliferation.

Rather than use the manual methods described a better approach it to use a CloudFormation template you can import to your AWS account to quickly form the OIDC connection between the account and a specific repo allowing for secure exchange of credentials between the pair of entities.

Pay attention to, and edit, `ManagedPolicyArns` section where it is recommended to scope this to the least privilege needed.


## CloudFormation Template

```
AWSTemplateFormatVersion: '2010-09-09'
Description: Template to create OIDC Connection


Parameters:
  GitHubOwner:
    Type: String
    Description: Enter Github repo owner
  GitHubRepo:
    Type: String
    Description: Enter Github repo name


Resources:
  IamOidcIdentityProvider:
    Type: AWS::IAM::OIDCProvider
    Properties: 
      ClientIdList: 
        - sts.amazonaws.com
      Tags: 
        - Key: 'Consumer'
          Value: !Sub
            - 'Github Actions access for https://github.com/${RepoOwner}/${RepoName}'
            - RepoOwner: !Ref GitHubOwner
              RepoName: !Ref GitHubRepo
      ThumbprintList: 
        - 6938fd4d98bab03faadb97b34396831e3780aea1
      Url: https://token.actions.githubusercontent.com

  IamOidcIdpRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: GithubOidcRole
      Description: Provides administrator access
      Tags: 
        - Key: 'Consumer'
          Value: !Sub
            - 'Github Actions access for https://github.com/${RepoOwner}/${RepoName}'
            - RepoOwner: !Ref GitHubOwner
              RepoName: !Ref GitHubRepo
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
        - Effect: Allow
          Principal:
            Federated: !Sub
              - 'arn:aws:iam::${AccountID}:oidc-provider/token.actions.githubusercontent.com'
              - AccountID: !Ref AWS::AccountId 
          Action: sts:AssumeRoleWithWebIdentity
          Condition:
            StringLike:
              token.actions.githubusercontent.com:sub: !Sub
                - repo:${RepoOwner}/${RepoName}*:*
                - RepoOwner: !Ref GitHubOwner
                  RepoName: !Ref GitHubRepo

            StringEquals:
              token.actions.githubusercontent.com:aud: sts.amazonaws.com

      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess

```

## GitHub Actions
After the CloudFormation stack is installed you can now use the `aws-actions/configure-aws-credentials` action to transparently call for short lived credentials to be used in your workflows using the many AWS APIs, or perhaps deploy CDK deployments straight from GitHub.

```
- name: Configure AWS Credentials
uses: aws-actions/configure-aws-credentials@v1-node16
with:
    role-to-assume: arn:aws:iam::112233445566:role/GithubOidcRole
    role-session-name: GitHubActions-${{ github.run_id }}
    aws-region: eu-west-1
```