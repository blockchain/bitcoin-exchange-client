// This is a mimimal implementation of Exchange, for
// the purpose of writing tests.

var AbstractExchange = require('./exchange');

var Trade = require('./trade');
var Quote = require('./quote');
var PaymentMedium = require('./payment-medium');

class Exchange extends AbstractExchange {
  constructor (delegate) {
    super(delegate, Trade, Quote, PaymentMedium);
  }
}

module.exports = Exchange;
