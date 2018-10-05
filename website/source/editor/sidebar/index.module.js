module.exports = function(shared) {
  var vm = shared.vm;
  var AgExplorer = shared.AgExplorer;

  vm.openObject = function(object) {
    vm.getPage(object);
  };

  return function() {
    console.log('init!');
    AgExplorer.init({
      vm: vm,
      config: {
        model: shared.helpers.Model
      }
    });
  };
};
