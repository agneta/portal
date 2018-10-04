/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/editor.js
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

/*global _:true*/

require('editor/field-menu.module');
agneta.directive('AgEditMainCtrl', function(
  $rootScope,
  $injector,
  $q,
  $routeParams,
  $timeout,
  $mdToast,
  $interpolate,
  Account,
  AgMedia,
  $location,
  $mdDialog,
  Portal,
  Role_Editor
) {
  var vm = this;
  var helpers = {};
  var scopeEdit = vm;

  vm.mainForm = {};

  vm.edit = {};
  vm.sidebar = {};
  vm.templates = null;
  vm.pages = null;
  vm.page = null;

  vm.edit.lang = agneta.lang;

  var shared = {
    vm: vm,
    $rootScope: $rootScope,
    $q: $q,
    helpers: helpers,
    AgMedia: AgMedia,
    $location: $location,
    $mdToast: $mdToast,
    $routeParams: $routeParams,
    $timeout: $timeout,
    $interpolate: $interpolate,
    $injector: $injector,
    $mdDialog: $mdDialog,
    scopeEdit: scopeEdit,
    Portal: Portal
  };

  require('./field-state.module')(vm, helpers);
  require('./content/fields')(vm, helpers);
  require('./media.module')(shared);
  require('./relation.module')(shared);
  require('./helpers.module')(shared);
  require('./history.module')(vm, helpers);
  require('./main.module')(shared);
  require('./search.module')(vm, $timeout);
  require('./source.module')(vm, $mdDialog, $timeout);
  require('./contributor.module')(
    vm,
    $rootScope,
    Account,
    Portal,
    $timeout,
    Role_Editor
  );

  vm.onKeyPress = function(event) {
    var languages = $$template.configGet('languages');
    // CTRL + SHIFT + S : Save Changes
    if (event.ctrlKey && event.shiftKey && event.keyCode == 19) {
      vm.save();
    }
    // CTRL + SHIFT + L : Change Language
    if (event.ctrlKey && event.shiftKey && event.keyCode == 12) {
      var index = _.findIndex(languages, {
        key: vm.edit.lang
      });
      index++;
      if (index == languages.length) {
        index = 0;
      }
      var language = languages[index];
      vm.edit.lang = language.key;
    }
  };

  vm.edit.lng = function(data) {
    if (!data) {
      return;
    }

    if (_.isObject(data)) {
      data = data.__value || data;
    }
    if (_.isString(data)) {
      return data;
    }
    var result = data[vm.edit.lang] || '';

    if (!result.length) {
      result = data[agneta.lang] || '';
    }

    if (!result.length) {
      for (var key in data) {
        result = data[key] || '';
        if (result.length) {
          break;
        }
      }
    }

    return result;
  };

  vm.toggleView = function(data) {
    console.log(data);
    let hidden = !data._expanded;
    let value = helpers.dataValue(data);

    if (_.isArray(value)) {
      for (let item of value) {
        if (item.__id) {
          item.__hidden = hidden;
        }
      }
    }

    if (_.isObject(value)) {
      for (let key in value) {
        let item = value[key];
        if (item.__id) {
          item.__hidden = hidden;
        }
      }
    }

    data._expanded = hidden;
  };

  vm.isArray = function(val) {
    return angular.isArray(val);
  };

  vm.init = function(options) {
    helpers.Model = options.model;
    helpers.mediaRoot = options.mediaRoot;
    helpers.isRemote = options.isRemote;
  };

  vm.isInline = function(field) {
    switch (field.type) {
      case 'text-single':
      case 'value':
      case 'select':
        return true;
    }
    return false;
  };

  vm.getField = function(field, key) {
    return _.find(field.fields, {
      name: key.__key || key
    });
  };

  vm.$broadcast('code:ready');
});
