module.exports = function (config) {
  var configuration = {
    basePath: './',

    frameworks: ['jasmine', 'browserify'],

    browsers: ['PhantomJS'],

    browserNoActivityTimeout: 1000,

    reportSlowerThan: 50,

    logLevel: config.LOG_WARN,

    client: {
      captureConsole: true
    },

    autoWatch: true,

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      reporters: [
        { type: 'html', dir: 'coverage/' },
        { type: 'lcov', dir: 'coverage-lcov/' }
      ],

      subdir: '.'
    },

    preprocessors: {
      'src/**/*.js': ['browserify'],
      'tests/**/*.coffee': ['browserify']
    },

    browserify: {
      configure: function (bundle) {
        bundle.once('prebundle', function () {
          bundle.transform('coffeeify');
          bundle.transform('browserify-istanbul'); // Must go first
          bundle.transform('babelify', {
            presets: ['es2015'],
            sourceMap: 'inline'
          });

          bundle.plugin('proxyquireify/plugin');
        });
      },
      debug: true
    },

    coffeePreprocessor: {
      // options passed to the coffee compiler
      options: {
        bare: true,
        sourceMap: true
      },
      // transforming the filenames
      transformPath: function (path) {
        return path.replace(/\.coffee$/, '.js');
      }
    },

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/jasmine-es6-promise-matchers/jasmine-es6-promise-matchers.js',
      'tests/*_spec.js.coffee'
    ]
  };

  config.set(configuration);
};
