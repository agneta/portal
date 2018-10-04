var app = angular.module('MainApp');

app.service('AgMediaExplorer', function(Upload, AgExplorer) {
  this.init = function(options) {
    var vm = options.vm;
    var config = options.config;

    AgExplorer.init(options);

    config.preview.toScope(vm);

    vm.uploadFiles = function(objects, errFiles) {
      if (errFiles && errFiles.length) {
        console.error(errFiles);
      }

      if (objects && objects.length) {
        Upload.upload({
          url: agneta.url(config.api + 'upload-files'),
          data: {
            dir: vm.dir.location,
            objects: objects
          },
          arrayKey: ''
        }).then(
          function() {},
          function(response) {
            if (response.status > 0)
              vm.errorMsg = response.status + ': ' + response.data;
          },
          function(evt) {
            vm.uploadProgress = Math.min(
              100,
              parseInt((100.0 * evt.loaded) / evt.total)
            );
          }
        );
      }
    };
  };
});
