/* eslint-env node, mocha */

const should = require('should');
const http = require('../src/http.js');

const helper = require('node-red-node-test-helper');
const testedNode = require('../src/nodes/NGSI/updater/updater.js');

const data = require('./test_data.json');

helper.init(require.resolve('node-red'));

describe('NGSI Updater Node', function() {
  const ENDPOINT = 'http://localhost:1026';
  const TENANT = 'test';
  const HEADERS = {
    'Fiware-Service': TENANT
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
    const flow = [{ id: 'testedNode', type: 'NGSI-Updater', name: 'tested' }];

    helper.load(testedNode, flow, function() {
      const testedNode = helper.getNode('testedNode');
      testedNode.should.have.property('name', 'tested');
      done();
    });
  });

  it('should update Entity', function(done) {
    const flow = [
      {
        id: 'testedNode',
        type: 'NGSI-Updater',
        name: 'tested',
        wires: [['helperNode']],
        endpoint: ENDPOINT,
        service: TENANT,
        protocol: 'V2' // V2 for the time being. LD also supported
      },
      { id: 'helperNode', type: 'helper' }
    ];

    helper.load(testedNode, flow, function test() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        const statusCode = msg.payload;
        should(statusCode).be.exactly(204);
        done();
      });

      testedNode.on('call:error', () => {
        done('Error called on node!!');
      });

      testedNode.receive({ payload: data });
    });
  });

});
