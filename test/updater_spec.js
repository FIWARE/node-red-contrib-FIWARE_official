/* eslint-env node, mocha */

const assert = require('chai').assert;

const http = require('../src/http.js');

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/updater/updater.js');
const brokerNode = require('../src/nodes/NGSI/contextbroker/contextbroker.js');

const data = require('./test_data.json');

helper.init(require.resolve('node-red'));

describe('NGSI Updater Node', function() {
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

  before(done => {
    helper.startServer(done);
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
        type: 'NGSI-Updater',
        name: 'tested',
        endpoint: configNode.id
      }
    ];

    helper.load([testedNode, brokerNode], flow, function() {
      const testedNode = helper.getNode('testedNode');
      assert.propertyVal(testedNode, 'name', 'tested');
      done();
    });
  });

  it('should update Entity', function(done) {
    const flow = [
      configNode,
      {
        id: 'testedNode',
        type: 'NGSI-Updater',
        name: 'tested',
        wires: [['helperNode']],
        endpoint: configNode.id,
        protocol: 'V2' // V2 for the time being. LD also supported
      },
      { id: 'helperNode', type: 'helper' }
    ];

    helper.load([testedNode, brokerNode], flow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const statusCode = msg.payload;
          assert.equal(statusCode, 204);
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({ payload: data });
    });
  });
});
