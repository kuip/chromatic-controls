Package.describe({
  name: 'kuip:chromatic-controls',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Dynamic exploration and testing of React components for Chromatic',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/kuip/chromatic-controls.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({'dat-gui': '0.5.0'})

Package.onUse(function(api) {
  api.versionsFrom('1.3.4');
  api.use([
    'ecmascript',
  ], 'client');
  api.mainModule('chromatic-controls.js', 'client');
  api.addFiles('chromatic-controls.css', 'client')
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('kuip:chromatic-controls');
  api.mainModule('chromatic-controls-tests.js');
});
