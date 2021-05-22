//
// Copyright (C) 2020 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/easycdn
//

import * as cdk from '@aws-cdk/core'
import * as pure from 'aws-cdk-pure'
import * as cdn from '@aws-cdk/aws-cloudfront'
import * as target from '@aws-cdk/aws-route53-targets'
import * as s3 from '@aws-cdk/aws-s3'
import * as dns from '@aws-cdk/aws-route53'

export const CDN = (
  site: string,
  tlsCertificateArn: string,
): pure.IPure<s3.Bucket> => 
  pure.use({
    origin: Origin(site),
    zone: HostedZone(site.split('.').slice(1).join('.')),
    access: AccessIdentity(),
  })
  .flatMap(x => ({
    cdn: CloudFront(x.origin, x.access, site, tlsCertificateArn),
  }))
  .flatMap(x => ({
    dns: CloudFrontDNS(site, x.zone, x.cdn)
  }))
  .yield('origin')

//
//
const Origin = (bucketName: string): pure.IPure<s3.Bucket> => {
  const Content = (): s3.BucketProps => ({
    bucketName,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
    websiteErrorDocument: 'error.html',
    websiteIndexDocument: 'index.html',
  })
  return pure.iaac(s3.Bucket)(Content)
}

//
//
const HostedZone = (domainName: string): pure.IPure<dns.IHostedZone> => {
  const awscdkIssue4592 = (parent: cdk.Construct, id: string, props: dns.HostedZoneProviderProps): dns.IHostedZone => (
    dns.HostedZone.fromLookup(parent, id, props)
  )
  const iaac = pure.include(awscdkIssue4592) // dns.HostedZone.fromLookup
  const SiteHostedZone = (): dns.HostedZoneProviderProps => ({ domainName })
  return iaac(SiteHostedZone)
}

//
//
const AccessIdentity = (): pure.IPure<cdn.OriginAccessIdentity> => {
  const fAccessIdentity = (): cdn.OriginAccessIdentityProps => ({})

  return pure.iaac(cdn.OriginAccessIdentity)(fAccessIdentity)
}

//
//
const CloudFront = (
  s3BucketSource: s3.IBucket,
  originAccessIdentity: cdn.IOriginAccessIdentity,
  hostname: string,
  acmCertificateArn: string,
): pure.IPure<cdn.CloudFrontWebDistribution> => {
  const fCloudFront = (): cdn.CloudFrontWebDistributionProps => ({
    httpVersion: cdn.HttpVersion.HTTP1_1,
    originConfigs: [
      Source(s3BucketSource, originAccessIdentity),
    ],
    viewerCertificate: {
      aliases: [ hostname ],
      props: {
        acmCertificateArn,
        minimumProtocolVersion: cdn.SecurityPolicyProtocol.TLS_V1_2_2018,
        sslSupportMethod: cdn.SSLMethod.SNI,
      },
    },
    viewerProtocolPolicy: cdn.ViewerProtocolPolicy.HTTPS_ONLY,
    // geoRestriction: [],
  })

  return pure.iaac(cdn.CloudFrontWebDistribution)(fCloudFront)
}

const Source = (
  s3BucketSource: s3.IBucket,
  originAccessIdentity: cdn.IOriginAccessIdentity,
): cdn.SourceConfiguration => ({
  behaviors: [
    {
      defaultTtl: cdk.Duration.hours(24),
      forwardedValues: {queryString: true},
      isDefaultBehavior: true,
      maxTtl: cdk.Duration.hours(24),
      minTtl: cdk.Duration.seconds(0),
    },
  ],
  s3OriginSource: {
    s3BucketSource,
    originAccessIdentity,
  },
})

//
//
const CloudFrontDNS = (
  recordName: string,
  zone: dns.IHostedZone,
  cloud: cdn.CloudFrontWebDistribution,
): pure.IPure<dns.ARecord> => {
  const SiteDNS  = (): dns.ARecordProps => ({
    recordName,
    target: { aliasTarget: new target.CloudFrontTarget(cloud) },
    ttl: cdk.Duration.seconds(60),
    zone,
  })
  return pure.iaac(dns.ARecord)(SiteDNS)
}
