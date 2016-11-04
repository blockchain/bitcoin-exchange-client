// This is a mimimal implementation of PaymentMedium, for
// the purpose of writing tests.

var AbstractPaymentMedium = require('./payment-medium');

class PaymentMedium extends AbstractPaymentMedium {
  constructor (api, quote) {
    super(api, quote);
    this._inMedium = 'bank';
    this._outMedium = 'blockchain';

    this._fiatMedium = 'bank';
    this._inCurrencies = ['USD', 'BTC'];
    this._outCurrencies = ['BTC', 'USD'];
    this._inCurrency = 'USD';
    this._outCurrency = 'BTC';

    this._fee = 0;
    this._total = 0;
  }
}

module.exports = PaymentMedium;
