const request = require('request');

function get(resource, headers) {
  return new Promise(function(resolve, reject) {
    const options = {
      method: 'GET',
      uri: resource,
      headers
    };

    request(options, function(error, response, body) {
      return error
        ? reject(error)
        : resolve({
            response,
            body
          });
    });
  });
}

function post(resource, data, headers) {
  headers = headers || {
    'Content-Type': 'application/json'
  };

  return new Promise(function(resolve, reject) {
    const options = {
      method: 'POST',
      uri: resource,
      body: data,
      headers,
      simple: false,
      json: true // Automatically stringifies the body to JSON
    };

    request(options, function(error, response, body) {
      return error
        ? reject(error)
        : resolve({
            response,
            body
          });
    });
  });
}

module.exports = {
  get,
  post
};
