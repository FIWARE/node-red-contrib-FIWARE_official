const ldPrefix = 'ngsi-ld/v1';

const v2Prefix = 'v2';

function apiPrefix(config) {
  if (isLD(config)) {
    return ldPrefix;
  }

  return v2Prefix;
}

function isLD(config) {
  return config.protocol === 'LD';
}

function addLinkHeader(config, headers) {
  const linkHeaderValue = `<${
    config.ldContext
  }>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`;
  headers.Link = linkHeaderValue;
}

async function buildQueryHeaders(config, endpointConfig) {
  console.log('Build headers');

  const headers = Object.create(null);

  if (isLD(config)) {
    addLinkHeader(config, headers);
    headers.Accept = config.mimeType;
  }

  if (endpointConfig.service && endpointConfig.service.trim()) {
    headers['Fiware-Service'] = endpointConfig.service;
  }

  console.log(endpointConfig.securityEnabled);

  if (endpointConfig.securityEnabled === true) {
    console.log('Security is enabled');
    console.log(await endpointConfig.getToken());
  }

  return headers;
}

function getParam(paramName, config, msg) {
  let paramValue = msg && msg[paramName] && msg[paramName].trim();

  if (!paramValue) {
    paramValue = config && config[paramName] && config[paramName].trim();
  }

  return paramValue;
}

module.exports = {
  apiPrefix,
  isLD,
  buildQueryHeaders,
  addLinkHeader,
  getParam
};
