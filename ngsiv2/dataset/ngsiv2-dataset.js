const http = require('http');

module.exports = function(RED) {
  const v2Prefix = '/v2/entities/';

  function NgsiDatasetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      const entityId = msg.entityId;

      const endpoint = config.endpoint;

      const response = await http.get(endpoint + v2Prefix + entityId);

      if (response.response.statusCode === 200) {
        msg.payload = response.body;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSIv2-Dataset', NgsiDatasetNode);
};
