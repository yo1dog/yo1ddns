import * as pathUtil from 'path';


export interface IConfig {
  stackDeployName             : string;
  targetRoute53ZoneName       : string;
  targetHostnameWhitelist     : string[];
  apiAuthUsername             : string;
  apiAuthPassword             : string;
  apiDomainName               : string;
  apiDomainNameACMCertARN     : string;
  apiDomainNameRoute53ZoneName: string;
}

export default async function readConfig(): Promise<{config?: IConfig; configErrMsg?: string}> {
  // read config
  const configFilepath = pathUtil.join(__dirname, '..', 'config.js');
  
  let config;
  try {
    config = require(configFilepath); // eslint-disable-line @typescript-eslint/no-require-imports
  } catch(err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return {configErrMsg: `Config does not exist. Copy /src/config.example.js to /config.js at: ${configFilepath}`};
    }
    throw err;
  }
  
  const stackDeployName              = String(config.stackDeployName              || '').trim();
  const targetRoute53ZoneName        = String(config.targetRoute53ZoneName        || '').trim().replace(/\.$/, '');
  const apiAuthUsername              = String(config.apiAuthUsername              || '').trim();
  const apiAuthPassword              = String(config.apiAuthPassword              || '');
  const apiDomainName                = String(config.apiDomainName                || '').trim().replace(/\.$/, '');
  const apiDomainNameACMCertARN      = String(config.apiDomainNameACMCertARN      || '').trim();
  const apiDomainNameRoute53ZoneName = String(config.apiDomainNameRoute53ZoneName || '').trim().replace(/\.$/, '');
  
  const targetHostnameWhitelistDirty = config.targetHostnameWhitelist;
  const targetHostnameWhitelist = (
    (
      Array.isArray(targetHostnameWhitelistDirty)
      ? targetHostnameWhitelistDirty
      : [targetHostnameWhitelistDirty]
    )
    .map(x => String(x || '').trim().replace(/\.$/, ''))
    .filter(x => x)
  );
  
  if (!stackDeployName) {
    return {configErrMsg: `stackDeployName is required. Please configure in config.js`};
  }
  if (!targetRoute53ZoneName) {
    return {configErrMsg: `targetRoute53ZoneDomainName is required. Please configure in config.js`};
  }
  if (targetHostnameWhitelist.length === 0) {
    return {configErrMsg: `targetHostnameWhitelist must contain at least 1 hostname. Please configure in config.js`};
  }
  for (const hostname of targetHostnameWhitelist) {
    if (!hostname.endsWith(targetRoute53ZoneName)) {
      return {configErrMsg: `targetRoute53ZoneName must be TLD of all hostnames (hostname '${hostname}' does not end with '${targetRoute53ZoneName}'). Please configure in config.js`};
    }
  }
  if (apiDomainName) {
    if (!apiDomainNameACMCertARN) {
      return {configErrMsg: `apiDomainNameACMCertARN is required because apiDomainName was given. Please configure in config.js`};
    }
    if (apiDomainNameRoute53ZoneName) {
      if (!apiDomainName.endsWith(apiDomainNameRoute53ZoneName)) {
        return {configErrMsg: `apiDomainNameRoute53ZoneName is not TLD of apiDomainName ('${apiDomainName}' does not end with '${apiDomainNameRoute53ZoneName}'). Please configure in config.js`};
      }
    }
  }
  
  return {
    config: {
      stackDeployName,
      targetRoute53ZoneName,
      targetHostnameWhitelist,
      apiAuthUsername,
      apiAuthPassword,
      apiDomainName,
      apiDomainNameACMCertARN     : apiDomainName && apiDomainNameACMCertARN,
      apiDomainNameRoute53ZoneName: apiDomainName && apiDomainNameRoute53ZoneName
    }
  };
}