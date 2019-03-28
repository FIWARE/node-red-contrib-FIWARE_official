const http = require('../../http.js');

module.exports = function(RED) {
  const v2Prefix = '/v2/entities/';

  function validate(config) {
    let out = true;
    if (!config.endpoint) {
      out = false;
    }

    if (!config.entityType || config.entityType.trim() === '') {
      out = false;
    }

    return out;
  }

  function buildParameters(config) {
    const out = [];

    out.push(`type=${config.entityType}`);

    if (config.mode && config.mode === 'keyValues') {
      out.push(`options=${config.mode}`);
    }

    if (config.attrs && config.attrs.trim()) {
      out.push(`attrs=${config.attrs}`);
    }

    if (config.q && config.q.trim()) {
      out.push(`q=${config.q}`);
    }

    return out.join('&');
  }

  function buildHeaders(config) {
    const headers = Object.create(null);
    if (config.service && config.service.trim()) {
      headers['Fiware-Service'] = config.service;
    }

    return headers;
  }

  function NgsiDatasetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      if (!validate(config)) {
        msg.payload = null;
        node.error('Node is not properly configured, entity type not provided');
        return;
      }

      const endpoint = config.endpoint;
      const parameters = buildParameters(config);

      const response = await http.get(
        `${endpoint}/${v2Prefix}?${parameters}`,
        buildHeaders(config)
      );

      const statusCode = response.response.statusCode;

      switch (statusCode) {
        case 200:
          msg.payload = response.body;
          node.send(msg);
          break;
        default:
          msg.payload = null;
          node.error(`Query returned HTTP status code in error: ${statusCode}`);
      }
    });
  }

  RED.nodes.registerType('NGSIv2-Dataset', NgsiDatasetNode);
};
