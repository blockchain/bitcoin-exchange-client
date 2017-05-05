// This is a mimimal implementation of Trade, for
// the purpose of writing tests.

var AbstractTrade = require('./trade');

class Trade extends AbstractTrade {
  constructor (obj, api, delegate) {
    super(obj, api, delegate);
    this._createdAt = new Date();
    this._inCurrency = 'USD';
    this._outCurrency = 'BTC';
    this._inAmount = 1000;
    this._outAmount = 5000000;
    this._medium = 'bank';
    this._state = 'pending';
    this._sendAmount = 1000;
    this._outAmount = 5000000;
    this._outAmountExpected = 5000000;
    this._receiveAddress = '1abc';
    this._account_index = 0; // TODO: remove explicit reference to BIP 44 wallet
    this._txHash = null;
    this._bankAccountNumber = '1234 ABCD 5678 EFGH';
    this._transferIn = { details: { account: '123456789abcdefgh' } };
    this._iSignThisID = 'adsf231413-5c8f-4ecc-82jf-asdf22424';
  }

  refresh () {
    return Promise.resolve();
  }

  static buy (quote, medium) {
    const request = (receiveAddress) => {
      if (medium === 'fail') {
        return Promise.reject();
      } else {
        return Promise.resolve({});
      }
    };
    return super.buy(quote, medium, request);
  }

  static sell (quote, bankId) {
    const request = (bankId) => {
      if (bankId === 'fail') {
        return Promise.reject();
      } else {
        return Promise.resolved({});
      }
    };
    return super.sell(quote, bankId, request);
  }
}

module.exports = Trade;
