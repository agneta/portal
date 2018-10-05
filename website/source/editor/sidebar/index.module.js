agneta.directive('AgEditorList', function(AgExplorer, Page) {
  var vm = this;

  vm.openObject = function(object) {
    vm.getPage(object);
  };

  AgExplorer.init({
    vm: vm,
    config: {
      model: Page
    }
  });
});
