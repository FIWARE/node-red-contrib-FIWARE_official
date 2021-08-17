/**
 *
 *   NGSI Subscriber node
 *
 *   Given an Entity type, attributes and a filter subscribes to the changes
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author José M. Cantera
 *
 */

const http = require('../../../http.js');
const common = require('../../../common.js');
const ngsi = require('../../../ngsi_utils');

function validate(config, payload) {
  let out = true;
  if (!config.endpoint) {
    out = false;
  }

  if (!common.getParam('entityType', config, payload)) {
    out = false;
  }

  if (!common.getParam('notificationEndpoint', config)) {
    out = false;
  }

  return out;
}

function buildSubject(config, payload) {
  const out = Object.create(null);

  const entityTypes = common.getParam('entityType', config, payload);

  if (entityTypes) {
    out.entities = [];

    const entityTypeList = entityTypes.split(',');
    entityTypeList.forEach(eType => {
      out.entities.push({
        type: eType,
        idPattern: '.*'
      });
    });
  }

  const watchedAttributes = common.getParam(
    'watchedAttributes',
    config,
    payload
  );

  let condition = null;

  if (watchedAttributes) {
    condition = Object.create(null);
    out.condition = condition;

    condition.attrs = [];

    const attributeList = watchedAttributes.split(',');

    attributeList.forEach(attr => {
      condition.attrs.push(attr);
    });
  }

  const q = common.getParam('q', config, payload);

  if (q) {
    if (!condition) {
      condition = Object.create(null);
      out.condition = condition;
    }
    condition.expression = {
      q
    };
  }

  return out;
}

function buildNotification(config) {
  const out = Object.create(null);

  out.http = {
    url: common.getParam('notificationEndpoint', config)
  };

  const notifAttrs = common.getParam('notificationAttributes', config);

  if (notifAttrs) {
    out.attrs = [];

    const attrs = notifAttrs.split(',');

    attrs.forEach(attr => {
      out.attrs.push(attr);
    });
  }

  const mode = common.getParam('notificationMode', config);

  out.attrsFormat = mode;

  return out;
}

function buildSubscription(config, payload) {
  const subscription = buildSubscriptionV2(config, payload);

  if (config.protocol === 'LD') {
    return ngsi.ldSubscription(
      subscription,
      common.getParam('ldContext', config),
      common.getParam('mimeType', config)
    );
  }

  return subscription;
}

function buildSubscriptionV2(config, payload) {
  const out = Object.create(null);

  out.subject = buildSubject(config, payload);
  out.notification = buildNotification(config);

  return out;
}

async function buildHeaders(config, endpointConfig) {
  const headers = Object.create(null);

  if (common.isLD(config)) {
    headers['Content-Type'] = 'application/ld+json';
  } else {
    headers['Content-Type'] = 'application/json';
  }

  if (endpointConfig.service && endpointConfig.service.trim()) {
    headers['Fiware-Service'] = endpointConfig.service;
  }

  if (endpointConfig.servicepath && endpointConfig.servicepath.trim()) {
    headers['Fiware-ServicePath'] = endpointConfig.servicepath;
  }


  if (endpointConfig.securityEnabled) {
    const token = await endpointConfig.getToken();
    headers['X-Auth-Token'] = token;
  }

  return headers;
}

module.exports = function(RED) {
  function NgsiSubscriberNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const endpointConfig = RED.nodes.getNode(config.endpoint);
    const endpoint = endpointConfig.endpoint;

    node.on('input', async function(msg) {
      if (!validate(config, msg.payload)) {
        msg.payload = null;
        node.error('Node is not properly configured, entity type not provided');
        return;
      }

      const subscription = buildSubscription(config, msg.payload);

      let response = null;
      try {
        response = await http.post(
          `${endpoint}/${common.apiPrefix(config)}/subscriptions/`,
          subscription,
          await buildHeaders(config, endpointConfig)
        );
      } catch (e) {
        msg.payload = { e };
        node.error(`Exception while creating subscription: ` + e, msg);
        return;
      }

      const statusCode = response.response.statusCode;
      const locationHeader = response.response.headers.location;
      let subscriptionId = null;

      switch (statusCode) {
        case 201:
          if (locationHeader) {
            const elements = locationHeader.split('/');
            subscriptionId = elements[elements.length - 1];
          }

          msg.payload = {
            statusCode,
            subscriptionId
          };
          node.send(msg);
          break;
        default:
          msg.payload = null;
          node.error(
            `Query returned HTTP status code in error: ${statusCode}. Payload: ${JSON.stringify(
              response.body
            )}`
          );
      }
    });
  }

  RED.nodes.registerType('NGSI-Subscription', NgsiSubscriberNode);
};
