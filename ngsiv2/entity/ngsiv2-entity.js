const http = require('../../http.js');

module.exports = function(RED) {
  const v2Prefix = 'v2/entities';

  function validate(config, msg) {
    let out = true;
    if (!config.endpoint) {
      out = false;
    }

    if (!msg.payload || !msg.payload.trim()) {
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
        node.error('Node is not properly configured or no entity Id provided');
        return;
      }

      const entityId = msg.payload;

      const endpoint = config.endpoint;
      const service = config.service;
      const mode = config.mode;

      let resource = `${endpoint}/${v2Prefix}/${entityId}`;

      if (mode === 'keyValues') {
        resource += `?options=${mode}`;
      }

      const headers = Object.create(null);
      if (service && service.trim()) {
        headers['Fiware-Service'] = service;
      }

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

  RED.nodes.registerType('NGSIv2-Entity', NgsiEntityNode);
};
