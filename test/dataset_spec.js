/* eslint-env node, mocha */

const assert = require('chai').assert;

const http = require('../src/http.js');

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/dataset/dataset.js');
const brokerNode = require('../src/nodes/NGSI/contextbroker/contextbroker.js');

const data = require('./test_data.json');

helper.init(require.resolve('node-red'));

describe('NGSI Dataset Node', function() {
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

  const retrievalFlow = [
    configNode,
    {
      id: 'testedNode',
      type: 'NGSI-Dataset',
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
        type: 'NGSI-Dataset',
        name: 'tested',
        endpoint: configNode.id
      }
    ];

    helper.load([testedNode, brokerNode], flow, function() {
      try {
        const testedNode = helper.getNode('testedNode');
        assert.propertyVal(testedNode, 'name', 'tested');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should retrieve Data', function(done) {
    const entityType = data.type;
    const q = 'name==Wheat';
    const attrs = 'name';

    helper.load([testedNode, brokerNode], retrievalFlow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const retrievedData = JSON.parse(msg.payload);
          assert.lengthOf(retrievedData, 1);
          assert.propertyVal(retrievedData[0], 'id', data.id);
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({
        payload: {
          entityType,
          q,
          attrs
        }
      });
    });
  });

  it('should not retrieve Data', function(done) {
    const entityType = data.type;
    const q = 'name==xx';

    helper.load([testedNode, brokerNode], retrievalFlow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const retrievedData = JSON.parse(msg.payload);
          assert.lengthOf(retrievedData, 0);
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({
        payload: {
          entityType,
          q
        }
      });
    });
  });
});
