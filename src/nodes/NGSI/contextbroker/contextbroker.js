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

const http = require('../../../http.js');
const common = require('../../../common.js');

module.exports = function(RED) {
  function ContextBrokerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.endpoint = common.getParam('endpoint', config);
    node.service = common.getParam('service', config);

    node.idmEndpoint = common.getParam('idmEndpoint', config);
    node.username = common.getParam('username', node.credentials);
    node.password = common.getParam('password', node.credentials);

    node.client_id = common.getParam('client_id', node.credentials);
    node.client_secret = common.getParam('client_secret', node.credentials);

    node.securityEnabled = false;

    if (
      node.idmEndpoint &&
      node.username &&
      node.password &&
      node.client_id &&
      node.client_secret
    ) {
      node.securityEnabled = true;
    }

    // Current token being used to issue API requests
    this.currentToken = null;
    // Expiration date for the token
    this.tokenExpires = null;

    this.getToken = async function() {
      const idm = this.idmEndpoint;

      if (this.currentToken && this.tokenExpires && this.tokenExpires.getTime() > Date.now()) {
        return currentToken;
      }

      this.currentToken = null;

      const idmApiEndpoint = `${idm}/oauth2/token`;

      console.log(`${this.client_id}:${this.client_secret}`);

      const authBearer = Buffer.from(
        `${this.client_id}:${this.client_secret}`
      ).toString('base64');

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authBearer}`
      };

      const username = encodeURIComponent(this.username);
      const password = encodeURIComponent(this.password);

      const payload = `username=${username}&password=${password}&grant_type=password`;

      let response = null;
      try {
        response = await http.post(idmApiEndpoint, payload, headers);

        const statusCode = response.response.statusCode;

        if (statusCode === 200) {
          this.currentToken = response.response.headers['X-Subject-Token'];

          this.tokenExpires = Date.parse(
            response.body.token && response.body.token.expires_at
          );
        } else {
          this.error(`Error while obtaining token. Status Code: ${statusCode}`);
        }
      } catch (e) {
        this.error(`Exception while obtaining token: ${e}`);
        this.currentToken = null;
      }

      return this.currentToken;
    };
  }

  RED.nodes.registerType('Context-Broker', ContextBrokerNode, {
    credentials: {
      username: { type: 'text' },
      password: { type: 'password' },
      client_id: { type: 'text' },
      client_secret: { type: 'password' }
    }
  });
};
