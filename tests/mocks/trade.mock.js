const tradesJSON = [
  {
    id: 1,
    state: 'awaiting_transfer_in'
  },
  {
    id: 2,
    state: 'awaiting_transfer_in'
  }
];

let publicTradesJSON = [];

let init = () => {
  publicTradesJSON.length = 0;
  JSON.parse(JSON.stringify(tradesJSON)).forEach(tradeJSON => {
    publicTradesJSON.push(tradeJSON);
  });
};

init();

class Trade {
  constructor (obj) {
    this._fromApi = false;

    if (obj !== null) {
      this._id = obj.id;
    } else {
      this._id = null;
    }
  }

  get state () {
    return this._state;
  }

  get id () {
    return this._id;
  }

  process () {
  }

  setFromAPI (obj) {
    if (this.id === null) {
      this._id = obj.id;
    }
    this._fromApi = true;
    this._state = obj.state;
    Trade.spyableSetFromAPI();
  }

  static spyableSetFromAPI () {
  }

  static fetchAll () {
    return Promise.resolve(publicTradesJSON);
  }

  static idFromAPI (obj) {
    return obj.id;
  }
}

module.exports = {
  Trade: Trade,
  tradesJSON: publicTradesJSON,
  init: init
};
