module.exports = {
  // Name to deploy the stack with
  stackDeployName: 'yo1ddns',
  
  
  // Domain name of Route 53 Hosted Zone to update with new IP when
  // requested. If you don't have one, create one. To see your list
  // of zones use:
  // aws route53 list-hosted-zones
  targetRoute53ZoneName: 'example.com',
  
  // List of hostnames allowed to be set/updated. targetRoute53ZoneName
  // must be TLD of all hostnames.
  targetHostnameWhitelist: [
    'dynamicip.example.com'
  ],
  
  
  // *Optional* HTTP Basic Auth username to require for API calls.
  apiAuthUsername: 'changeme',
  
  // *Optional* HTTP Basic Auth password to require for API calls.
  apiAuthPassword: 'CHANGEME',
  
  
  // *Optional* Domain name to access the API. If this value is given an
  // API Gateway Domain Name will be created for the API.
  apiDomainName: 'ddns.example.com',
  
  // *Optional* (Required if apiDomainName given) ARN of ACM Certificate
  // to use for the API Gateway Domain Name. Must cover apiDomainName.
  // If you don't have one, create one. To see your list of certs use:
  // aws acm list-certificates
  apiDomainNameACMCertARN: 'arn:aws:acm:us-east-1:996577705533:certificate/asdf',
  
  // *Optional* Domain name of Route 53 zone that should route to the API.
  // If this value is given, an Alias record which points to the API will
  // be created on the specified zone. Must be the TLD of apiDomainName
  apiDomainNameRoute53ZoneName: 'example.com'
};