/* eslint-disable no-process-env */
const authUsername = process.env.AUTH_USERNAME;
const authPassword = process.env.AUTH_PASSWORD;
/* eslint-enable no-process-env */

/**
 * @typedef ICreds
 * @property {string} [username]
 * @property {string} [password]
 */


// NOTE: have to use callback. Cant use promises in authorizer for some reason
/** @type {import('aws-lambda').CustomAuthorizerHandler} */
exports.handler = (event, context, callback) => {
  const creds = getCreds(event);
  
  if (!checkAuth(creds)) {
    return callback('Unauthorized');
  }
  
  return callback(null, createPolicy(event, creds.username));
};

/**
 * @param {import('aws-lambda').CustomAuthorizerEvent} event 
 * @returns {ICreds}
 */
function getCreds(event) {
  // get the auth header
  const headers = (event.headers || {});
  const authHeaderVal = (
    headers.Authorization ||
    headers.authorization ||
    headers.AUTHORIZATION ||
    ''
  ).trim();
  if (!authHeaderVal) return {};
  
  // extract the encoded auth token
  const headerMatch = /^Basic\s+([a-z0-9+/=]+)$/i.exec(authHeaderVal);
  if (!headerMatch) return {};
  
  const encodedAuthToken = headerMatch[1];
  
  // decode the auth token
  const authToken = Buffer.from(encodedAuthToken, 'base64').toString('utf8');
  
  // extract credentials from auth token
  const tokenMatch = /^(.*?)(:(.*))?$/i.exec(authToken);
  if (!tokenMatch) return {};
  
  const username = tokenMatch[1];
  const password = tokenMatch[3];
  
  return {
    username,
    password
  };
}

/**
 * @param {ICreds} creds
 * @returns {boolean} 
 */
function checkAuth(creds) {
  return (
    (creds.username || '') === (authUsername || '') && // eslint-disable-line no-process-env
    (creds.password || '') === (authPassword || '')    // eslint-disable-line no-process-env
  );
}

/**
 * @param {import('aws-lambda').CustomAuthorizerEvent} event 
 * @param {string} [username] 
 * @returns {import('aws-lambda').CustomAuthorizerResult}
 */
function createPolicy(event, username) {
  return {
    principalId: username || 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'allow',
        Action: 'execute-api:Invoke',
        Resource: [event.methodArn]
      }]
    }
  };
}