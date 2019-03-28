const http = require('../../http.js');

module.exports = function(RED) {
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

  function validate(config, msg) {
    let out = true;

    if (!config.endpoint) {
      out = false;
    }

    if (isLD(config) && !config.ldContext) {
      out = false;
    }

    if (!msg.payload || !msg.payload.trim()) {
      out = false;
    }

    // Entity Id has to be a URI if LD protocol
    if (isLD(config)) {
      try {
        new URL(msg.payload);
      } catch (e) {
        out = false;
      }
    }

    return out;
  }

  function buildHeaders(config) {
    const headers = Object.create(null);

    if (isLD(config)) {
      const linkHeaderValue = `<${config.ldContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`;
      headers.Link = linkHeaderValue;
      headers.Accept = config.mimeType;
    }

    if (config.service && config.service.trim()) {
      headers['Fiware-Service'] = config.service;
    }

    return headers;
  }

  function NgsiEntityNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      if (!validate(config, msg)) {
        msg.payload = null;
        node.error(
          'Node is not properly configured, entity Id not provided or not a URI'
        );
        return;
      }

      const entityId = msg.payload;

      const endpoint = config.endpoint;
      const mode = config.mode;

      const attrs = config.attrs;

      const parameters = [];

      let resource = `${endpoint}/${apiPrefix(config)}/${entityId}`;

      if (mode === 'keyValues') {
        parameters.push(`options=${mode}`);
      }

      if (attrs && attrs.trim()) {
        parameters.push(`attrs=${attrs}`);
      }

      if (parameters.length > 0) {
        resource += `?${parameters.join('&')}`;
      }

      let response = null;
      try {
        response = await http.get(resource, buildHeaders(config));
      } catch (e) {
        msg.payload = null;
        node.error(`Exception while retrieving entity: ${entityId}: ` + e);
        return;
      }

      const statusCode = response.response.statusCode;
      if (statusCode === 200) {
        msg.payload = response.body;
      } else if (statusCode === 404) {
        msg.payload = null;
        node.error(`Entity ${entityId} not found`);
        return;
      } else {
        msg.payload = null;
        node.error(
          `Entity ${entityId} could not be retrieved. HTTP status code: ${statusCode}`
        );
        return;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Entity', NgsiEntityNode);
};
