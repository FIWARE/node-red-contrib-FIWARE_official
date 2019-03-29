const http = require('../../../http.js');
const common = require('../../../common.js');

module.exports = function(RED) {
  function validate(config, payload) {
    let out = true;
    if (!config.endpoint) {
      out = false;
    }

    if (!common.getParam('entityType', config, payload)) {
      out = false;
    }

    return out;
  }

  function buildParameters(config, payload) {
    const out = [];

    out.push(`type=${common.getParam('entityType', config, payload)}`);

    if (config.mode && config.mode === 'keyValues') {
      out.push(`options=${config.mode}`);
    }

    const attrs = common.getParam('attrs', config, payload);
    if (attrs) {
      out.push(`attrs=${attrs}`);
    }

    const q = common.getParam('q', config, payload);
    if (q) {
      out.push(`q=${q}`);
    }

    return out.join('&');
  }

  function NgsiDatasetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      if (!validate(config, msg.payload)) {
        msg.payload = null;
        node.error('Node is not properly configured, entity type not provided');
        return;
      }

      const endpoint = config.endpoint;
      const parameters = buildParameters(config, msg.payload);

      const response = await http.get(
        `${endpoint}/${common.apiPrefix(config)}?${parameters}`,
        common.buildHeaders(config)
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

  RED.nodes.registerType('NGSI-Dataset', NgsiDatasetNode);
};
