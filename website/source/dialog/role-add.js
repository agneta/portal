/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/dialog/role-add.js
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

  agneta.directive('AgRoleAdd', function(AccountList, data) {

    var vm = this;

    agneta.extend(vm, 'AgDialogCtrl');
    vm.data = data;


    vm.submit = function() {

      vm.loading = true;

      AccountList.model.roleAdd({
        id: data.account.id,
        name: vm.role
      })
        .$promise
        .finally(function() {

          vm.loading = false;
          data.reloadAccount();

        });
    };

  });
})();