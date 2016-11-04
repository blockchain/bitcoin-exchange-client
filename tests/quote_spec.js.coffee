
proxyquire = require('proxyquireify')(require)

Trade = () ->
Trade.buy = () ->

PaymentMedium = () ->
PaymentMedium.getAll = () ->
  Promise.resolve([])

stubs = {
  './trade' : Trade,
  './payment-medium' : PaymentMedium
}

Quote = proxyquire('../src/quote-concrete', stubs)

describe "Quote", ->

  obj = undefined
  q = undefined
  api = undefined
  delegate = undefined

  beforeEach ->
    api = {}
    delegate  = {
      save: () -> Promise.resolve()
      trades: []
    }
    q = new Quote(api, delegate)

    q._id = '1'
    q._baseAmount = 1
    q._quoteAmount = 1
    q._baseCurrency = 'EUR'
    q._quoteCurrency = 'BTC'
    q._expiresAt = 1

  describe "class", ->
    describe "new Quote()", ->
      it "should construct a Quote", ->
        expect(q instanceof Quote).toBeTruthy()

    describe "getQuote()", ->
        it "should convert cents", (done) ->
          Quote.getQuote( 1000, 'EUR', 'BTC', ['EUR', 'BTC']).then((base_amount) ->
            expect(base_amount).toEqual('10.00')
          ).then(done)

        it "should convert satoshis", (done) ->
          Quote.getQuote( 100000000, 'BTC', 'EUR', ['EUR', 'BTC']).then((base_amount) ->
            expect(base_amount).toEqual('1.00000000')
          ).then(done)

        it "should check if the base currency is supported", (done) ->
          promise = Quote.getQuote( 100000000, 'XXX', 'BTC', ['EUR', 'BTC'])
          expect(promise).toBeRejected(done)

        it "should check if the quote currency is supported", (done) ->
          promise = Quote.getQuote( 100000000, 'EUR', 'DOGE', ['EUR', 'BTC'])
          expect(promise).toBeRejected(done)

  describe "instance", ->
    describe "getters", ->
      it "should work", ->
        expect(q.expiresAt).toBe(1)
        expect(q.baseCurrency).toBe('EUR')
        expect(q.quoteCurrency).toBe('BTC')
        expect(q.baseAmount).toBe(1)
        expect(q.quoteAmount).toBe(1)
        expect(q.id).toBe('1')
        expect(q.api).toBe(api)
        expect(q.delegate).toBe(delegate)
        expect(q.paymentMediums).toEqual(null)

    describe "debug", ->
      it "can be set", ->
        q.debug = true
        expect(q.debug).toEqual(true)

    describe "getPaymentMediums()", ->
      beforeEach ->
        spyOn(PaymentMedium, "getAll").and.callThrough()

      it "should cache the result", ->
        q._paymentMediums = []
        q.getPaymentMediums()
        expect(PaymentMedium.getAll).not.toHaveBeenCalled()

      it "should fetch mediums with fiat inCurrency if baseAmount is positive BTC...", ->
        q._baseAmount = 1
        q._baseCurrency = 'BTC'
        q._quoteCurrency = 'EUR'
        q.getPaymentMediums()
        expect(PaymentMedium.getAll).toHaveBeenCalled()
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('EUR')

      it "should fetch mediums with BTC inCurrency if baseAmount is negative BTC", ->
        q._baseAmount = -1
        q._baseCurrency = 'BTC'
        q._quoteCurrency = 'EUR'
        q.getPaymentMediums()
        expect(PaymentMedium.getAll).toHaveBeenCalled()
        expect(PaymentMedium.getAll.calls.argsFor(0)[0]).toEqual('BTC')
