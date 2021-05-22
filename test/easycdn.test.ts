//
// Copyright (C) 2020 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/easycdn
//

import * as assert from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'
import * as easy from '../lib'

it('create CDN infrastructure', () => {
  const app = new cdk.App()
  const stack = new cdk.Stack(app, 'test', {
    env: { account: '000000000000', region: 'us-east-1'}
  })

  pure.join(stack,
    easy.CDN(
      'cdn.example.com',
      'arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xx...xxxx',
    )
  )

  const requires: {[key: string]: number} = {
    'AWS::S3::Bucket': 1,
    'AWS::S3::BucketPolicy': 1,
    'AWS::CloudFront::CloudFrontOriginAccessIdentity': 1,
    'AWS::CloudFront::Distribution': 1,
    'AWS::Route53::RecordSet': 1,
  }

  Object.keys(requires).forEach(
    key => assert.expect(stack).to(
      assert.countResources(key, requires[key])
    )
  )
})
