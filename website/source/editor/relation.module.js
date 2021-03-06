/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/editor/relation.module.js
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
  var helpers = options.helpers;
  var relation = {};

  relation.belongsTo = function(field) {
    var template = field.relation.template;
    if (!template) {
      return;
    }
    return helpers.Model.loadMany({
      template: template
    }).$promise.then(function(result) {
      helpers.checkPages(result.objects);
      field.options = result.objects;
    });
  };

  relation.load = function(item, field) {
    vm.getPage({
      id: item.id,
      template: field.relation.template
    });
  };

  vm.relation = relation;
};
