proxyquire = require('proxyquireify')(require)

stubs = {
}

PaymentMedium    = proxyquire('../src/payment-medium-concrete', stubs)
api = undefined

beforeEach ->
  api = {mock: "api"}

  JasminePromiseMatchers.install()

afterEach ->
  JasminePromiseMatchers.uninstall()

describe "Payment Medium", ->
  describe "class", ->
    describe "constructor", ->
      it "should keep a reference to the api", ->
        b = new PaymentMedium(api, undefined, {})
        expect(b._api).toEqual(api)

  describe "instance", ->
    p = undefined
    delegate = undefined

    beforeEach ->
      quote = {}

      delegate =
        save: () -> Promise.resolve()

      p = new PaymentMedium(api, quote)

    it "should have getters", ->
      expect(p.accounts).toEqual([])
      expect(p.fiatMedium).toEqual('bank')
      expect(p.inCurrencies).toEqual(['USD', 'BTC'])
      expect(p.outCurrencies).toEqual(['BTC', 'USD'])
      expect(p.inCurrency).toEqual('USD')
      expect(p.outCurrency).toEqual('BTC')
      expect(p.inMedium).toEqual('bank')
      expect(p.outMedium).toEqual('blockchain')
      expect(p.fee).toEqual(0)
      expect(p.total).toEqual(0)

    it "should have fixed fee getters that default to 0", ->
      expect(p.inFixedFee).toEqual(0)
      p._inFixedFee = 1
      expect(p.inFixedFee).toEqual(1)

      expect(p.outFixedFee).toEqual(0)
      p._outFixedFee = 1
      expect(p.outFixedFee).toEqual(1)

    it "should have percentage fee getters that default to 0", ->
      expect(p.inPercentageFee).toEqual(0)
      p._inPercentageFee = 1
      expect(p.inPercentageFee).toEqual(1)

      expect(p.outPercentageFee).toEqual(0)
      p._outPercentageFee = 1
      expect(p.outPercentageFee).toEqual(1)
