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


function validate(config, msg) {
  let out = true;

  if (!config.endpoint) {
    out = false;
  }

  return out;
}


module.exports = function(RED) {
  function ContextBrokerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    console.log(JSON.stringify(config));

    this.endpoint = config.endpoint;
    this.authendpoint = config.authendpoint;

    this.username = config.username;
    this.password = config.password;
  }

  RED.nodes.registerType('Context-Broker', ContextBrokerNode, {
    credentials: {
      user: {type: "text"},
      password: {type: "password"}
    }
    });
};
