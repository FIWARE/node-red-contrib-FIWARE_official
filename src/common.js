const ldPrefix = 'ngsi-ld/v1/entities';

const v2Prefix = 'v2/entities';

function apiPrefix(config) {
  if (isLD(config)) {
    return ldPrefix;
  }

  return v2Prefix;
}

function isLD(config) {
  return config.protocol === 'LD';
}

function buildHeaders(config) {
  const headers = Object.create(null);

  if (isLD(config)) {
    const linkHeaderValue = `<${
      config.ldContext
    }>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`;
    headers.Link = linkHeaderValue;
    headers.Accept = config.mimeType;
  }

  if (config.service && config.service.trim()) {
    headers['Fiware-Service'] = config.service;
  }

  return headers;
}

function getParam(paramName, config, msg) {
  let paramValue = msg && msg[paramName] && msg[paramName].trim();

  if (!paramValue) {
    paramValue = config[paramName] && config[paramName].trim();
  }

  return paramValue;
}

module.exports = {
  apiPrefix,
  isLD,
  buildHeaders,
  getParam
};
