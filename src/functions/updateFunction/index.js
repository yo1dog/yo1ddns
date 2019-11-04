/* eslint-disable no-process-env */
const route53ZoneId     = (process.env.ROUTE53_ZONE_ID    || '').trim();
const hostnameWhitelist = (process.env.HOSTNAME_WHITELIST || '').split(',').map(x => x.trim().replace(/\.$/, '')).filter(x => x);
/* eslint-enable no-process-env */

process.on('unhandledRejection', err => {
  throw err;
});

const net = require('net');
const AWS = require('aws-sdk');


/** @type {import('aws-lambda').APIGatewayProxyHandler} */
exports.handler = async (event) => {
  const route53Client = new AWS.Route53();
  
  // check env config
  if (!route53ZoneId) {
    return createErrorReponse(500, 'Invalid configuration: Route 53 Host Zone ID not configured. Set ROUTE53_ZONE_ID env var.');
  }
  if (hostnameWhitelist.length === 0) {
    return createErrorReponse(500, 'Invalid configuration: Hostname whitelist empty. Set HOSTNAME_WHITELIST env var.');
  }
  
  // validate the params
  const queryParams = (event.queryStringParameters || {});
  const hostnameToUpdate = (queryParams.hostname || '').trim();
  const newIP            = (queryParams.myip     || '').trim();
  
  if (!hostnameToUpdate) return createErrorReponse(400, 'hostname empty or missing');
  if (!newIP   ) return createErrorReponse(400, 'myip empty or missing');
  
  const ipVersion = net.isIP(newIP);
  if (!ipVersion) return createErrorReponse(400, 'myip is not a valid IP address');
  
  if (!hostnameWhitelist.includes(hostnameToUpdate)) {
    return createErrorReponse(400, `unrecognized hostname. Must be one of: ${hostnameWhitelist.join(',')}`);
  }
  
  // get the record type
  const dnsRecordType = (
    ipVersion === 4? 'A' :
    ipVersion === 6? 'AAAA' :
    null
  );
  if (!dnsRecordType) return createErrorReponse(400, `myip is of unsupported IP version ${ipVersion}`);
  
  // upsert the Route 53 record set
  await route53Client.changeResourceRecordSets({
    HostedZoneId: route53ZoneId,
    ChangeBatch: {
      Changes: [{
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: hostnameToUpdate,
          Type: dnsRecordType,
          TTL: 60,
          ResourceRecords: [{
            Value: newIP
          }]
        }
      }]
    }
  }).promise();
  
  return {
    statusCode: 200,
    body: 'good'
  };
};


/**
 * @param {number} statusCode
 * @param {string} message
 * @returns {import('aws-lambda').APIGatewayProxyResult}
 */
function createErrorReponse(statusCode, message) {
  return {
    statusCode,
    body: JSON.stringify({message})
  };
}