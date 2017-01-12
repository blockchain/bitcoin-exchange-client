// This is a mimimal implementation of API, for
// the purpose of writing tests.

var AbstractAPI = require('./api');

class API extends AbstractAPI {
  get hasAccount () { return this._hasAccount; }

  login () {}
}

module.exports = API;
