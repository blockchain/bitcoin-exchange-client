var Helpers = require('./helpers');
var assert = require('assert');

class Quote {
  constructor (api, delegate, TradeClass, PaymentMediumClass) {
    assert(this.constructor !== Quote, 'Abstract Class');
    assert(api, 'API required');
    assert(delegate, 'ExchangeDelegate required');
    assert(TradeClass, 'Trade class required');
    assert(PaymentMediumClass, 'PaymentMedium class required');
    assert(PaymentMediumClass.getAll, 'PaymentMedium.getAll missing');
    assert(TradeClass.buy, 'Trade.buy() missing');

    this._api = api;
    this._delegate = delegate;
    this._TradeClass = TradeClass;
    this._PaymentMediumClass = PaymentMediumClass;
    this._timeOfRequest = new Date().getTime();

    this._paymentMediums = null;
  }

  get id () { return this._id; }

  get debug () { return this._debug; }
  set debug (value) {
    this._debug = Boolean(value);
  }

  get api () { return this._api; }

  get delegate () { return this._delegate; }

  get baseCurrency () { return this._baseCurrency; }

  get quoteCurrency () { return this._quoteCurrency; }

  get feeCurrency () { return this._feeCurrency; }

  get baseAmount () { return this._baseAmount; }

  get quoteAmount () { return this._quoteAmount; }

  get feeAmount () { return this._feeAmount; }

  get expiresAt () { return this._expiresAt; }

  get timeOfRequest () { return this._timeOfRequest; }

  get timeToExpiration () { return this._expiresAt - this._timeOfRequest - 1000; }

  get paymentMediums () { return this._paymentMediums; }

  static getQuote (amount, baseCurrency, quoteCurrency, supportedCurrencies, debug) {
    assert(Helpers.isInteger(amount), 'amount must be in cents or satoshi');

    if (supportedCurrencies.indexOf(baseCurrency) === -1) {
      return Promise.reject('base_currency_not_supported');
    }

    if (supportedCurrencies.indexOf(quoteCurrency) === -1) {
      return Promise.reject('quote_currency_not_supported');
    }

    // istanbul ignore if
    if (baseCurrency === 'CNY' || quoteCurrency === 'CNY') {
      console.warn('CNY has only 1 decimal place');
    }

    var baseAmount;
    if (baseCurrency === 'BTC') {
      baseAmount = (amount / 100000000).toFixed(8);
    } else {
      baseAmount = (amount / 100).toFixed(2);
    }
    return Promise.resolve(baseAmount);
  }

  getPaymentMediums () {
    var self = this;

    var setPaymentMediums = function (paymentMediums) {
      self._paymentMediums = paymentMediums;
      return self.paymentMediums;
    };

    let inCurrency = this.baseCurrency;
    let outCurrency = this.quoteCurrency;
    if (this.baseCurrency === 'BTC' && this.baseAmount > 0) {
      inCurrency = this.quoteCurrency;
      outCurrency = this.baseCurrency;
    }

    if (this.paymentMediums) {
      return Promise.resolve(this.paymentMediums);
    } else {
      return this._PaymentMediumClass.getAll(inCurrency, outCurrency, this._api, this)
                          .then(setPaymentMediums);
    }
  }
}

module.exports = Quote;
