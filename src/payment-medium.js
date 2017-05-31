var assert = require('assert');

class PaymentMedium {
  constructor (api, quote) {
    assert(this.constructor !== PaymentMedium, 'Abstract Class');
    assert(api, 'API required');
    this._api = api;

    if (quote) {
      this._quote = quote;
      this._TradeClass = quote._TradeClass;
    }

    this._accounts = [];
  }

  get accounts () { return this._accounts; }

  get inMedium () { return this._inMedium; }

  get outMedium () { return this._outMedium; }

  get fiatMedium () { return this._fiatMedium; }

  get inCurrencies () { return this._inCurrencies; }

  get outCurrencies () { return this._outCurrencies; }

  get inCurrency () { return this._inCurrency; }

  get outCurrency () { return this._outCurrency; }

  get inFixedFee () { return this._inFixedFee || 0; }

  get outFixedFee () { return this._outFixedFee || 0; }

  get inPercentageFee () { return this._inPercentageFee || 0; }

  get outPercentageFee () { return this._outPercentageFee || 0; }

  get minimumInAmounts () { return this._minimumInAmounts || {}; }

  get fee () { return this._fee; }

  get total () { return this._total; }

  /* Depending on the exchange partner, buy() needs to be called either on
     PaymentMedium or on PaymentAccount. Examples:
     * when buying with Coinify using a bank transfer, you don't need to register
       a specific bank account. Call buy() on the PaymentMedium instance.
     * when buying with SFOX via ACH, you need to specify which bank account.
       call buy on a PaymentAccount instance.
     * when selling with Coinify, you need to register the destination bank
       account first, so call sell() on a PaymentAccount instance.
  */

  buy () {
    if (!this._quote) {
      return Promise.reject('QUOTE_MISSING');
    }
    var delegate = this._quote.delegate;
    var addTrade = (trade) => {
      trade.debug = this._quote.debug;
      delegate.trades.push(trade);
      return delegate.save.bind(delegate)().then(() => trade);
    };

    return this._TradeClass.buy(
      this._quote,
      this.fiatMedium
    ).then(addTrade);
  }
}

module.exports = PaymentMedium;
