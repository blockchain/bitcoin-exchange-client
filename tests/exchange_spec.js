let proxyquire = require('proxyquireify')(require);

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

let Trade = obj => obj;
let tradesJSON = [
  {
    id: 1,
    state: 'awaiting_transfer_in'
  }
];
Trade.spyableProcessTrade = function () {};
Trade.fetchAll = () =>
  Promise.resolve([
    {
      id: tradesJSON[0].id,
      state: tradesJSON[0].state,
      process: Trade.spyableProcessTrade
    }
  ])
;

let stubs = {
  './trade': Trade,
  './quote': Quote,
  './api': API,
  './payment-medium': PaymentMedium
};

let Exchange = proxyquire('../src/exchange-concrete', stubs);

describe('Exchange', function () {
  let e;

  beforeEach(() => JasminePromiseMatchers.install());

  afterEach(() => JasminePromiseMatchers.uninstall());

  describe('class', () =>
    describe('new Exchange()', () =>

      it('should work', function () {
        e = new Exchange({}, Trade, Quote);
        expect(e.constructor.name).toEqual('Exchange');
      })
    )
  );

  describe('instance', function () {
    beforeEach(function () {
      e = new Exchange({
        email () { return 'info@blockchain.com'; },
        isEmailVerified () { return true; },
        getEmailToken () { return 'json-web-token'; },
        save () { return Promise.resolve(); }
      }, Trade, Quote);
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

    describe('getTrades()', function () {
      it('should call Trade.fetchAll', function () {
        spyOn(Trade, 'fetchAll').and.callThrough();
        e.getTrades();
        expect(Trade.fetchAll).toHaveBeenCalled();
      });

      it('should store the trades', function (done) {
        let checks = res =>
expect(e._trades.length).toEqual(1);

        let promise = e.getTrades().then(checks);
        expect(promise).toBeResolved(done);
      });

      it('should resolve the trades', function (done) {
        let checks = function (res) {
          expect(res.length).toEqual(1);
          return done();
        };

        e.getTrades().then(checks);
      });

      it('should call process on each trade', function (done) {
        spyOn(Trade, 'spyableProcessTrade');

        let checks = function (res) {
          expect(Trade.spyableProcessTrade).toHaveBeenCalled();
          return done();
        };

        return e.getTrades().then(checks);
      });

      it('should update existing trades', function (done) {
        e._trades = [
          {
            _id: 1,
            process () {},
            state: 'awaiting_transfer_in',
            set (obj) {
              this.state = obj.state;
            }
          },
          {
            _id: 2,
            process () {},
            state: 'awaiting_transfer_in',
            set (obj) {
              this.state = obj.state;
            }
          }
        ];

        tradesJSON[0].state = 'completed_test';

        let checks = function () {
          expect(e._trades.length).toBe(2);
          expect(e._trades[0].state).toEqual('completed_test');
          return done();
        };

        return e.getTrades().then(checks);
      });

      it('should not be case sensitive for existing trades', function (done) {
        e._trades = [
          {
            _id: 'ab',
            process () {},
            state: 'awaiting_transfer_in',
            set (obj) {
              this.state = obj.state;
            }
          },
          {
            _id: 'cd',
            process () {},
            state: 'awaiting_transfer_in',
            set (obj) {
              this.state = obj.state;
            }
          }
        ];

        tradesJSON[0].id = 'Ab';
        tradesJSON[0].state = 'completed_test';

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
        spyOn(Trade, 'monitorPayments');
        e.monitorPayments();
        expect(Trade.monitorPayments).toHaveBeenCalled();
      })
    );
  });
});
