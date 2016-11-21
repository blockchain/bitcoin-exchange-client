proxyquire = require('proxyquireify')(require)

API = () ->
  {
    GET: () ->
    POST: () ->
    PATCH: () ->
  }

PaymentMedium = {
  getAll: () ->
}

Quote = {
  getQuote: (api, delegate, amount, baseCurrency, quoteCurrency) ->
    Promise.resolve({
      baseAmount: amount,
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency
    })
}

Trade = (obj) ->
  obj
tradesJSON = [
  {
    id: 1
    state: "awaiting_transfer_in"
  }
]
Trade.spyableProcessTrade = () ->
Trade.fetchAll = () ->
  Promise.resolve([
    {
      id: tradesJSON[0].id
      state: tradesJSON[0].state
      process: Trade.spyableProcessTrade
    }
  ])

stubs = {
  './trade' : Trade
  './quote' : Quote
  './api' : API
  './payment-medium' : PaymentMedium
}

Exchange = proxyquire('../src/exchange-concrete', stubs)

describe "Exchange", ->

  e = undefined

  beforeEach ->
    JasminePromiseMatchers.install()

  afterEach ->
    JasminePromiseMatchers.uninstall()

  describe "class", ->
    describe "new Exchange()", ->

      it "should work", ->
        e = new Exchange({}, Trade, Quote)
        expect(e.constructor.name).toEqual("Exchange")

  describe "instance", ->
    beforeEach ->
      e = new Exchange({
        email: () -> "info@blockchain.com"
        isEmailVerified: () -> true
        getEmailToken: () -> "json-web-token"
        save: () -> Promise.resolve()
      }, Trade, Quote)
      e.api = new API()

    describe "debug", ->
      it "should set debug", ->
        e.debug = true
        expect(e.debug).toEqual(true)

      it "should set debug flag on the delegate", ->
        e._delegate = {debug: false}
        e.debug = true
        expect(e.delegate.debug).toEqual(true)

      it "should set debug flag on trades", ->
        e._trades = [{debug: false}]
        e.debug = true
        expect(e.trades[0].debug).toEqual(true)

    describe "api", ->
      it "should be a getter", ->
        api = {}
        e._api = api
        expect(e.api).toBe(api)

    describe "user", ->
      it "should be a getter", ->
        e._user = "1234"
        expect(e.user).toEqual("1234")

    describe "autoLogin", ->
      beforeEach ->
        spyOn(e.delegate, "save").and.callThrough()

      it "should update", ->
        e.autoLogin = false
        expect(e.autoLogin).toEqual(false)

      it "should save", ->
        e.autoLogin = false
        expect(e.delegate.save).toHaveBeenCalled()

      it "should check the input", ->
        expect(() -> e.autoLogin = "1").toThrow()

    describe 'getBuyMethods()', ->
      beforeEach ->
        spyOn(PaymentMedium, 'getAll')

      it 'should get payment methods with BTC as out currency', ->
        e.getBuyMethods()
        expect(PaymentMedium.getAll).toHaveBeenCalled()
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).not.toBeDefined()
        expect(PaymentMedium.getAll.calls.argsFor(0)[1]).toEqual('BTC')

    describe 'getSellMethods()', ->
      beforeEach ->
        spyOn(PaymentMedium, 'getAll')

      it 'should get payment methods with BTC as in currency', ->
        e.getSellMethods()
        expect(PaymentMedium.getAll).toHaveBeenCalled()
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('BTC')
        expect(PaymentMedium.getAll.calls.argsFor(0)[1]).not.toBeDefined()

    describe 'getBuyQuote', ->
      it 'should use Quote.getQuote', ->
        spyOn(Quote, "getQuote").and.callThrough()

        e.getBuyQuote(1000, 'EUR', 'BTC')

        expect(Quote.getQuote).toHaveBeenCalled()

      it 'should require a quote currency if base currency is BTC', ->
        expect(() -> e.getBuyQuote(100000, 'BTC')).toThrow()

      it 'should use a negative amount', (done) ->
        checks = (quote) ->
          expect(quote.baseAmount).toEqual(-1000)

        promise = e.getBuyQuote(1000, 'EUR', 'BTC').then(checks)

        expect(promise).toBeResolved(done)

      it 'should set the quote currency to BTC for fiat base currency', (done) ->
        checks = (quote) ->
          expect(quote.quoteCurrency).toEqual('BTC')

        promise = e.getBuyQuote(1000, 'EUR').then(checks)

        expect(promise).toBeResolved(done)

    describe 'getTrades()', ->
      it 'should call Trade.fetchAll', ->
        spyOn(Trade, 'fetchAll').and.callThrough()
        e.getTrades()
        expect(Trade.fetchAll).toHaveBeenCalled()

      it 'should store the trades', (done) ->
        checks = (res) ->
          expect(e._trades.length).toEqual(1)

        promise = e.getTrades().then(checks)
        expect(promise).toBeResolved(done)

      it 'should resolve the trades', (done) ->
        checks = (res) ->
          expect(res.length).toEqual(1)
          done()

        promise = e.getTrades().then(checks)

      it 'should call process on each trade', (done) ->
        spyOn(Trade, 'spyableProcessTrade')

        checks = (res) ->
          expect(Trade.spyableProcessTrade).toHaveBeenCalled()
          done()

        e.getTrades().then(checks)

      it "should update existing trades", (done) ->
        e._trades = [
          {
            _id: 1
            process: () ->
            state: 'awaiting_transfer_in'
            set: (obj) ->
              this.state = obj.state
          },
          {
            _id: 2
            process: () ->
            state: 'awaiting_transfer_in'
            set: () ->
              this.state = obj.state
          }
        ]

        tradesJSON[0].state = "completed_test"

        checks = () ->
          expect(e._trades.length).toBe(2)
          expect(e._trades[0].state).toEqual('completed_test')
          done()

        e.getTrades().then(checks)

      it "should not be case sensitive for existing trades", (done) ->
        e._trades = [
          {
            _id: "ab"
            process: () ->
            state: 'awaiting_transfer_in'
            set: (obj) ->
              this.state = obj.state
          },
          {
            _id: "cd"
            process: () ->
            state: 'awaiting_transfer_in'
            set: () ->
              this.state = obj.state
          }
        ]

        tradesJSON[0].id = "Ab"
        tradesJSON[0].state = "completed_test"

        checks = () ->
          expect(e._trades.length).toBe(2)
          expect(e._trades[0].state).toEqual('completed_test')
          done()

        e.getTrades().then(checks)

    describe 'monitorPayments()', ->
      it 'should call Trade.monitorPayments', ->
        spyOn(Trade, 'monitorPayments')
        e.monitorPayments()
        expect(Trade.monitorPayments).toHaveBeenCalled()
