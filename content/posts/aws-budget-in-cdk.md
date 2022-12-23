---
title: "AWS Budgets in CDK"
date: 2022-12-23T12:30:03+00:00
weight: 1
# aliases: ["/first"]
tags: ["all"]
author: "Stuart Graham"
showToc: true
TocOpen: false
draft: false
hidemeta: false
comments: false
description: "Create an AWS Budget in CDK"
summary: "Create an AWS Budget in CDK"
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

# Budgets
A good starting position with any new AWS account is to decide a budget for spend and to get notifications in place as you meet, approach or exceed this threshold. AWS provide some predictive analysis of you spend patterns too and can catch early problems before they spiral into bill shock and you are contacting their support teams with the begging bowl. 

Here is a snippet to quickly set up a $100 budget in CDK. 
```
    const awsBudgetTopic = new sns.Topic(this, 'BudgetSnsTopic', {
      displayName: 'My AWS Budget',
    });

    awsBudgetTopic.addSubscription(new subscriptions.EmailSubscription(
      'joe@bloggs.com'
    ))

    const cfnBudgetProps : budgets.CfnBudgetProps = {
        budget: {
          timeUnit: 'MONTHLY',
          budgetType: 'COST',
          budgetName: 'Base Budget',
          budgetLimit: {
            amount: 100,
            unit: 'USD',
          }
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: awsBudgetTopic.topicArn,
            },
          ],
        },
      ],
    };
    const baseBudget = new budgets.CfnBudget(this, 'BaseAwsBudget', cfnBudgetProps)
```