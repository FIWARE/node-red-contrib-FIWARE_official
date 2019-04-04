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

  // Entity Id has to be a URI if LD protocol
  if (common.isLD(config)) {
    try {
      new URL(msg.payload);
    } catch (e) {
      out = false;
    }
  }

  return out;
}

function buildParameters(config, payload) {
  const parameters = [];

  const mode = config.mode;

  const attrs = config.attrs;

  if (mode === 'keyValues') {
    parameters.push(`options=${mode}`);
  }

  if (attrs && attrs.trim()) {
    parameters.push(`attrs=${attrs}`);
  }

  return parameters.join('&');
}

module.exports = function(RED) {

  function NgsiEntityNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', async function(msg) {
      if (!validate(config, msg)) {
        msg.payload = null;
        node.error(
          'Node is not properly configured, entity Id not provided or not a URI'
        );
        return;
      }

      const entityId = msg.payload;
      const endpoint = config.endpoint;

      let resource = `${endpoint}/${common.apiPrefix(config)}/${entityId}`;

      const parameters = buildParameters(config, msg.payload);

      if (parameters.length > 0) {
        resource += `?${parameters}`;
      }

      let response = null;
      try {
        response = await http.get(resource, common.buildHeaders(config));
      } catch (e) {
        msg.payload = null;
        node.error(`Exception while retrieving entity: ${entityId}: ` + e);
        return;
      }

      const statusCode = response.response.statusCode;
      switch (statusCode) {
        case 200:
          msg.payload = response.body;
          break;
        case 404:
          msg.payload = null;
          node.error(`Entity ${entityId} not found`);
          return;
        default:
          msg.payload = null;
          node.error(
              `Entity ${entityId} could not be retrieved. HTTP status code: ${statusCode}`
          );
          return;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Entity', NgsiEntityNode);
};
