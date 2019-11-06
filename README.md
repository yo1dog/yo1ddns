# yo1ddns

Dynamic DNS (DDNS) powered by AWS Lambda and Route 53. Easy to deploy. Nearly free to run.

Provides an API powered by API Gateway and 2 small Lambda functions. Updates DNS records in Route 53. Built with AWS CDK/CloudFormation for 1 click deployment and updates.

The API provides the same interface as DynDNS (dyn.com) so it *should* work as a drop-in replacement.


## 1-Click Installation
[Create AWS CloudFormation Stack](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Fs3.amazonaws.com%2Fs3.yo1.dog%2Fcloudformation%2Fyo1ddns%2Fv1.0.0%2Fyo1ddns.template.json&stackName=yo1ddns&param_apiAuthPassword=CHANGME&param_apiAuthUsername=changeme&param_apiDomainName=ddns.example.com&param_apiDomainNameACMCertARN=&param_apiDomainNameRoute53ZoneId=&param_targetHostnameWhitelist=dynamicip.example.com&param_targetRoute53ZoneId=)

## Or Build and Deploy the CDK App

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
 - cdk (`npm i -g aws-cdk`) or use `npx cdk`

## Development

```bash
# install dev dependencies
npm install
```

The meat is in `/src/stack.ts` and `/src/functions/`. Everthing at root is project configuration.

 Everything in `/standalone` relates to creating the standalone CloudFormation template (modified version of the generated template that is meant to be used with CloudFormation directly and not through CDK). You probably don't need anything in there unless you are releasing standalone templates.

## Useful commands

 - `cdk deploy`  deploy this stack to your default AWS account/region
 - `cdk diff`    compare deployed stack with current state
 - `cdk synth`   emits the synthesized CloudFormation template

Use `--profile` flag to specify an AWS profile other than `default`.