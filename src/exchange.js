
var assert = require('assert');
var Helpers = require('./helpers');

// This is poor man's abstract class:
// https://gist.github.com/Zodiase/af44115098b20d69c531

class Exchange {
  constructor (obj, delegate, api, TradeClass, QuoteClass, PaymentMediumClass) {
    assert(this.constructor !== Exchange, 'Abstract Class');
    assert(delegate, 'ExchangeDelegate required');
    assert(api, 'API class required');
    assert(TradeClass, 'Trade class required');
    assert(QuoteClass, 'Quote class required');
    assert(PaymentMediumClass, 'PaymentMedium class required');
    assert(QuoteClass.getQuote, 'Quote.getQuote missing');
    this._delegate = delegate;
    this._api = api;
    this._trades = [];
    this._TradeClass = TradeClass;
    this._QuoteClass = QuoteClass;
    this._PaymentMediumClass = PaymentMediumClass;

    this._trades = [];

    if (obj.trades) {
      for (let tradeObj of obj.trades) {
        var trade = new TradeClass(tradeObj, this._api, delegate);
        trade._getQuote = QuoteClass.getQuote; // Prevents circular dependency
        trade.debug = this._debug;
        this._trades.push(trade);
      }
    }
  }

  get api () { return this._api; }

  get debug () { return this._debug; }
  set debug (value) {
    this._debug = Boolean(value);
    this._delegate.debug = Boolean(value);
    for (let trade of this.trades) {
      trade.debug = Boolean(value);
    }
  }

  get user () { return this._user; }

  get autoLogin () { return this._auto_login; }
  set autoLogin (value) {
    assert(
      Helpers.isBoolean(value),
      'Boolean'
    );
    this._auto_login = value;
    this.delegate.save.bind(this.delegate)();
  }

  get trades () { return this._trades; }

  get delegate () { return this._delegate; }

  get profile () { return this._profile; }

  getBuyMethods () {
    return this._PaymentMediumClass.getAll(undefined, 'BTC', this._api);
  }

  getSellMethods () {
    return this._PaymentMediumClass.getAll('BTC', undefined, this._api);
  }

  getBuyQuote (amount, baseCurrency, quoteCurrency) {
    assert(baseCurrency, 'Specify base currency');
    assert(baseCurrency !== 'BTC' || quoteCurrency, 'Specify quote currency');
    // istanbul ignore else
    if (baseCurrency !== 'BTC') {
      quoteCurrency = 'BTC';
    }
    return this._QuoteClass.getQuote(this._api, this._delegate, -amount, baseCurrency, quoteCurrency, this._debug);
  }

  getSellQuote (amount, baseCurrency, quoteCurrency) {
    return this.getBuyQuote(-amount, baseCurrency, quoteCurrency);
  }

  getTrades (QuoteClass) {
    assert(QuoteClass, 'QuoteClass required');
    var save = () => {
      return this.delegate.save.bind(this.delegate)().then(() => this._trades);
    };
    var update = (tradeObjects) => {
      for (let tradeObj of tradeObjects) {
        let id = this._TradeClass.idFromAPI(tradeObj);

        let trade = this._trades.find(trade => {
          return String(trade.id).toLowerCase() === String(id).toLowerCase();
        });

        if (!trade) {
          // We don't cache e.g. cancelled trades
          trade = new this._TradeClass(null, this._api, this.delegate);
          trade._getQuote = QuoteClass.getQuote; // Prevents circular dependency
          this._trades.push(trade);
        }

        trade.setFromAPI(tradeObj);
      }
    };
    var process = () => {
      for (let trade of this._trades) {
        trade.process(this._trades);
      }
    };
    return this._TradeClass.fetchAll(this._api)
                       .then(update)
                       .then(process)
                       .then(save);
  }

  monitorPayments () {
    this._TradeClass.monitorPayments(this._trades, this.delegate);
  }
}

module.exports = Exchange;
