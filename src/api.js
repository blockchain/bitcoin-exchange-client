var assert = require('assert');

class API {
  constructor (options) {
    options = options || {};

    this._accessTokenBased = Boolean(options.accessTokenBased);

    if (this._accessTokenBased) {
      this._loginExpiresAt = null;
      this._accessToken = null;
    }
  }

  get hasAccount () {
    assert(false, 'Subclass must override hasAccount()');
  }

  get isLoggedIn () {
    if (!this._accessTokenBased) {
      return Boolean(this.hasAccount);
    } else {
      // Debug: + 60 * 19 * 1000 expires the login after 1 minute
      var tenSecondsFromNow = new Date(new Date().getTime() + 10000);
      return Boolean(this._accessToken) && this._loginExpiresAt > tenSecondsFromNow;
    }
  }

  login () {
    if (this._accessTokenBased) {
      assert(false, 'Subclass must define this');
    } else {
      assert(false, 'Do not call this');
    }
  }

  _authRequest (method, endpoint, data) {
    var doRequest = function () {
      return this._request(method, endpoint, data, true);
    };

    if (!this._accessTokenBased || this.isLoggedIn) {
      return doRequest.bind(this)();
    } else {
      return this.login().then(doRequest.bind(this));
    }
  }

  _request (method, url, data, headers, authorized) {
    assert(!authorized || this.isLoggedIn, "Can't make authorized request if not logged in");

    headers = headers || {};

    headers['Content-Type'] = 'application/json';

    var options = {
      headers: headers,
      credentials: 'omit'
    };

    // encodeFormData :: Object -> url encoded params
    var encodeFormData = function (data) {
      var encoded = Object.keys(data).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');
      return encoded;
    };

    if (data && Object.keys(data).length !== 0) {
      if (method === 'GET') {
        url += '?' + encodeFormData(data);
      } else {
        options.body = JSON.stringify(data);
      }
    }

    options.method = method;

    var handleNetworkError = function (e) {
      return Promise.reject({ error: 'EXCHANGE_CONNECT_ERROR', message: e });
    };

    var checkStatus = function (response) {
      if (response.status === 204) {
        return;
      } else if (response.status >= 200 && response.status < 300) {
        return response.json();
      } else {
        return response.text().then(Promise.reject.bind(Promise));
      }
    };

    return fetch(url, options)
      .catch(handleNetworkError)
      .then(checkStatus);
  }

  GET (endpoint, data) {
    return this._request('GET', endpoint, data);
  }

  authGET (endpoint, data) {
    return this._authRequest('GET', endpoint, data);
  }

  POST (endpoint, data) {
    return this._request('POST', endpoint, data);
  }

  authPOST (endpoint, data) {
    return this._authRequest('POST', endpoint, data);
  }

  PUT (endpoint, data) {
    return this._request('PUT', endpoint, data);
  }

  authPUT (endpoint, data) {
    return this._authRequest('PUT', endpoint, data);
  }

  PATCH (endpoint, data) {
    return this._request('PATCH', endpoint, data);
  }

  authPATCH (endpoint, data) {
    return this._authRequest('PATCH', endpoint, data);
  }
}

module.exports = API;
