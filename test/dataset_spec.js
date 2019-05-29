/* eslint-env node, mocha */

const should = require("should");
const http = require("../src/http.js");

const helper = require("node-red-node-test-helper");
const testedNode = require("../src/nodes/NGSI/dataset/dataset.js");

const data = require("./test_data.json");

helper.init(require.resolve("node-red"));

describe("NGSI Dataset Node", function() {
  const ENDPOINT = "http://localhost:1026";
  const TENANT = "test";
  const HEADERS = {
    "Fiware-Service": TENANT
  };

  const retrievalFlow = [
    {
      id: "testedNode",
      type: "NGSI-Dataset",
      name: "tested",
      wires: [["helperNode"]],
      endpoint: ENDPOINT,
      service: TENANT,
      protocol: "V2" // V2 for the time being. LD also supported
    },
    { id: "helperNode", type: "helper" }
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

  it("should be loaded", function(done) {
    const flow = [{ id: "testedNode", type: "NGSI-Dataset", name: "tested" }];

    helper.load(testedNode, flow, function() {
      const testedNode = helper.getNode("testedNode");
      testedNode.should.have.property("name", "tested");
      done();
    });
  });

  it("should retrieve Data", function(done) {
    const entityType = data.type;

    helper.load(testedNode, retrievalFlow, function test() {
      const helperNode = helper.getNode("helperNode");
      const testedNode = helper.getNode("testedNode");

      helperNode.on("input", function(msg) {
        const retrievedData = JSON.parse(msg.payload);
        retrievedData[0].should.have.property("id", data.id);
        done();
      });

      testedNode.on("call:error", () => {
        done("Error called on node!!");
      });

      testedNode.receive({
        payload: {
          entityType
        }
      });
    });
  });

  it("should not retrieve Data", function(done) {
    const entityType = data.type;
    const q = 'name==xx';

    helper.load(testedNode, retrievalFlow, function test() {
      const helperNode = helper.getNode("helperNode");
      const testedNode = helper.getNode("testedNode");

      helperNode.on("input", function(msg) {
        const retrievedData = JSON.parse(msg.payload);
        should(retrievedData.length).be.exactly(0);
        done();
      });

      testedNode.on("call:error", () => {
        done("Error called on node!!");
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
