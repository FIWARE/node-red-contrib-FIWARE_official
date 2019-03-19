
const http = require("../../http.js");

module.exports = function(RED) {

  const v2Prefix = "v2/entities";

  function NgsiEntityNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", async function(msg) {
      const entityId = msg.payload;

      const endpoint = config.endpoint;
      const service = config.service;

      const resource = `${endpoint}/${v2Prefix}/${entityId}`;

      let response = null;
      try {
        response = await http.get(resource, {
          'Fiware-Service': service
        });
      }
      catch(e) {
        msg.payload = null;
        node.error(`Exception while retrieving entity: ${entityId}`, e);
        return;
      }

      const statusCode = response.response.statusCode;
      if (statusCode === 200) {
        msg.payload = response.body;
      }
      else if (statusCode === 404) {
        msg.payload = null;
        node.error(`Entity ${entityId} not found`);
        return;
      }
      else {
        msg.payload = null;
        node.error(`Entity ${entityId} could not be retrieved. HTTP status code: ${statusCode}`);
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType("NGSIv2-Entity", NgsiEntityNode);
};
