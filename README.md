# yo1ddns

Dynamic DNS (DDNS) powered by AWS Lambda and Route 53. Easy to deploy. Nearly free to run.

Provides an API powered by API Gateway and 2 small Lambda functions. Updates DNS records in Route 53. Built with AWS CDK/CloudFormation for 1 click deployment and updates.

The API provides the same interface as DynDNS (dyn.com) so it *should* work as a drop-in replacement.


## Build and Deploy

```bash
# install dependencies
npm install --production

# configure
cp ./src/config.example.js ./config.js
nano ./config.js

# deploy stack to AWS
cdk deploy # optional flag: --profile aws-profile-to-use
```

## Requirements

 - npm
 - npx (`npm i -g npx`)
 - cdk (`npm i -g aws-cdk`) or `npx cdk`

## Development

```bash
# install dev dependencies
npm install
```

The meat is in `./src/stack.ts` and `./src/functions/`. Everthing at root is project configuration.

## Useful commands

 - `cdk deploy`  deploy this stack to your default AWS account/region
 - `cdk diff`    compare deployed stack with current state
 - `cdk synth`   emits the synthesized CloudFormation template

Use `--profile` flag to use an AWS profile other than `default`.