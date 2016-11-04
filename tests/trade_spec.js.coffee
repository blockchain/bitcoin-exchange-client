proxyquire = require('proxyquireify')(require)

stubs = {
}

Trade = proxyquire('../src/trade-concrete', stubs)

describe "Trade", ->

  tradeJSON = undefined
  tradeJSON2 = undefined

  delegate = undefined

  api = undefined

  beforeEach ->
    jasmine.clock().uninstall();
    jasmine.clock().install()

    tradeJSON = {
      id: 1142
    }

    tradeJSON2 = JSON.parse(JSON.stringify(tradeJSON))
    tradeJSON2.id = 1143

    JasminePromiseMatchers.install()

  afterEach ->
    JasminePromiseMatchers.uninstall()
    jasmine.clock().uninstall()

  describe "class", ->
    describe "new Trade()", ->
      beforeEach ->
        delegate = {
          getReceiveAddress: () ->
        }
        api = {
        }

      it "should create a Trade instance", ->
        trade  = new Trade({}, api, delegate)
        expect(trade instanceof Trade).toBeTruthy()

    describe "_checkOnce()", ->
      trade = undefined

      beforeEach ->
        trade = {
          id: 1
          receiveAddress: "trade-address"
          _setTransactionHash: () ->
          refresh: () -> Promise.resolve()
        }
        delegate = {
          debug: false
          save: () -> Promise.resolve()
          getReceiveAddress: () ->
          checkAddress: (address) ->
            if (address == 'trade-address')
              Promise.resolve({hash: "tx-hash", confirmations: 0}, 1)
            else
              Promise.resolve(null, 0)
        }

        spyOn(trade, "_setTransactionHash").and.callThrough()
        spyOn(trade, "refresh").and.callThrough()

      it "should resolve immedidatley if there are no trades", (done) ->
        filter = () -> true

        promise = Trade._checkOnce([], delegate)

        expect(promise).toBeResolved(done)

      it "should call refresh()", (done) ->
        checks = () ->
          expect(trade.refresh).toHaveBeenCalled()
          done()

        promise = Trade._checkOnce([trade], delegate).then(checks)

        expect(promise).toBeResolved(done)

      it "should not call refresh() if no transaction is found", (done) ->
        checks = () ->
          expect(trade.refresh).not.toHaveBeenCalled()
          done()

        trade.receiveAddress = 'wrong-address'

        promise = Trade._checkOnce([trade], delegate).then(checks)

        expect(promise).toBeResolved(done)

      it "should call _setTransactionHash", (done) ->
        checks = () ->
          expect(trade._setTransactionHash).toHaveBeenCalled()
          done()

        promise = Trade._checkOnce([trade], delegate).then(checks)

        expect(promise).toBeResolved(done)

      it "should call _setTransactionHash without refresh for completed trades", (done) ->
        checks = () ->
          expect(trade._setTransactionHash).toHaveBeenCalled()
          expect(trade.refresh).not.toHaveBeenCalled()
          done()

        trade.state = 'completed'

        promise = Trade._checkOnce([trade], delegate).then(checks)

        expect(promise).toBeResolved(done)


    describe "filteredTrades", ->
      it "should return transactions that might still receive payment", ->
        trades  = [
          {state: "awaiting_transfer_in"} # might receive payment
          {state: "cancelled"} # will never receive payment
        ]
        expected = [
          {state: "awaiting_transfer_in"},
        ]
        expect(Trade.filteredTrades(trades)).toEqual(expected)

    describe "_monitorWebSockets", ->
      it "should call _monitorAddress() on each trade", ->
        trades = [{
          _monitorAddress: () ->
        }]
        spyOn(trades[0], "_monitorAddress")
        filter = () -> true
        Trade._monitorWebSockets(trades, filter)
        expect(trades[0]._monitorAddress).toHaveBeenCalled()

    describe "monitorPayments", ->
      delegate = undefined

      trade1 = {
        state: "cancelled"
        delegate: delegate
      }
      trade2 = {
        state: "awaiting_transfer_in"
        delegate: delegate
      }
      trades = [trade1, trade2]


      beforeEach ->
        delegate = {
          debug: false
        }

        # Spy doesn't work properly with this subclass:
        spyOn(Trade.__proto__, "_checkOnce").and.callFake(() ->
          Promise.resolve()
        )

      it "should call _checkOnce with relevant trades", ->
        Trade.monitorPayments(trades, delegate)
        expect(Trade._checkOnce).toHaveBeenCalled()
        expect(Trade._checkOnce.calls.argsFor(0)[0]).toEqual([trade2])

      it "should call _monitorWebSockets with relevant trades", (done) ->
        spyOn(Trade.__proto__, '_monitorWebSockets').and.callFake(() ->
          # monitorPayments() is not a promise, so this test relies on the fact
          # that Jasmine throws a timeout if this code is never run.
          expect(Trade._monitorWebSockets).toHaveBeenCalled()
          expect(Trade._monitorWebSockets.calls.argsFor(0)[0]).toEqual([trade2])
          done()
        )

        promise = Trade.monitorPayments(trades, delegate)

    describe "_monitorAddress", ->
      it "...", ->
        pending()

  describe "instance", ->
    trade   = undefined
    delegate = undefined

    beforeEach ->
      delegate = {
        reserveReceiveAddress: () -> { receiveAddress: "1abcd", commit: -> }
        removeLabeledAddress: () ->
        releaseReceiveAddress: () ->
        commitReceiveAddress: () ->
        save: () -> Promise.resolve()
        deserializeExtraFields: () ->
        getReceiveAddress: () ->
        serializeExtraFields: () ->
        monitorAddress: () ->
      }

      api = {
      }
      trade = new Trade({}, api, delegate)

    describe "getters", ->
      it "should work", ->
        expect(trade.id).toEqual(1)
        expect(trade.createdAt).toBeDefined()
        expect(trade.createdAt instanceof Date).toBeTruthy()
        expect(trade.inCurrency).toEqual('USD')
        expect(trade.outCurrency).toEqual('BTC')
        expect(trade.medium).toEqual('bank')
        expect(trade.inAmount).toEqual(1000)
        expect(trade.sendAmount).toEqual(1000)
        expect(trade.outAmount).toEqual(5000000)
        expect(trade.outAmountExpected).toEqual(5000000)
        expect(trade.receiveAddress).toEqual('1abc')
        expect(trade.accountIndex).toEqual(0)
        expect(trade.bitcoinReceived).toEqual(false)
        expect(trade.confirmed).toEqual(false)
        expect(trade.txHash).toEqual(null)


    describe "debug", ->
      it "can be set", ->
        trade.debug = true
        expect(trade.debug).toEqual(true)

    describe "self()", ->
      it "should return this", ->
        expect(trade.self()).toBe(trade)

    describe "process", ->
      beforeEach ->
        spyOn(trade._delegate, "releaseReceiveAddress")

      it "should ask delegate to release addresses for cancelled trades", ->
        trade._state = 'cancelled'
        trade.process()
        expect(trade._delegate.releaseReceiveAddress).toHaveBeenCalled()

      it "should not ask to release addresses for awaiting_transfer_in trades", ->
        trade._state = 'awaiting_transfer_in'
        trade.process()
        expect(trade._delegate.releaseReceiveAddress).not.toHaveBeenCalled()

    describe "buy()", ->
      quote = undefined

      beforeEach ->
        spyOn(Trade.prototype.__proto__, "_monitorAddress").and.callFake(() ->
        )

        quote = {
          id: 101
          expiresAt: new Date(new Date().getTime() + 100000)
          api: api
          delegate: delegate
          debug: false
          _TradeClass: Trade
        }

      it 'should check that quote  is still valid', ->
        quote._expiresAt = new Date(new Date().getTime() - 100000)
        expect(() -> t.buy(quote, 'card')).toThrow()

      it "should watch the address", (done) ->
        checks = (trade) ->
          expect(trade._monitorAddress).toHaveBeenCalled()

        promise = Trade.buy(quote, 'bank')
          .then(checks)

        expect(promise).toBeResolved(done)

      it "should handle error", (done) ->
        promise = Trade.buy(quote, 'fail')

        expect(promise).toBeRejected(done)

    describe "watchAddress", ->
      it "should set _watchAddressResolve", ->
        trade.watchAddress()
        expect(trade._watchAddressResolve).toBeDefined()

      it "should not set _watchAddressResolve if tx is already matched", ->
        trade._txHash = "1234"
        trade.watchAddress()
        expect(trade._watchAddressResolve).not.toBeDefined()


    describe "_monitorAddress()", ->
      refreshedState = "completed"

      beforeEach ->
        trade._state = "completed"
        trade._txHash = null
        trade._setTransactionHash = () -> Promise.resolve()

        # tradeWasPaid() calls _watchAddressResolve
        trade._watchAddressResolve = () ->

        spyOn(trade, "_watchAddressResolve")

        spyOn(trade, "refresh").and.callThrough()

        spyOn(trade._delegate, "save").and.callFake(() ->
          {
            then: (cb) ->
              cb()
          }
        )

      it "should call monitorAddress() on the delegate", ->
        spyOn(trade._delegate, "monitorAddress")
        trade._monitorAddress()
        expect(trade._delegate.monitorAddress).toHaveBeenCalled()

      it "should first refresh if trade is still awaiting_transfer_in", () ->
        trade._state = "awaiting_transfer_in"

        trade._delegate.monitorAddress = (address, callback) ->
          callback("transaction-hash", 1000)

        trade._monitorAddress()

        expect(trade.refresh).toHaveBeenCalled()


      it "should not call tradeWasPaid if state is awaiting_transfer_in after refresh", () ->
        trade._state = "awaiting_transfer_in"
        refreshedState = "awaiting_transfer_in"

        trade._delegate.monitorAddress = (address, callback) ->
          callback("transaction-hash", 1000)

        trade._monitorAddress()

        expect(trade._watchAddressResolve).not.toHaveBeenCalled()

      it "should not call tradeWasPaid if trade already has a hash", () ->
        trade._txHash = "other-transaction-hash"

        trade._delegate.monitorAddress = (address, callback) ->
          callback("transaction-hash", 1000)

        trade._monitorAddress()

        expect(trade._watchAddressResolve).not.toHaveBeenCalled()

        expect(trade.txHash).toEqual("other-transaction-hash")

    describe "_setTransactionHash", ->
      trade = undefined
      delegate = undefined
      tx = {hash: 'tx-hash', confirmations: 0}

      beforeEach ->
        delegate =
          checkAddress: (address) ->
            Promise.resolve(tx)

        trade = {
          receiveAddress: "trade-address"
          _delegate: delegate
          state: 'completed'
          debug: false
          _txHash: null
          _setTransactionHash: Trade.prototype._setTransactionHash
          _watchAddressResolve: () ->
        }

        spyOn(trade, "_watchAddressResolve").and.callThrough()

      afterEach ->
        trade = undefined

      describe "for a real trade", ->
        it "should set the hash if trade is completed", ->
          trade.state = 'completed'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._txHash).toEqual('tx-hash')


        it "should set the hash if trade is processing", ->
          trade.state = 'processing'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._txHash).toEqual('tx-hash')

        it "should resolve the watcher", ->
          trade.state = 'completed'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._watchAddressResolve).toHaveBeenCalled()

        it "should not override the hash if set earlier", ->
          trade.state = 'completed'
          trade._txHash = 'tx-hash-before'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._txHash).toEqual('tx-hash-before')

        it "should set the number of confirmations", ->
          trade.state = 'completed'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._confirmations).toEqual(0)

        it "should update the number of confirmations", ->
          trade.state = 'completed'
          tx.confirmations = 2
          tx.hash = 'tx-hash-before'
          trade._txHash = 'tx-hash-before'

          trade._setTransactionHash(tx, 2, delegate)

          expect(trade._confirmations).toEqual(2)

        it "should set _confirmed to true so it gets serialized", ->
          trade.state = 'completed'
          tx.confirmations = 6
          trade.confirmed = true # mock getter, the real one checks trade._confirmations

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._confirmed).toEqual(true)

      describe "for a test trade", ->
        it "should set the hash if trade is completed", ->
          trade.state = 'completed_test'
          tx.hash = 'tx-hash'

          trade._setTransactionHash(tx, 1, delegate)
          expect(trade._txHash).toEqual('tx-hash')

        it "should resolve the watcher", ->
          trade.state = 'completed_test'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._watchAddressResolve).toHaveBeenCalled()

        it "should not override the hash if set earlier", ->
          trade.state = 'completed_test'
          trade._txHash = 'tx-hash-before'

          trade._setTransactionHash(tx, 1, delegate)

          expect(trade._txHash).toEqual('tx-hash-before')

        it "should update the number of confirmations", ->
          trade.state = 'completed_test'
          tx.confirmations = 2
          tx.hash = 'tx-hash-before'
          trade._txHash = 'tx-hash-before'

          trade._setTransactionHash(tx, 2, delegate)

          expect(trade._confirmations).toEqual(2)
