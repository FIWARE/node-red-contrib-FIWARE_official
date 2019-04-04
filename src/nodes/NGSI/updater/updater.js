const http = require('../../../http.js');
const common = require('../../../common.js');

function validate(config, msg) {
  let out = true;

  if (!config.endpoint) {
    out = false;
  }

  if (common.isLD(config) && !config.ldContext) {
    out = false;
  }

  if (
      !msg.payload ||
      !(typeof msg.payload === 'string') ||
      !msg.payload.trim()
  ) {
    out = false;
  }

  return out;
}

function buildPayloadV2(config, payload) {
  let data = null;

  try {
    data = JSON.parse(payload);
  }
  catch(e) {
      throw "Invalid payload. Not valid JSON";
  }

  if (!(typeof data === 'object')) {
    throw "Invalid payload. Not an object nor an Array";
  }

  let entityData = data;
  if (!Array.isArray(data)) {
      entityData = [data];
  }

  const out = {
    'actionType': 'append',
    'entities': entityData
  };

  return out;
}


function buildPayloadLD(config, payload) {
  return {};
}


module.exports = function(RED) {

  function NgsiUpdaterNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      if (!validate(config, msg)) {
        msg.payload = null;
        node.error(
          'Node is not properly configured, Entity data not provided'
        );
        return;
      }

      const endpoint = config.endpoint;

      let resource = `${endpoint}/${common.apiPrefix(config)}/op/update`;

      let response = null;
      try {
        const payload = buildPayloadV2(config, msg.payload);

        response = await http.post(resource, payload, common.buildHeaders(config));
      } catch (e) {
        msg.payload = null;
        node.error(`Exception while POSTing Entity data: ` + e);
        return;
      }

      const statusCode = response.response.statusCode;
      switch (statusCode) {
        case 200:
          msg.payload = statusCode;
          break;
        case 404:
          msg.payload = null;
          node.error(`Entity data not valid`);
          return;
        default:
          msg.payload = null;
          node.error(
              `Entity data could not be updated. HTTP status code: ${statusCode}`
          );
          return;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Updater', NgsiUpdaterNode);
};
