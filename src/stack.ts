import {IConfig} from './readConfig';
import * as pathUtil from 'path';
import * as cdk            from '@aws-cdk/core';
import * as apigateway     from '@aws-cdk/aws-apigateway';
import * as acm            from '@aws-cdk/aws-certificatemanager';
import * as lambda         from '@aws-cdk/aws-lambda';
import * as route53        from '@aws-cdk/aws-route53';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as iam            from '@aws-cdk/aws-iam';

const functionsDir = pathUtil.join(__dirname, 'functions');


export class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, name: string, config: IConfig, props?: cdk.StackProps) {
    super(scope, name, props);
    
    const targetHostedZone = route53.HostedZone.fromLookup(this, 'targetHostedZone', {
      domainName: config.targetRoute53ZoneName
    });
    const targetHostedZoneId = targetHostedZone.hostedZoneId.replace(/^\/?hostedzone\//, '');
    
    const updateFunction = new lambda.Function(this, 'updateFunction', {
      description: 'yo1ddns Update Function',
      code: new lambda.AssetCode(pathUtil.join(functionsDir, 'updateFunction')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.seconds(60),
      environment: {
        ROUTE53_ZONE_ID   : targetHostedZoneId,
        HOSTNAME_WHITELIST: config.targetHostnameWhitelist.join(',')
      },
      initialPolicy: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'route53:ChangeResourceRecordSets',
          'route53:ListResourceRecordSets'
        ],
        resources: [`arn:aws:route53:::hostedzone/${targetHostedZoneId}`]
      })]
    });
    
    const apiAuthorizerFunction = new lambda.Function(this, 'apiAuthorizerFunction', {
      description: 'yo1ddns API Authorizer Function',
      code: new lambda.AssetCode(pathUtil.join(functionsDir, 'apiAuthorizerFunction')),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        AUTH_USERNAME: config.apiAuthUsername,
        AUTH_PASSWORD: config.apiAuthPassword
      }
    });
    
    const api = new apigateway.RestApi(this, 'api', {
      restApiName: 'yo1ddnsAPI',
      description: 'yo1ddns API',
      deploy: true,
      deployOptions: {
        description: 'yo1ddns API Production Stage',
        stageName: 'prod'
      },
      domainName: config.apiDomainName? {
        domainName: config.apiDomainName,
        endpointType: apigateway.EndpointType.REGIONAL,
        certificate: acm.Certificate.fromCertificateArn(this, 'apiDomainNameACMCert', config.apiDomainNameACMCertARN)
      } : undefined,
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });
    
    if (config.apiDomainName && config.apiDomainNameRoute53ZoneName) {
      new route53.ARecord(this, 'apiRecordSet', {
        zone: route53.HostedZone.fromLookup(this, 'apiHostedZone', {
          domainName: config.apiDomainNameRoute53ZoneName
        }),
        recordName:config.apiDomainName + '.',
        target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api))
      });
    }
    
    new apigateway.CfnGatewayResponse(this, 'apiMissingAuthTokenResponse', {
      restApiId: api.restApiId,
      responseType: 'MISSING_AUTHENTICATION_TOKEN',
      statusCode: '404'
    });
    new apigateway.CfnGatewayResponse(this, 'apiUnathorizedResponse', {
      restApiId: api.restApiId,
      responseType: 'UNAUTHORIZED',
      statusCode: '401',
      responseParameters: {
        'gatewayresponse.header.WWW-Authenticate': '\'Basic realm=yo1ddns\''
      }
    });
    
    const apiAuthorizer = new apigateway.CfnAuthorizer(this, 'apiAuthorizer', {
      restApiId: api.restApiId,
      name: 'yo1ddnsAPIAuthorizer',
      type: 'REQUEST',
      identitySource: 'method.request.header.Authorization',
      authorizerResultTtlInSeconds: 0,
      authorizerUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${apiAuthorizerFunction.functionArn}/invocations`
    });
    apiAuthorizerFunction.addPermission('apiAuthorizerLambdaPermission', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/authorizers/${apiAuthorizer.ref}`
    });
    
    api.root
    .addMethod('GET', new apigateway.MockIntegration({
      requestTemplates: {
        'application/json': JSON.stringify({statusCode: 200})
      },
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            Message: `Welcome to the yo1ddns API. Use GET /nic/update?hostname=&myip= to update the IP for a hostname. HTTP Basic Auth is required if configured.`
          })
        }
      }]
    }), {
      methodResponses: [{statusCode: '200'}]
    });
    
    api.root
    .addResource('nic')
    .addResource('update')
    .addMethod('GET', new apigateway.LambdaIntegration(updateFunction), {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: {
        authorizerId: apiAuthorizer.ref
      }
    });
    
    new cdk.CfnOutput(this, 'apiURLOutput', {
      description: 'URL of the API',
      value: `${
        api.domainName
        ? 'https://' + api.domainName.domainName
        : api.url
      }/nic/update`
    });
  }
}
