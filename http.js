const request = require('request');

function get(resource, headers) {
    return new Promise(function(resolve, reject) {
        const options = {
            method: 'GET',
            uri: resource,
            headers
        };

        request(options, function(error, response, body) {
            return error ? reject(error) : resolve({
                response,
                body
            });
        });
    });
}

module.exports = {
    get
};
