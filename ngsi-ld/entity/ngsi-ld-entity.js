const http = require('../../http.js');

module.exports = function(RED) {
  const ldPrefix = 'ngsi-ld/v1/entities';

  function validate(config, msg) {
    let out = true;

    if (!config.endpoint) {
      out = false;
    }

    if (!config.ldContext) {
      out = false;
    }

    if (!msg.payload || !msg.payload.trim()) {
      out = false;
    }

    // Entity Id has to be a URI
    try {
      new URL(msg.payload);
    } catch (e) {
      out = false;
    }

    return out;
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

      const ldContext = config.ldContext;

      const mimeType = config.mimeType;

      const attrs = config.attrs;

      const parameters = [];

      let resource = `${endpoint}/${ldPrefix}/${entityId}`;

      if (mode === 'keyValues') {
        parameters.push(`options=${mode}`);
      }

      if (attrs && attrs.trim()) {
        parameters.push(`attrs=${attrs}`);
      }

      if (parameters.length > 0) {
        resource += `?${parameters.join('&')}`;
      }

      const linkHeaderValue = `<${ldContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`;
      const headers = {
        Link: linkHeaderValue,
        Accept: mimeType
      };

      let response = null;
      try {
        response = await http.get(resource, headers);
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

  RED.nodes.registerType('NGSI-LD-Entity', NgsiEntityNode);
};
