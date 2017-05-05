// This is a mimimal implementation of Exchange, for
// the purpose of writing tests.

var AbstractExchange = require('./exchange');

var Trade = require('./trade');
var Quote = require('./quote');
var PaymentMedium = require('./payment-medium');

class Exchange extends AbstractExchange {
  constructor (obj, delegate) {
    let api = {};
    super(obj, delegate, api, Trade, Quote, PaymentMedium);
  }
}

module.exports = Exchange;
