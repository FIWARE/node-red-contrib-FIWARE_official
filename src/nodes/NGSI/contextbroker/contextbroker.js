/**
 *
 *   NGSI Context Broker config Node
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author José M. Cantera
 *
 *
 */

module.exports = function(RED) {
  function ContextBrokerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.endpoint = config.endpoint;
    node.service = config.service;

    node.idmEndpoint = config.idmEndpoint;
    node.username = config.username;
    node.password = config.password;
  }

  RED.nodes.registerType('Context-Broker', ContextBrokerNode, {
    credentials: {
      user: { type: 'text' },
      password: { type: 'password' }
    }
  });
};
