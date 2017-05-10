let proxyquire = require('proxyquireify')(require);

let mocks = {
  trade: require('./mocks/trade.mock')
};

const API = () =>
  ({
    GET () {},
    POST () {},
    PATCH () {}
  })
;

let PaymentMedium = {
  getAll () {}
};

let Quote = {
  getQuote (api, delegate, amount, baseCurrency, quoteCurrency) {
    return Promise.resolve({
      baseAmount: amount,
      baseCurrency,
      quoteCurrency
    });
  }
};

let stubs = {
  './trade': mocks.trade.Trade,
  './quote': Quote,
  './api': API,
  './payment-medium': PaymentMedium
};

let Exchange = proxyquire('../src/exchange-concrete', stubs);

describe('Exchange', function () {
  let e;
  let cachedExchangeJSON;

  beforeEach(() => {
    JasminePromiseMatchers.install();

    mocks.trade.init();

    cachedExchangeJSON = {
      trades: [
        {
          id: 1,
          state: 'awaiting_transfer_in'
        },
        {
          id: 2,
          state: 'awaiting_transfer_in'
        }
      ]
    };
  });

  afterEach(() => JasminePromiseMatchers.uninstall());

  describe('class', () =>
    describe('new Exchange()', () => {
      it('should work', () => {
        e = new Exchange({}, {});
        expect(e.constructor.name).toEqual('Exchange');
      });

      it('should have an array of trades', () => {
        e = new Exchange(cachedExchangeJSON, {});

        expect(e.trades.length).toEqual(2);
        expect(e.trades[0].id).toEqual(1);
      });
    })
  );

  describe('instance', function () {
    beforeEach(() => {
      let delegate = {
        email () { return 'info@blockchain.com'; },
        isEmailVerified () { return true; },
        getEmailToken () { return 'json-web-token'; },
        save () { return Promise.resolve(); },
        releaseReceiveAddress () {}
      };
      e = new Exchange(cachedExchangeJSON, delegate, mocks.trade.Trade, Quote);
      e.api = new API();
    });

    describe('debug', function () {
      it('should set debug', function () {
        e.debug = true;
        expect(e.debug).toEqual(true);
      });

      it('should set debug flag on the delegate', function () {
        e._delegate = {debug: false};
        e.debug = true;
        expect(e.delegate.debug).toEqual(true);
      });

      it('should set debug flag on trades', function () {
        e._trades = [{debug: false}];
        e.debug = true;
        expect(e.trades[0].debug).toEqual(true);
      });
    });

    describe('api', () =>
      it('should be a getter', function () {
        let api = {};
        e._api = api;
        expect(e.api).toBe(api);
      })
    );

    describe('user', () =>
      it('should be a getter', function () {
        e._user = '1234';
        expect(e.user).toEqual('1234');
      })
    );

    describe('profile', () =>
      it('should be a getter', function () {
        e._profile = { _country: 'GB' };
        expect(e.profile).toEqual({ _country: 'GB' });
      })
    );

    describe('autoLogin', function () {
      beforeEach(() =>
        spyOn(e.delegate, 'save').and.callThrough());

      it('should update', function () {
        e.autoLogin = false;
        expect(e.autoLogin).toEqual(false);
      });

      it('should save', function () {
        e.autoLogin = false;
        expect(e.delegate.save).toHaveBeenCalled();
      });

      it('should check the input', () =>
        expect(() => { e.autoLogin = '1'; }).toThrow());
    });

    describe('getBuyMethods()', function () {
      beforeEach(() => {
        spyOn(PaymentMedium, 'getAll');
      });

      it('should get payment methods with BTC as out currency', function () {
        e.getBuyMethods();
        expect(PaymentMedium.getAll).toHaveBeenCalled();
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).not.toBeDefined();
        expect(PaymentMedium.getAll.calls.argsFor(0)[1]).toEqual('BTC');
      });
    });

    describe('getSellMethods()', function () {
      beforeEach(() => spyOn(PaymentMedium, 'getAll'));

      it('should get payment methods with BTC as in currency', function () {
        e.getSellMethods();
        expect(PaymentMedium.getAll).toHaveBeenCalled();
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('BTC');
        expect(PaymentMedium.getAll.calls.argsFor(0)[1]).not.toBeDefined();
      });
    });

    describe('getBuyQuote', function () {
      it('should use Quote.getQuote', function () {
        spyOn(Quote, 'getQuote').and.callThrough();

        e.getBuyQuote(1000, 'EUR', 'BTC');

        expect(Quote.getQuote).toHaveBeenCalled();
      });

      it('should require a quote currency if base currency is BTC', () =>
expect(() => e.getBuyQuote(100000, 'BTC')).toThrow());

      it('should use a negative amount', function (done) {
        let checks = quote =>
expect(quote.baseAmount).toEqual(-1000);

        let promise = e.getBuyQuote(1000, 'EUR', 'BTC').then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should set the quote currency to BTC for fiat base currency', function (done) {
        let checks = quote =>
expect(quote.quoteCurrency).toEqual('BTC');

        let promise = e.getBuyQuote(1000, 'EUR').then(checks);

        expect(promise).toBeResolved(done);
      });
    });

    describe('getSellQUote', function () {
      it('should use Quote.getQuote', function () {
        spyOn(Quote, 'getQuote').and.callThrough();
        e.getSellQuote(1, 'BTC', 'EUR');
        expect(Quote.getQuote).toHaveBeenCalled();
      });
    });

    describe('getTrades()', function () {
      it('should call Trade.fetchAll', function () {
        spyOn(mocks.trade.Trade, 'fetchAll').and.callThrough();
        e.getTrades();
        expect(mocks.trade.Trade.fetchAll).toHaveBeenCalled();
      });

      it('should hold on to the trades', function (done) {
        let checks = res => {
          expect(e._trades.length).toEqual(2);
        };

        let promise = e.getTrades().then(checks);
        expect(promise).toBeResolved(done);
      });

      it('should resolve the trades', function (done) {
        let checks = function (res) {
          expect(res.length).toEqual(2);
          return done();
        };

        e.getTrades().then(checks);
      });

      it('should call setFromAPI on each trade', function (done) {
        spyOn(mocks.trade.Trade, 'spyableSetFromAPI');

        let checks = function (res) {
          expect(mocks.trade.Trade.spyableSetFromAPI).toHaveBeenCalled();
          return done();
        };

        return e.getTrades().then(checks);
      });

      it('should update existing trades', function (done) {
        mocks.trade.tradesJSON[0].state = 'completed_test';

        let checks = function () {
          expect(e._trades.length).toBe(2);
          expect(e._trades[0].state).toEqual('completed_test');
        };

        return e.getTrades().then(checks).catch(fail).then(done);
      });

      it('should add non-cached trades', function (done) {
        mocks.trade.tradesJSON.push({
          id: 3,
          state: 'cancelled'
        });

        let checks = function () {
          expect(e._trades.length).toBe(3);
          expect(e._trades[2].state).toEqual('cancelled');
        };

        return e.getTrades().then(checks).catch(fail).then(done);
      });

      it('should not be case sensitive for existing trades', function (done) {
        e._trades[0]._id = 'ab';
        e._trades[1]._id = 'cd';

        mocks.trade.tradesJSON[0].id = 'Ab';
        mocks.trade.tradesJSON[1].id = 'cd';
        mocks.trade.tradesJSON[0].state = 'completed_test';

        let checks = function () {
          expect(e._trades.length).toBe(2);
          expect(e._trades[0].state).toEqual('completed_test');
          return done();
        };

        return e.getTrades().then(checks);
      });
    });

    describe('monitorPayments()', () =>
      it('should call Trade.monitorPayments', function () {
        spyOn(mocks.trade.Trade, 'monitorPayments');
        e.monitorPayments();
        expect(mocks.trade.Trade.monitorPayments).toHaveBeenCalled();
      })
    );
  });
});
