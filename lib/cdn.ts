//
// Copyright (C) 2020 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/easycdn
//

import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_cloudfront as cdn } from 'aws-cdk-lib';
import { aws_cloudfront_origins as origins } from 'aws-cdk-lib';
import { aws_route53 as dns } from 'aws-cdk-lib';
import { aws_route53_targets as target } from 'aws-cdk-lib';

//
export interface CdnProps {
  readonly site: string
  readonly httpVersion?: cdn.HttpVersion
  readonly tlsCertificateArn: string
  readonly bucket?: s3.Bucket
}

//
export class Cdn extends Construct {
  public readonly distribution: cdk.aws_cloudfront.Distribution

  public constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id)

    const origin = props.bucket ?? this.bucket(props.site)
    const zone = this.hostedZone(props.site)
    this.distribution = this.cloudfront(origin, props.httpVersion, props.site, props.tlsCertificateArn)
    this.injectBucketPolicy(origin, this.distribution.distributionId)
    this.cloudfrontDNS(props.site, zone, this.distribution)
  }

  //
  private bucket(bucketName: string): s3.Bucket {
    return new s3.Bucket(this, "Origin", {
      bucketName,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      websiteErrorDocument: 'error.html',
      websiteIndexDocument: 'index.html',
    })
  }

  //
  private hostedZone(site: string): dns.IHostedZone {
    const domainName = site.split('.').slice(1).join('.')
    return dns.HostedZone.fromLookup(this, "HostedZone", {
      domainName
    })
  }

  //
  private cloudfront(
    s3BucketSource: s3.Bucket,
    httpVersion: cdn.HttpVersion | undefined,
    hostname: string,
    acmCertificateArn: string,
  ): cdn.Distribution {
    const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, "TLSCert", acmCertificateArn)

    const dist = new cdn.Distribution(this, "CloudFront", {
      httpVersion,
      defaultBehavior: this.source(s3BucketSource),

      domainNames: [hostname],
      certificate,
      minimumProtocolVersion: cdn.SecurityPolicyProtocol.TLS_V1_2_2021,
      sslSupportMethod: cdn.SSLMethod.SNI,
    })

    return dist
  }

  private injectBucketPolicy(
    s3BucketSource: s3.Bucket,
    distributionId: string
  ) {
    s3BucketSource.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal("cloudfront.amazonaws.com"),
        ],
        actions: ["s3:GetObject"],
        resources: [s3BucketSource.arnForObjects("*")],
        conditions: {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::" + cdk.Aws.ACCOUNT_ID + ":distribution/" + distributionId
          }
        }
      })
    )
  }

  private source(
    s3BucketSource: s3.IBucket,
  ): cdn.BehaviorOptions {
    const originAccessControl = new cdn.S3OriginAccessControl(this, 'AccessControl', {})

    return {
      origin: origins.S3BucketOrigin.withOriginAccessControl(s3BucketSource,
        {
          originAccessControl,
        }),
      viewerProtocolPolicy: cdn.ViewerProtocolPolicy.HTTPS_ONLY,
      // Note: using default caching optimized policy
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized
    }
  }

  //
  //
  private cloudfrontDNS(
    recordName: string,
    zone: dns.IHostedZone,
    cloud: cdn.Distribution,
  ): dns.ARecord {
    return new dns.ARecord(this, "ARecord", {
      recordName,
      target: { aliasTarget: new target.CloudFrontTarget(cloud) },
      ttl: cdk.Duration.seconds(60),
      zone,
    })
  }
}