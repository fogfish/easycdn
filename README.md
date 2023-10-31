# EasyCDN

EasyCDN is AWS CDK L3 Construct that takes care about configuration of the infrastructure required to securely deliver content through AWS CloudFront. 

[![Build Status](https://github.com/fogfish/easycdn/workflows/build/badge.svg)](https://github.com/fogfish/easycdn/actions/)
[![Git Hub](https://img.shields.io/github/last-commit/fogfish/easycdn.svg)](https://github.com/fogfish/easycdn)
[![Coverage Status](https://coveralls.io/repos/github/fogfish/easycdn/badge.svg?branch=main)](https://coveralls.io/github/fogfish/scud?branch=main)
[![npm](https://img.shields.io/npm/v/easycdn)](https://www.npmjs.com/package/easycdn)


## Inspiration

AWS CloudFront is a convenient approach for static content distribution. Unfortunately, it requires a boilerplate AWS CDK code to bootstrap the provisioning of required resources. This L3 Construct implements a high-order components on top of AWS CDK that simplify the deployment.

It is implemented as using jsii, making it available 

## Getting started

The latest version of the library is available at its `main` branch. All development, including new features and bug fixes, take place on the `main` branch using forking and pull requests as described in contribution guidelines.

```bash
npm install --save easycdn
```

### Example of usage

```js
import * as easy from 'easycdn'
const stack = new cdk.Stack(app, 'test', { /* ... */ })

// creation of CDN requires definition of 
//  - site name
//  - tls certificate arn
const cdn = new easy.Cdn(stack, 'CDN',
  'cdn.example.com',
  'arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx-xx...xxxx',
)
```

## HowTo Contribute

The project is [MIT](https://github.com/fogfish/easycdn/blob/master/LICENSE) licensed and accepts contributions via GitHub pull requests:

1. Fork it and clone 
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

```bash
git clone https://github.com/fogfish/easycdn
cd scud

npm install
npm run build
npm run test
npm run lint
```

## HowTo Release Runtime

```bash
npm run build
npm run package

cp -R dist/go/easycdn github.com/fogfish/go-cdk-easycdn
```

## License

[![See LICENSE](https://img.shields.io/github/license/fogfish/easycdn.svg?style=for-the-badge)](LICENSE)