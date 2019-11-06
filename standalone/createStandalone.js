/* eslint-disable no-template-curly-in-string */
const version           = process.argv[2];
const lambdaS3Bucket    = process.argv[3];
const lambdaS3KeyPrefix = process.argv[4];

const template = require('../cdk.out/yo1ddns.template.json');

/** @type {{[key: string]: {logicalId: string; resource: any}} */
const resourceMap = {};
for (const [logicalId, resource] of Object.entries(template.Resources)) {
  resourceMap[resource.Metadata['aws:cdk:path']] = {
    logicalId,
    resource: template.Resources[logicalId]
  };
}

template.Description += ` v${version}`;
template.Parameters = {
  targetRoute53ZoneId: {
    Type: 'AWS::Route53::HostedZone::Id',
    Description: 'Route 53 Hosted Zone to update with new IP when requested. If you don\'t have one, create one.'
  },
  targetHostnameWhitelist: {
    Type: 'CommaDelimitedList',
    Description: 'List of hostnames allowed to be set/updated. targetRoute53ZoneName must be TLD of all hostnames.'
  },
  apiAuthUsername: {
    Type: 'String',
    Description: '*Optional* HTTP Basic Auth username to require for API calls.',
  },
  apiAuthPassword: {
    Type: 'String',
    Description: '*Optional* HTTP Basic Auth password to require for API calls.',
  },
  apiDomainName: {
    Type: 'String',
    Description: '*Optional* Domain name to access the API. If this value is given an API Gateway Domain Name will be created for the API.',
  },
  apiDomainNameACMCertARN: {
    Type: 'String',
    Description: '*Optional* (Required if apiDomainName given) ARN of ACM Certificate to use for the API Gateway Domain Name. Must cover apiDomainName. If you don\'t have one, create one.',
  },
  apiDomainNameRoute53ZoneId: {
    Type: 'AWS::Route53::HostedZone::Id',
    Description: '*Optional* Route 53 zone that should route to the API. If this value is given, an Alias record which points to the API will be created on the specified zone. Must be the TLD of apiDomainName'
  }
};

template.Conditions = {
  createAPIDomain: {
    'Fn::Not': [{'Fn::Equals': [{Ref: 'apiDomainName'}, '']}]
  },
  createAPIRoute53Record: {
    'Fn::And': [
      {'Condition': 'createAPIDomain'},
      {'Fn::Not': [{'Fn::Equals': [{Ref: 'apiDomainNameRoute53ZoneId'}, '']}]}
    ]
  }
};

resourceMap['yo1ddns/updateFunction/ServiceRole/DefaultPolicy/Resource'].resource
.Properties.PolicyDocument.Statement[0].Resource = {
  'Fn::Sub': 'arn:aws:route53:::hostedzone/${targetRoute53ZoneId}'
};

resourceMap['yo1ddns/updateFunction/Resource'].resource
.Properties.Code = {
  S3Bucket: lambdaS3Bucket,
  S3Key: `${lambdaS3KeyPrefix}/updateFunction.zip`
};
resourceMap['yo1ddns/updateFunction/Resource'].resource
.Properties.Environment.Variables = {
  ROUTE53_ZONE_ID: {Ref: 'targetRoute53ZoneId'},
  HOSTNAME_WHITELIST: {'Fn::Join': [',', {Ref: 'targetHostnameWhitelist'}]}
};

resourceMap['yo1ddns/apiAuthorizerFunction/Resource'].resource
.Properties.Code = {
  S3Bucket: lambdaS3Bucket,
  S3Key: `${lambdaS3KeyPrefix}/apiAuthorizerFunction.zip`
};
resourceMap['yo1ddns/apiAuthorizerFunction/Resource'].resource
.Properties.Environment.Variables = {
  AUTH_USERNAME: {Ref: 'apiAuthUsername'},
  AUTH_PASSWORD: {Ref: 'apiAuthPassword'}
};

resourceMap['yo1ddns/api/CustomDomain/Resource'].resource
.Properties.DomainName = {Ref: 'apiDomainName'};
resourceMap['yo1ddns/api/CustomDomain/Resource'].resource
.Properties.RegionalCertificateArn = {Ref: 'apiDomainNameACMCertARN'};
resourceMap['yo1ddns/api/CustomDomain/Resource'].resource
.Condition = 'createAPIDomain';

resourceMap[Object.keys(resourceMap).find(path => path.startsWith('yo1ddns/api/CustomDomain/Map'))].resource
.Condition = 'createAPIDomain';

resourceMap['yo1ddns/apiRecordSet/Resource'].resource
.Properties.Name = {Ref: 'apiDomainName'};
resourceMap['yo1ddns/apiRecordSet/Resource'].resource
.Properties.HostedZoneId = {Ref: 'apiDomainNameRoute53ZoneId'};
resourceMap['yo1ddns/apiRecordSet/Resource'].resource
.Condition = 'createAPIRoute53Record';

template.Outputs = {
  APIUrl: {
    Description: 'yo1ddns API URL',
    Value: {
      'Fn::Sub': ['https://${apiDomainName}/nic/update', {
        apiDomainName: {
          'Fn::If': [
            'createAPIRoute53Record',
            {Ref: resourceMap['yo1ddns/apiRecordSet/Resource'].logicalId},
            {'Fn::Sub': (
              '${' +
              resourceMap['yo1ddns/api/Resource'].logicalId +
              '}.execute-api.${AWS::Region}.${AWS::URLSuffix}/${' +
              resourceMap['yo1ddns/api/DeploymentStage.prod/Resource'].logicalId +
              '}'
            )}
          ]
        }
      }]
    }
  }
};

Object.values(resourceMap).forEach(x => delete x.resource.Metadata);

console.log(JSON.stringify(template, null, 2));