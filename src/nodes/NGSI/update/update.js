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

const JSON_MTYPE = 'application/json';

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
  const entityData = getEntityData(payload);

  const out = {
    actionType: common.getParam('updateModev2', config),
    entities: entityData
  };

  return out;
}

function getEntityData(payload) {
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

  return entityData;
}

// eslint-disable-next-line
function buildPayloadLD(config, payload) {
  return getEntityData(payload);
}

function buildPayload(config, payload) {
  if (common.isLD(config)) {
    return buildPayloadLD(config, payload);
  }

  return buildPayloadV2(config, payload);
}

function getResource(config) {
  if (!common.isLD(config)) {
    return 'op/update';
  }

  const updateMode = common.getParam('updateMode', config);

  const operationMap = {
    'upsert-replace': {
      resource: 'upsert',
      params: ''
    },
    'upsert-update': {
      resource: 'upsert',
      params: 'options=update'
    },
    update: {
      resource: 'update',
      params: ''
    },
    'update-noOverwrite': {
      resource: 'update',
      params: 'options=noOverwrite'
    }
  };

  const operationInfo = operationMap[updateMode];

  return `entityOperations/${operationInfo.resource}?${operationInfo.params}`;
}

async function buildHeaders(config, endpointConfig) {
  const headers = Object.create(null);

  if (common.isLD(config)) {
    headers['Content-Type'] = config.mimeType;

    if (config.mimeType === JSON_MTYPE) {
      common.addLinkHeader(config, headers);
    }
  } else {
    headers['Content-Type'] = JSON_MTYPE;
  }

  if (endpointConfig.service && endpointConfig.service.trim()) {
    headers['Fiware-Service'] = endpointConfig.service;
  }

  if (endpointConfig.securityEnabled) {
    const token = await endpointConfig.getToken();
    headers['X-Auth-Token'] = token;
  }

  return headers;
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

      const resource = `${endpoint}/${common.apiPrefix(config)}/${getResource(
        config
      )}`;

      let response = null;
      try {
        const payload = buildPayload(config, msg.payload);

        response = await http.post(
          resource,
          payload,
          await buildHeaders(config, endpointConfig)
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
