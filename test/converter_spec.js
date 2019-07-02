/* eslint-env node, mocha */

const assert = require('chai').assert;

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/v2ToLD/v2ToLD.js');
// const brokerNode = require('../src/nodes/NGSI/contextbroker/contextbroker.js');

const v2_data = require('./data/v2_agri_test.json');
const LD_data = require('./data/LD_test_data.json');

helper.init(require.resolve('node-red'));

describe('NGSI v2ToLD Node', function() {
  before(done => {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload();
    done();
  });

  it('should be loaded', function(done) {
    const flow = [
      {
        id: 'testedNode',
        type: 'NGSI-v2ToLD',
        name: 'tested'
      }
    ];

    helper.load([testedNode], flow, function() {
      const testedNode = helper.getNode('testedNode');
      assert.propertyVal(testedNode, 'name', 'tested');
      done();
    });
  });

  it('should convert JSON payload from v2 to LD', function(done) {
    const flow = [
      {
        id: 'testedNode',
        type: 'NGSI-v2ToLD',
        name: 'tested',
        wires: [['helperNode']],
      },
      { id: 'helperNode', type: 'helper' }
    ];

    helper.load([testedNode], flow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const convertedData = msg.payload;
          // const ldObj = JSON.parse(LD_data);
          // assert.equal(convertedData, ldObj);
          assert.equal(JSON.stringify(convertedData), JSON.stringify(LD_data));
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', (e) => {
        done('Error called on node!! ' + e);
      });

      testedNode.receive({ payload: v2_data });
    });
  });

  it('should convert string payload from v2 to LD', function(done) {
    const flow = [
      {
        id: 'testedNode',
        type: 'NGSI-v2ToLD',
        name: 'tested',
        wires: [['helperNode']],
      },
      { id: 'helperNode', type: 'helper' }
    ];

    helper.load([testedNode], flow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        try {
          const convertedData = msg.payload;

          assert.equal(JSON.stringify(convertedData), JSON.stringify(LD_data));
          done();
        } catch (e) {
          done(e);
        }
      });

      testedNode.on('call:error', (e) => {
        done('Error called on node!! ' + e);
      });

      testedNode.receive({ payload: JSON.stringify(v2_data) });
    });
  });
});
