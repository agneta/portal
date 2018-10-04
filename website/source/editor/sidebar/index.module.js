agneta.directive('AgEditorList', function(AgExplorer, Page) {
  var vm = this;

  vm.openObject = function(object) {
    vm.getPage(object.path);
  };

  AgExplorer.init({
    vm: vm,
    config: {
      model: Page
    }
  });
});
