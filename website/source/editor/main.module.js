/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/editor/main.module.js
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

module.exports = function(options) {
  var vm = options.vm;
  var $rootScope = options.$rootScope;
  var helpers = options.helpers;
  var $location = options.$location;
  var $routeParams = options.$routeParams;
  var $timeout = options.$timeout;
  var $mdDialog = options.$mdDialog;
  var scopeEdit = options.scopeEdit;
  var Portal = options.Portal;
  var pageLoading = false;
  vm.getPage = function(obj) {
    if (pageLoading) {
      return;
    }
    obj = obj || vm.page.id;
    var id = obj.id || obj;
    $rootScope.loadingMain = pageLoading = true;

    var template = obj.template || vm.dir.location;

    return helpers.Model.loadOne({
      id: id,
      template: template
    })
      .$promise.then(onPageLoaded)
      .finally(function() {
        $timeout(function() {
          $rootScope.loadingMain = pageLoading = false;
        }, 500);
      })
      .catch(console.error);
  };

  function onPageLoaded(result) {
    var data = result.page.data;
    vm.template = result.template;

    if (vm.template) {
      for (var i in vm.template.fields) {
        var field = vm.template.fields[i];
        data[field.name] = data[field.name] || helpers.fieldValue(field);
      }
    }

    for (var name in result.relations) {
      result.relations[name] = helpers.checkPage(result.relations[name]);
    }

    vm.relations = result.relations;
    vm.pagePath = result.page.path;
    helpers.structureData(vm.template, data);

    $location.search({
      id: result.page.id,
      location: result.template.id
    });

    vm.work = null;
    vm.page = {};

    $timeout(function() {
      vm.page = result.page;
    }, 300);
  }

  vm.pageActive = function(id) {
    if (vm.page) {
      return id == vm.page.id ? 'active' : null;
    }
  };

  vm.pageDelete = function() {
    var confirm = $mdDialog
      .confirm()
      .title('Deleting Page')
      .textContent('Are you sure you want to delete this page?')
      .ok('Yes')
      .cancel('Cancel');

    $mdDialog.show(confirm).then(function() {
      helpers.Model.delete({
        id: vm.page.id,
        template: vm.dir.location
      }).$promise.then(function() {
        onReload();
        helpers.toast('File deleted');
        Portal.socket.once('page-reload', onReload);
      });
    });

    function onReload() {
      $timeout(function() {
        vm.page = null;
      }, 10);
    }
  };

  vm.pageAdd = function() {
    $mdDialog.open({
      partial: 'page-add',
      data: {
        scopeEdit: scopeEdit,
        helpers: helpers
      }
    });
  };

  vm.push = function() {
    $mdDialog.open({
      partial: 'push-changes',
      data: {
        helpers: helpers
      }
    });
  };

  vm.$watch('dir', function(value) {
    let location = null;
    if (value) {
      location = value.location;
      if (!location.length) {
        location = null;
      }
      let template = vm.template || {};
      template.id = location;
      vm.template = template;
    }
    $location.search({
      id: location != $routeParams.location ? null : $routeParams.id,
      location: location
    });
  });

  (function() {
    var pending = false;

    vm.save = function() {
      if (!vm.page) {
        return;
      }

      if (pending) {
        return;
      }

      vm.error = null;
      $rootScope.loadingMain = true;
      pending = true;

      setTimeout(function() {
        pending = false;

        vm.clearHiddenData();

        helpers.Model.save({
          id: vm.page.id,
          template: vm.dir.location,
          data: vm.page.data
        })
          .$promise.then(function(result) {
            if (result.error) {
              vm.error = result.error;
              return;
            }
            if (result.page) {
              onPageLoaded(result);
            }
            helpers.toast(result.message || 'Changes saved');
          })
          .finally(function() {
            $rootScope.loadingMain = false;
          });
      }, 1400);
    };
  })();
};
