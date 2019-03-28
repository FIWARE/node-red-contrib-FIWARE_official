/* eslint-env node, mocha */

require('should');
const helper = require('node-red-node-test-helper');
const testedNode = require('../NGSI/entity/entity.js');

helper.init(require.resolve('node-red'));

describe('NGSI Node', function() {
  before(function(done) {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload();
    done();
  });

  after(function(done) {
    helper.stopServer(done);
  });

  it('should be loaded', function(done) {
    const flow = [{ id: 'testedNode', type: 'NGSI-Entity', name: 'tested' }];

    helper.load(testedNode, flow, function() {
      const testedNode = helper.getNode('testedNode');
      testedNode.should.have.property('name', 'tested');
      done();
    });
  });

  it('should retrieve Entity', function(done) {
    const flow = [
      {
        id: 'testedNode',
        type: 'NGSI-Entity',
        name: 'tested',
        wires: [['helperNode']],
        endpoint: 'https://orion.lab.fiware.org',
        service: 'poi'
      },
      { id: 'helperNode', type: 'helper' }
    ];

    const entityId = 'Museum-b24a98d7fd0e4f37947add846d75fc9b';

    helper.load(testedNode, flow, function() {
      const helperNode = helper.getNode('helperNode');
      const testedNode = helper.getNode('testedNode');

      helperNode.on('input', function(msg) {
        const entity = JSON.parse(msg.payload);
        entity.should.have.property('id', entityId);
        done();
      });

      testedNode.receive({ payload: entityId });
    });
  });
});
