/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/dialog/page-add.js
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

(function() {
  agneta.directive('AgPageAdd', function(data, Portal) {
    var scopeEdit = data.scopeEdit;
    var helpers = data.helpers;
    var vm = this;

    agneta.extend(vm, 'AgDialogCtrl');

    vm.submit = function() {
      vm.loading = true;

      var fields = vm.formSubmitFields;
      var promise = helpers.Model.new(fields).$promise;

      if (helpers.isRemote) {
        promise.then(function(result) {
          return finalize(result);
        });
      } else {
        promise.then(function(result) {
          helpers.toast(result.message || 'File created');

          Portal.socket.once('page-reload', function() {
            return finalize(result);
          });
        });
      }

      function finalize(result) {
        return scopeEdit
          .getPage({
            id: result.id,
            template: fields.template
          })
          .then(function() {
            vm.close();
          })
          .finally(function() {
            vm.loading = false;
          });
      }
    };
  });
})();
