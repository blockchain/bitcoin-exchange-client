// This is a mimimal implementation of Quote, for
// the purpose of writing tests.

var AbstractQuote = require('./quote');
var Trade = require('./trade');
var PaymentMedium = require('./payment-medium');

class Quote extends AbstractQuote {
  constructor (api, delegate) {
    super(api, delegate, Trade, PaymentMedium);
  }
}

module.exports = Quote;
