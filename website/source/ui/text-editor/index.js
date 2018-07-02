let app = angular.module('MainApp');

app.constant('NG_QUILL_CONFIG', {
  theme: 'snow'
});

app.config([
  'ngQuillConfigProvider',
  'NG_QUILL_CONFIG',

  function(ngQuillConfigProvider, NG_QUILL_CONFIG) {
    ngQuillConfigProvider.set(NG_QUILL_CONFIG);
  }
]);
