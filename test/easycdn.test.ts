//
// Copyright (C) 2020 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/easycdn
//

import * as cdk from 'aws-cdk-lib';
import { assertions as assert } from 'aws-cdk-lib';
import * as easycdn from '../lib'

it('create CDN infrastructure', () => {
  const app = new cdk.App()
  const stack = new cdk.Stack(app, 'test', {
    env: { account: '000000000000', region: 'us-east-1' }
  })

  new easycdn.Cdn(stack, "CDN", {
    site: 'cdn.example.com',
    tlsCertificateArn: 'arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xx...xxxx',
  })

  const requires: { [key: string]: number } = {
    'AWS::S3::Bucket': 1,
    'AWS::S3::BucketPolicy': 1,
    'AWS::CloudFront::OriginAccessControl': 1,
    'AWS::CloudFront::Distribution': 1,
    'AWS::Route53::RecordSet': 1,
  }

  const cnf = assert.Template.fromStack(stack)

  Object.keys(requires).forEach(
    key => cnf.resourceCountIs(key, requires[key])
  )
})
