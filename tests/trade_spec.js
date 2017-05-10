let proxyquire = require('proxyquireify')(require);

let stubs = {
};

let Trade = proxyquire('../src/trade-concrete', stubs);

describe('Trade', function () {
  let tradeJSON;
  let tradeJSON2;

  let delegate;

  let api;

  beforeEach(function () {
    jasmine.clock().uninstall();
    jasmine.clock().install();

    tradeJSON = {
      id: 1142
    };

    tradeJSON2 = JSON.parse(JSON.stringify(tradeJSON));
    tradeJSON2.id = 1143;

    return JasminePromiseMatchers.install();
  });

  afterEach(function () {
    JasminePromiseMatchers.uninstall();
    return jasmine.clock().uninstall();
  });

  describe('class', function () {
    describe('new Trade()', function () {
      beforeEach(function () {
        delegate = {
          getReceiveAddress () {}
        };
        api = {
        };
      });

      it('should create a Trade instance', function () {
        let trade = new Trade({id: 1}, api, delegate);
        expect(trade instanceof Trade).toBeTruthy();
      });

      it('should keep a reference to the API', function () {
        let t = new Trade(null, api, delegate);
        expect(t._api).toBe(api);
      });
    });

    describe('_checkOnce()', function () {
      let trade;

      beforeEach(function () {
        trade = {
          id: 1,
          receiveAddress: 'trade-address',
          _setTransactionHash () {},
          refresh () { return Promise.resolve(); }
        };
        delegate = {
          debug: false,
          save () { return Promise.resolve(); },
          getReceiveAddress () {},
          checkAddress (address) {
            if (address === 'trade-address') {
              return Promise.resolve({hash: 'tx-hash', confirmations: 0}, 1);
            } else {
              return Promise.resolve(null, 0);
            }
          }
        };

        spyOn(trade, '_setTransactionHash').and.callThrough();
        spyOn(trade, 'refresh').and.callThrough();
      });

      it('should resolve immedidatley if there are no trades', function (done) {
        let promise = Trade._checkOnce([], delegate);
        expect(promise).toBeResolved(done);
      });

      it('should call refresh()', function (done) {
        let checks = function () {
          expect(trade.refresh).toHaveBeenCalled();
          return done();
        };

        let promise = Trade._checkOnce([trade], delegate).then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should not call refresh() if no transaction is found', function (done) {
        let checks = function () {
          expect(trade.refresh).not.toHaveBeenCalled();
          return done();
        };

        trade.receiveAddress = 'wrong-address';

        let promise = Trade._checkOnce([trade], delegate).then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should call _setTransactionHash', function (done) {
        let checks = function () {
          expect(trade._setTransactionHash).toHaveBeenCalled();
          return done();
        };

        let promise = Trade._checkOnce([trade], delegate).then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should call _setTransactionHash without refresh for completed trades', function (done) {
        let checks = function () {
          expect(trade._setTransactionHash).toHaveBeenCalled();
          expect(trade.refresh).not.toHaveBeenCalled();
          return done();
        };

        trade.state = 'completed';

        let promise = Trade._checkOnce([trade], delegate).then(checks);

        expect(promise).toBeResolved(done);
      });
    });

    describe('filteredTrades', () =>
      it('should return transactions that might still receive payment', function () {
        let trades = [
          {state: 'awaiting_transfer_in'}, // might receive payment
          {state: 'cancelled'} // will never receive payment
        ];
        let expected = [
          {state: 'awaiting_transfer_in'}
        ];
        expect(Trade.filteredTrades(trades)).toEqual(expected);
      })
    );

    describe('_monitorWebSockets', () =>
      it('should call _monitorAddress() on each trade', function () {
        let trades = [{
          _monitorAddress () {}
        }];
        spyOn(trades[0], '_monitorAddress');
        let filter = () => true;
        Trade._monitorWebSockets(trades, filter);
        expect(trades[0]._monitorAddress).toHaveBeenCalled();
      })
    );

    describe('monitorPayments', function () {
      delegate = undefined;

      let trade1 = {
        state: 'cancelled',
        delegate
      };
      let trade2 = {
        state: 'awaiting_transfer_in',
        delegate
      };
      let trades = [trade1, trade2];

      beforeEach(function () {
        delegate = {
          debug: false
        };

        // Spy doesn't work properly with this subclass:
        // eslint-disable-next-line no-proto
        spyOn(Trade.__proto__, '_checkOnce').and.callFake(() => Promise.resolve());
      });

      it('should call _checkOnce with relevant trades', function () {
        Trade.monitorPayments(trades, delegate);
        expect(Trade._checkOnce).toHaveBeenCalled();
        expect(Trade._checkOnce.calls.argsFor(0)[0]).toEqual([trade2]);
      });

      it('should call _monitorWebSockets with relevant trades', function (done) {
        // eslint-disable-next-line no-proto
        spyOn(Trade.__proto__, '_monitorWebSockets').and.callFake(function () {
          // monitorPayments() is not a promise, so this test relies on the fact
          // that Jasmine throws a timeout if this code is never run.
          expect(Trade._monitorWebSockets).toHaveBeenCalled();
          expect(Trade._monitorWebSockets.calls.argsFor(0)[0]).toEqual([trade2]);
          return done();
        });

        Trade.monitorPayments(trades, delegate);
      });
    });

    describe('_monitorAddress', () =>
      it('...', () => {
        pending();
      })
    );
  });

  describe('instance', function () {
    let trade;
    delegate = undefined;

    beforeEach(function () {
      delegate = {
        reserveReceiveAddress () {
          return {
            receiveAddress: '1abcd',
            commit () {}
          };
        },
        removeLabeledAddress () {},
        releaseReceiveAddress () {},
        commitReceiveAddress () {},
        save () { return Promise.resolve(); },
        deserializeExtraFields () {},
        getReceiveAddress () {},
        serializeExtraFields () {},
        monitorAddress () {}
      };

      api = {
      };
      trade = new Trade({id: 1}, api, delegate);
    });

    describe('getters', () =>
      it('should work', function () {
        expect(trade.id).toEqual(1);
        expect(trade.createdAt).toBeDefined();
        expect(trade.expiresAt).toBe(null);
        expect(trade.createdAt instanceof Date).toBeTruthy();
        expect(trade.inCurrency).toEqual('USD');
        expect(trade.outCurrency).toEqual('BTC');
        expect(trade.medium).toEqual('bank');
        expect(trade.inAmount).toEqual(1000);
        expect(trade.sendAmount).toEqual(1000);
        expect(trade.outAmount).toEqual(5000000);
        expect(trade.outAmountExpected).toEqual(5000000);
        expect(trade.receiveAddress).toEqual('1abc');
        expect(trade.accountIndex).toEqual(0);
        expect(trade.bitcoinReceived).toEqual(false);
        expect(trade.confirmed).toEqual(false);
        expect(trade.txHash).toEqual(null);
        expect(trade.bankAccountNumber).toEqual('1234 ABCD 5678 EFGH');
        expect(trade.transferIn.details.account).toEqual('123456789abcdefgh');
        expect(trade.iSignThisID).toEqual('adsf231413-5c8f-4ecc-82jf-asdf22424');
      })
    );

    describe('debug', () =>
      it('can be set', function () {
        trade.debug = true;
        expect(trade.debug).toEqual(true);
      })
    );

    describe('self()', () =>
      it('should return this', () =>
expect(trade.self()).toBe(trade))
    );

    describe('process', function () {
      beforeEach(() => spyOn(trade._delegate, 'releaseReceiveAddress'));

      it('should ask delegate to release addresses for cancelled trades', function () {
        trade._state = 'cancelled';
        trade.process();
        expect(trade._delegate.releaseReceiveAddress).toHaveBeenCalled();
      });

      it('should not ask to release addresses for awaiting_transfer_in trades', function () {
        trade._state = 'awaiting_transfer_in';
        trade.process();
        expect(trade._delegate.releaseReceiveAddress).not.toHaveBeenCalled();
      });
    });

    describe('sell()', function () {
      let quote;

      beforeEach(function () {
        quote = {
          id: 101,
          expiresAt: new Date(new Date().getTime() + 100000),
          api,
          delegate,
          debug: false,
          _TradeClass: Trade
        };
      });

      it('should check that the quote is valid', function () {
        quote.expiresAt = new Date(new Date().getTime() - 100000);
        expect(() => { Trade.sell(quote, 12345); }).toThrow();
      });

      it('should fail with no bankId', function () {
        expect(Trade.sell(quote, 'fail')).toBeRejected();
      });
    });

    describe('buy()', function () {
      let quote;

      beforeEach(function () {
        // eslint-disable-next-line no-proto
        spyOn(Trade.prototype.__proto__, '_monitorAddress').and.callFake(function () {
        });

        quote = {
          id: 101,
          expiresAt: new Date(new Date().getTime() + 100000),
          api,
          delegate,
          debug: false,
          _TradeClass: Trade
        };
      });

      it('should check that quote  is still valid', function () {
        quote.expiresAt = new Date(new Date().getTime() - 100000);
        expect(() => { Trade.buy(quote, 'card'); }).toThrow();
      });

      it('should watch the address', function (done) {
        let checks = trade =>
expect(trade._monitorAddress).toHaveBeenCalled();

        let promise = Trade.buy(quote, 'bank')
          .then(checks);

        expect(promise).toBeResolved(done);
      });

      it('should handle error', function (done) {
        let promise = Trade.buy(quote, 'fail');

        expect(promise).toBeRejected(done);
      });
    });

    describe('watchAddress', function () {
      it('should set _watchAddressResolve', function () {
        trade.watchAddress();
        expect(trade._watchAddressResolve).toBeDefined();
      });

      it('should not set _watchAddressResolve if tx is already matched', function () {
        trade._txHash = '1234';
        trade.watchAddress();
        expect(trade._watchAddressResolve).not.toBeDefined();
      });
    });

    describe('_monitorAddress()', function () {
      beforeEach(function () {
        trade._state = 'completed';
        trade._txHash = null;
        trade._setTransactionHash = () => Promise.resolve();

        // tradeWasPaid() calls _watchAddressResolve
        trade._watchAddressResolve = function () {};

        spyOn(trade, '_watchAddressResolve');

        spyOn(trade, 'refresh').and.callThrough();

        spyOn(trade._delegate, 'save').and.callFake(() =>
          ({
            then (cb) {
              return cb();
            }
          })
        );
      });

      it('should call monitorAddress() on the delegate', function () {
        spyOn(trade._delegate, 'monitorAddress');
        trade._monitorAddress();
        expect(trade._delegate.monitorAddress).toHaveBeenCalled();
      });

      it('should first refresh if trade is still awaiting_transfer_in', function () {
        trade._state = 'awaiting_transfer_in';

        trade._delegate.monitorAddress = (address, callback) => callback('transaction-hash', 1000);

        trade._monitorAddress();

        expect(trade.refresh).toHaveBeenCalled();
      });

      it('should not call tradeWasPaid if state is awaiting_transfer_in after refresh', function () {
        trade._state = 'awaiting_transfer_in';

        trade._delegate.monitorAddress = (address, callback) => callback('transaction-hash', 1000);

        trade._monitorAddress();

        expect(trade._watchAddressResolve).not.toHaveBeenCalled();
      });

      it('should not call tradeWasPaid if trade already has a hash', function () {
        trade._txHash = 'other-transaction-hash';

        trade._delegate.monitorAddress = (address, callback) => callback('transaction-hash', 1000);

        trade._monitorAddress();

        expect(trade._watchAddressResolve).not.toHaveBeenCalled();

        expect(trade.txHash).toEqual('other-transaction-hash');
      });
    });

    describe('_setTransactionHash', function () {
      trade = undefined;
      delegate = undefined;
      let tx = {hash: 'tx-hash', confirmations: 0};

      beforeEach(function () {
        delegate = {
          checkAddress (address) {
            return Promise.resolve(tx);
          }
        };

        trade = {
          receiveAddress: 'trade-address',
          _delegate: delegate,
          state: 'completed',
          debug: false,
          _txHash: null,
          _setTransactionHash: Trade.prototype._setTransactionHash,
          _watchAddressResolve () {}
        };

        spyOn(trade, '_watchAddressResolve').and.callThrough();
      });

      afterEach(() => {
        trade = undefined;
      });

      describe('for a real trade', function () {
        it('should set the hash if trade is completed', function () {
          trade.state = 'completed';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._txHash).toEqual('tx-hash');
        });

        it('should set the hash if trade is processing', function () {
          trade.state = 'processing';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._txHash).toEqual('tx-hash');
        });

        it('should resolve the watcher', function () {
          trade.state = 'completed';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._watchAddressResolve).toHaveBeenCalled();
        });

        it('should not override the hash if set earlier', function () {
          trade.state = 'completed';
          trade._txHash = 'tx-hash-before';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._txHash).toEqual('tx-hash-before');
        });

        it('should set the number of confirmations', function () {
          trade.state = 'completed';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._confirmations).toEqual(0);
        });

        it('should update the number of confirmations', function () {
          trade.state = 'completed';
          tx.confirmations = 2;
          tx.hash = 'tx-hash-before';
          trade._txHash = 'tx-hash-before';

          trade._setTransactionHash(tx, 2, delegate);

          expect(trade._confirmations).toEqual(2);
        });

        it('should set _confirmed to true so it gets serialized', function () {
          trade.state = 'completed';
          tx.confirmations = 6;
          trade.confirmed = true; // mock getter, the real one checks trade._confirmations

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._confirmed).toEqual(true);
        });
      });

      describe('for a test trade', function () {
        it('should set the hash if trade is completed', function () {
          trade.state = 'completed_test';
          tx.hash = 'tx-hash';

          trade._setTransactionHash(tx, 1, delegate);
          expect(trade._txHash).toEqual('tx-hash');
        });

        it('should resolve the watcher', function () {
          trade.state = 'completed_test';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._watchAddressResolve).toHaveBeenCalled();
        });

        it('should not override the hash if set earlier', function () {
          trade.state = 'completed_test';
          trade._txHash = 'tx-hash-before';

          trade._setTransactionHash(tx, 1, delegate);

          expect(trade._txHash).toEqual('tx-hash-before');
        });

        it('should update the number of confirmations', function () {
          trade.state = 'completed_test';
          tx.confirmations = 2;
          tx.hash = 'tx-hash-before';
          trade._txHash = 'tx-hash-before';

          trade._setTransactionHash(tx, 2, delegate);

          expect(trade._confirmations).toEqual(2);
        });
      });
    });
  });
});
