let proxyquire = require('proxyquireify')(require);

let Trade = function () {};
Trade.buy = quote => Promise.resolve({amount: quote.baseAmount});

let stubs = {
  './trade': Trade
};

let PaymentAccount = proxyquire('../src/payment-account', stubs);
let api;

beforeEach(function () {
  api = {mock: 'api'};

  return JasminePromiseMatchers.install();
});

afterEach(() => JasminePromiseMatchers.uninstall());

describe('Payment Account', function () {
  describe('class', () =>
    describe('constructor', () =>
      it('should keep a reference to the api', function () {
        let b = new PaymentAccount(api, 'bank', undefined, {});
        expect(b._api).toEqual(api);
      })
    )
  );

  describe('instance', function () {
    let p;
    let delegate;

    beforeEach(function () {
      delegate = {
        save () { return Promise.resolve(); },
        trades: []
      };

      let quote = {
        expiresAt: new Date(new Date().getTime() + 100000),
        baseAmount: -1000,
        baseCurrency: 'EUR',
        delegate,
        api: {},
        debug: false
      };

      p = new PaymentAccount(api, 'bank', quote, Trade);
      p._name = 'John Do';
    });

    it('should have a name', () =>
expect(p.name).toEqual('John Do'));

    it('should have getters', function () {
      p._id = '1234';
      expect(p.id).toBe('1234');
    });

    describe('buy()', function () {
      it('should use Trade.buy', function () {
        spyOn(Trade, 'buy').and.callThrough();

        p.buy('card');

        expect(Trade.buy).toHaveBeenCalled();
      });

      it('should check for a quote', function (done) {
        p._quote = undefined;
        let promise = p.buy('card').catch(e =>
        expect(e.toEqual('QUOTE_MISSING')));
        expect(promise).toBeRejected(done);
      });

      it('should return the trade', function (done) {
        let checks = res =>
          expect(res).toEqual({amount: -1000, debug: false});

        p.buy('card').then(checks).then(done);
      });

      it('should save', function (done) {
        spyOn(delegate, 'save').and.callThrough();

        let checks = () =>
          expect(delegate.save).toHaveBeenCalled();

        p.buy('card').then(checks).then(done);
      });
    });
  });
});
