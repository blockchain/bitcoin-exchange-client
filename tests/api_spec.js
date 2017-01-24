let proxyquire = require('proxyquireify')(require);

import 'isomorphic-fetch';

import fetchMock from 'fetch-mock';

let stubs = {
};

const API = proxyquire('../src/api', stubs);

describe('API', function () {
  let api;

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
    beforeEach(() => {
      api = new API();
    });

    describe('Properties', function () {
      describe('production', () =>
        it('should set _production', function () {
          api.production = true;
          expect(api._production).toEqual(true);
        })
      );

      describe('testnet', () =>
        it('should set _testnet', function () {
          api.testnet = true;
          expect(api._testnet).toEqual(true);
        })
      );
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
    });
  });
});
