/**
 *
 *   NGSI Converter Node
 *
 *   It converts a NGSI(v2,LD) entity to the other NGSI(v2,LD) format.
 *   E.g. v2 --> LD || LD --> v2
 *
 *   Copyright (c) 2019 FIWARE Foundation e.V.
 *
 *   @author Bjarke Hou Kammersgaard @ Alexandra Institute A/S
 *
 */

const converter = require('../../../ngsi-converter.js');

module.exports = function(RED) {
  function NgsiConverterNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function(msg) {

      if(!msg.payload) {
        node.error('No payload provided');
        return;
      }

      // Validate JSON format
      let entity = msg.payload;

      if(typeof msg.payload === 'string') {
        try {
          entity = JSON.parse(msg.payload);
        } catch (SyntaxError) {
          node.error('Input was not valid');
          return;
        }
      }

      // Convert
      let convertedEntity = null;
      convertedEntity = converter.v2ToLD(entity, node);

      // Send
      msg.payload = convertedEntity;
      node.send(msg);
    });
  }

  RED.nodes.registerType('NGSI-Converter', NgsiConverterNode);
};
