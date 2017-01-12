let proxyquire = require('proxyquireify')(require);

import 'isomorphic-fetch';

import fetchMock from 'fetch-mock';

let stubs = {
};

const API = proxyquire('../src/api', stubs);
const ConcreteAPI = proxyquire('../src/api-concrete', {});

describe('API', function () {
  let api; // Abstract class
  let concreteAPI; // Subclass

  beforeEach(() =>
    JasminePromiseMatchers.install());

  afterEach(() =>
    JasminePromiseMatchers.uninstall());

  describe('class', () =>
    describe('new API()', () =>
      it('should have a contructor', function () {
        api = new API();
        expect(api instanceof API).toBeTruthy();
      })
    )
  );

  describe('instance', function () {
    describe('hasAccount', function () {
      it('should be implemented by the subclass', function () {
        concreteAPI = new ConcreteAPI();

        expect(() => { api.hasAccount; }).toThrow();
        expect(() => { concreteAPI.hasAccount; }).not.toThrow();
      });
    });

    describe('accessTokenBased', function () {
      beforeEach(() => {
        api = new API({accessTokenBased: true});
        concreteAPI = new ConcreteAPI({accessTokenBased: true});
      });

      describe('isLoggedIn', function () {
        beforeEach(function () {
          api._accessToken = 'access_token';
          api._loginExpiresAt = new Date(new Date().getTime() + 100000);
        });

        it('checks if there is an access token', function () {
          expect(api.isLoggedIn).toEqual(true);

          api._accessToken = undefined;
          expect(api.isLoggedIn).toEqual(false);
        });

        it("checks if the token hasn't expired", function () {
          expect(api.isLoggedIn).toEqual(true);

          api._loginExpiresAt = new Date(new Date().getTime() - 100000);
          expect(api.isLoggedIn).toEqual(false);
        });

        it('should be a few seconds on the safe side', function () {
          expect(api.isLoggedIn).toEqual(true);

          api._loginExpiresAt = new Date(new Date().getTime());
          expect(api.isLoggedIn).toEqual(false);
        });
      });

      describe('login()', function () {
        it('should require a subclass to implement this', function () {
          expect(() => { api.login(); }).toThrow();
          expect(() => { concreteAPI.login(); }).not.toThrow();
        });
      });

      describe('verb', () => {
        beforeEach(function () {
          api._accessToken = 'access_token';
          api._loginExpiresAt = new Date(new Date().getTime() + 100000);

          spyOn(api, '_authRequest');
        });

        describe('GET', () =>
          it('should make a GET request', function () {
            api.authGET('/trades');
            expect(api._authRequest).toHaveBeenCalled();
            expect(api._authRequest.calls.argsFor(0)[0]).toEqual('GET');
          })
        );

        describe('POST', () =>
          it('should make a POST request', function () {
            api.authPOST('/trades');
            expect(api._authRequest).toHaveBeenCalled();
            expect(api._authRequest.calls.argsFor(0)[0]).toEqual('POST');
          })
        );

        describe('PATCH', () =>
          it('should make a PATCH request', function () {
            api.authPATCH('/trades');
            expect(api._authRequest).toHaveBeenCalled();
            expect(api._authRequest.calls.argsFor(0)[0]).toEqual('PATCH');
          })
        );

        describe('PUT', () =>
          it('should make a PUT request', function () {
            api.authPUT('/trades');
            expect(api._authRequest).toHaveBeenCalled();
            expect(api._authRequest.calls.argsFor(0)[0]).toEqual('PUT');
          })
        );
      });

      describe('_authRequest', function () {
        beforeEach(function () {
          spyOn(api, '_request');
          spyOn(api, 'login').and.callFake(() => {
            return Promise.resolve();
          });
        });

        it('should make a request if already logged in', function () {
          api._accessToken = 'access_token';
          api._loginExpiresAt = new Date(new Date().getTime() + 100000);

          api._authRequest('GET', '/trades', {}, {});
          expect(api.login).not.toHaveBeenCalled();
          expect(api._request).toHaveBeenCalled();
        });

        it('should login first if needed', function () {
          api._authRequest('GET', '/trades', {}, {});
          expect(api.login).toHaveBeenCalled();
        });
      });
    });

    describe('not accessTokenBased', function () {
      beforeEach(() => {
        api = new API();
        concreteAPI = new ConcreteAPI();
      });

      describe('isLoggedIn', function () {
        it('should check if the user has an account', function () {
          concreteAPI._hasAccount = true;
          expect(concreteAPI.isLoggedIn).toEqual(true);

          concreteAPI._hasAccount = false;
          expect(concreteAPI.isLoggedIn).toEqual(false);
        });
      });

      describe('login()', function () {
        it('should not allow itself to be called', function () {
          expect(() => { api.login(); }).toThrow();
        });
      });

      describe('verb', () => {
        beforeEach(function () {
          spyOn(api, '_request');
        });

        describe('GET', () =>
          it('should make a GET request', function () {
            api.GET('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('GET');
          })
        );

        describe('POST', () =>
          it('should make a POST request', function () {
            api.POST('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('POST');
          })
        );

        describe('PATCH', () =>
          it('should make a PATCH request', function () {
            api.PATCH('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('PATCH');
          })
        );

        describe('PUT', () =>
          it('should make a PUT request', function () {
            api.PUT('/trades');
            expect(api._request).toHaveBeenCalled();
            expect(api._request.calls.argsFor(0)[0]).toEqual('PUT');
          })
        );
      });

      describe('_authRequest', function () {
        beforeEach(function () {
          spyOn(api, '_request');
          spyOn(api, 'login');
        });

        it('should make a request', function () {
          api._authRequest('GET', '/trades', {}, {});
          expect(api._request).toHaveBeenCalled();
        });
      });
    });

    describe('_request', function () {
      beforeEach(function () {
        fetchMock.get('/fail', {throws: 'fail'});
        fetchMock.get('/fail-500', 500);
        fetchMock.post('/empty', 204);
        fetchMock.get('*', {});
        return fetchMock.post('*', {});
      });

      afterEach(() => fetchMock.restore());

      it('should use fetch()', function () {
        api._request('GET', '/trades', {}, {});
        expect(fetchMock.lastUrl()).toEqual('/trades');
      });

      it('should make a GET request', function () {
        api._request('GET', 'trades', {}, {});
        expect(fetchMock.lastOptions().method).toEqual('GET');
      });

      it('should make a POST request', function (done) {
        let promise = api._request('POST', '/trades', {}, {}).then(res =>
        expect(res).toEqual({}));
        expect(fetchMock.lastOptions().method).toEqual('POST');
        expect(promise).toBeResolved(done);
      });

      it('should handle a POST with an empty response', function (done) {
        let promise = api._request('POST', '/empty', {}, {});
        expect(promise).toBeResolvedWith(undefined, done);
      });

      it('should URL encode parameters for GET requests', function () {
        api._request('GET', '/trades', {param: 1}, {});
        expect(fetchMock.lastUrl()).toEqual('/trades?param=1');
        expect(fetchMock.lastOptions().method).toEqual('GET');
      });

      it('should skip parameters for GET requests if there is no data', function () {
        api._request('GET', '/trades', {}, {});
        expect(fetchMock.lastUrl()).toEqual('/trades');
        api._request('GET', '/trades', undefined, {});
        expect(fetchMock.lastUrl()).toEqual('/trades');
      });

      it('should JSON encode POST data', function () {
        api._request('POST', '/trades', {param: 1}, {});
        expect(fetchMock.lastUrl()).toEqual('/trades');
        expect(fetchMock.lastOptions().method).toEqual('POST');
        expect(JSON.parse(fetchMock.lastOptions().body)).toEqual({param: 1});
      });

      it('should add headers', function () {
        api._request('GET', '/trades', undefined, {Authorization: 'Bearer session-token'});
        expect(fetchMock.lastOptions().headers.Authorization).toEqual('Bearer session-token');
      });

      describe('network error', () =>
        it('should throw an error message', function (done) {
          let promise = api._request('GET', '/fail');
          expect(promise).toBeRejectedWith(jasmine.objectContaining({error: 'EXCHANGE_CONNECT_ERROR'}), done);
        })
      );

      describe('network error', () =>
        it('should throw an error message', function (done) {
          let promise = api._request('GET', '/fail-500');
          expect(promise).toBeRejectedWith('', done);
        })
      );

      it('should fail if authorized request but not logged in', function () {
        concreteAPI._hasAccount = false;
        expect(() => { concreteAPI._request('GET', '/trades', {}, {}, true); }).toThrow();

        concreteAPI._hasAccount = true;
        expect(() => { concreteAPI._request('GET', '/trades', {}, {}, true); }).not.toThrow();
      });
    });
  });
});
