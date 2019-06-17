/* eslint-env node, mocha */

const assert = require('chai').assert;

const http = require('../src/http.js');

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/entity/entity.js');

const data = require('./test_data.json');

helper.init(require.resolve('node-red'));

describe('NGSI Entity Node', function() {
  const ENDPOINT = 'http://localhost:1026';
  const TENANT = 'test';
  const HEADERS = {
    'Fiware-Service': TENANT
  };

  const configNode = {
    id: 'testBroker',
    name: 'broker',
    type: 'Context-Broker',
    endpoint: ENDPOINT,
    service: TENANT
  };

  const entityFlow = [
    configNode,
    {
      id: 'testedNode',
      type: 'NGSI-Entity',
      name: 'tested',
      wires: [['helperNode']],
      endpoint: configNode.id,
      protocol: 'V2' // V2 for the time being. LD also supported
    },
    { id: 'helperNode', type: 'helper' }
  ];

  before(done => {
    http.post(`${ENDPOINT}/v2/entities/`, data, HEADERS).then(() => {
      helper.startServer(done);
    });
  });

  afterEach(function(done) {
    helper.unload();
    done();
  });

  after(function(done) {
    http.del(`${ENDPOINT}/v2/entities/${data.id}`, HEADERS).then(() => {
      helper.stopServer(done);
    });
  });

  it('should be loaded', function(done) {
    const flow = [
      configNode,
      {
        id: 'testedNode',
        type: 'NGSI-Entity',
        name: 'tested',
        endpoint: configNode.id
      }
    ];

    helper.load(testedNode, flow, function() {
      try {
        const testedNode = helper.getNode('testedNode');
        console.log(testedNode);
        assert.propertyVal(testedNode, 'name', 'tested');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should retrieve Entity', function(done) {
    const entityId =
      'urn:ngsi-ld:AgriCrop:df72dc57-1eb9-42a3-88a9-8647ecc954b4';

    helper.load(testedNode, entityFlow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const entity = JSON.parse(msg.payload);
          assert.propertyVal(entity, 'id', entityId);
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({ payload: entityId });
    });
  });

  it('should retrieve nothing', function(done) {
    const entityId = 'urn:ngsi-ld:AgriCrop:xx';

    helper.load(testedNode, entityFlow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function() {
        done('Something retrieved!!');
      });

      testedNode.on('call:error', () => {
        done();
      });

      testedNode.receive({ payload: entityId });
    });
  });
});
