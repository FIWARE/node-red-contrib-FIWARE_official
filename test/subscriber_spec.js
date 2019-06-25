/* eslint-env node, mocha */

const assert = require('chai').assert;

const http = require('../src/http.js');

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/subscriber/subscriber.js');
const brokerNode = require('../src/nodes/NGSI/contextbroker/contextbroker.js');

helper.init(require.resolve('node-red'));

describe('NGSI Subscriber Node', function() {
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

  let subscriptionId = null;

  before(done => {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload();

    if (subscriptionId) {
      http
        .del(`${ENDPOINT}/v2/subscriptions/${subscriptionId}`, HEADERS)
        .then(() => done());
    } else {
      done();
    }
  });

  after(function(done) {
    helper.stopServer(done);
  });

  it('should be loaded', function(done) {
    const flow = [
      configNode,
      {
        id: 'testedNode',
        type: 'NGSI-Subscriber',
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

  it('should create Subscription', function(done) {
    const flow = [
      configNode,
      {
        id: 'testedNode',
        type: 'NGSI-Subscriber',
        name: 'tested',
        wires: [['helperNode']],
        endpoint: configNode.id,
        protocol: 'V2', // V2 for the time being. LD will also be supported,
        notificationEndpoint: 'http://localhost:6000'
      },
      { id: 'helperNode', type: 'helper' }
    ];

    const subscriptionData = {
      entityType: 'ParkingSpot'
    };

    helper.load([testedNode, brokerNode], flow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const statusCode = msg.payload.statusCode;
          subscriptionId = msg.payload.subscriptionId;

          assert.isNotNull(subscriptionId);
          assert.equal(statusCode, 201);

          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({ payload: subscriptionData });
    });
  });
});
