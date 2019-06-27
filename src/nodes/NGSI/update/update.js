/**
 *
 *   NGSI Updater Node
 *
 *   What it gets from the payload is POSTed to an NGSI(v2, LD) endpoint
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author José M. Cantera
 *
 */

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

  const payload = msg.payload;

  if (!payload) {
    out = false;
  }

  if (typeof payload !== 'string' && typeof payload !== 'object') {
    out = false;
  }

  if (typeof payload === 'string' && !payload.trim()) {
    out = false;
  }

  return out;
}

function buildPayloadV2(config, payload) {
  let data = payload;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(payload);
    } catch (e) {
      throw new Error('Invalid payload. Not valid JSON');
    }
  }

  if (!(typeof data === 'object')) {
    throw new Error('Invalid payload. Not an object nor an Array');
  }

  let entityData = data;
  if (!Array.isArray(data)) {
    entityData = [data];
  }

  const out = {
    actionType: common.getParam('updateMode', config),
    entities: entityData
  };

  return out;
}

// eslint-disable-next-line
function buildPayloadLD(config, payload) {
  // TODO: Build LD payload
  return {};
}

function buildPayload(config, payload) {
  if (common.isLD(config)) {
    return buildPayloadLD(config, payload);
  }

  return buildPayloadV2(config, payload);
}

module.exports = function(RED) {
  function NgsiUpdaterNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const endpointConfig = RED.nodes.getNode(config.endpoint);
    const endpoint = endpointConfig.endpoint;

    node.on('input', async function(msg) {
      if (!validate(config, msg)) {
        msg.payload = null;
        node.error('Node is not properly configured, Entity data not provided');
        return;
      }

      const resource = `${endpoint}/${common.apiPrefix(config)}/op/update`;

      let response = null;
      try {
        const payload = buildPayload(config, msg.payload);

        response = await http.post(
          resource,
          payload,
          common.buildHeaders(endpointConfig)
        );
      } catch (e) {
        msg.payload = null;
        node.error(`Exception while POSTing Entity data: ` + e);
        return;
      }

      const statusCode = response.response.statusCode;
      switch (statusCode) {
        case 200:
        case 204:
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

          console.error(response.body); // eslint-disable-line
          return;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Update', NgsiUpdaterNode);
};
