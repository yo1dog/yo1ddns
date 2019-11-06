import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {Stack} from './stack';
import readConfig from './readConfig';

(async () => {
  const {config, configErrMsg} = await readConfig();
  if (!config) {
    console.error(configErrMsg);
    return process.exit(1);
  }
  
  const app = new cdk.App();
  new Stack(app, 'yo1ddns', config, {
    stackName: config.stackDeployName,
    description: 'yo1ddns stack',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT, // eslint-disable-line no-process-env
      region : process.env.CDK_DEFAULT_REGION   // eslint-disable-line no-process-env
    }
  });
  return;
})()
.catch(err => {
  console.error(err);
  process.exit(1);
});