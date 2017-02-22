# Bitcoin Exchange Javascript Client [![Build Status](https://travis-ci.org/blockchain/bitcoin-exchange-client.png?branch=master)](https://travis-ci.org/blockchain/bitcoin-exchange-client) [![Coverage Status](https://coveralls.io/repos/blockchain/bitcoin-exchange-client/badge.svg?branch=master&service=github)](https://coveralls.io/github/blockchain/bitcoin-exchange-client?branch=master)

This is used by [My-Wallet-V3](https://github.com/blockchain/My-Wallet-V3/tree/master/src/coinify).

## Development

If you need to test changes to this module inside bitcoin-coinify-client:

```sh
cd ..
rm -rf bitcoin-coinify-client/node_modules/bitcoin-exchange-client
ln -s ../../bitcoin-exchange-client bitcoin-coinify-client/node_modules/bitcoin-exchange-client
```

## Release

Change version in `package.json`.

```sh
git commit -a -m "v0.1.0"
git push
git tag -s v0.1.0
git push --tags
make changelog
```

Add the changelog to the tag on Github and mark it as pre-release.

```sh
npm publish
```
