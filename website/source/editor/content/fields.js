/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/editor/content.module.js
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

module.exports = function(vm, helpers) {
  vm.dragControlListeners = {
    accept: function(sourceItemHandleScope, destSortableScope) {
      return (
        sourceItemHandleScope.itemScope.sortableScope.$id ===
        destSortableScope.$id
      );
    },
    itemMoved: function() {},
    orderChanged: function() {},
    containment: '.data-node',
    containerPositioning: 'relative'
  };

  vm.removeValue = function(key, data) {
    data = data.__value || data;
    if (_.isObject(data)) {
      delete data[key];
    }
    if (_.isArray(data)) {
      data.splice(key, 1);
    }
  };

  vm.onArrayField = function(field, data) {
    data = data.__value || data;
    var diff = field.min - data.length;
    if (field.min && diff > 0) {
      var key = field.fields[0].name;
      for (var i = 0; i < diff; i++) {
        vm.addValue(field, data, key);
      }
    }
  };
  vm.addValue = function(field, parent, key) {
    var parentValue = parent.__value || parent;

    if (field.fields) {
      var childField = _.find(field.fields, {
        name: key
      });

      if (!childField) {
        return console.error(
          'Must provide the right key for the field:',
          field,
          key
        );
      }

      var type = childField.valueType || childField.type;
      var value = helpers.fieldValue(childField);

      switch (type) {
        case 'date-time':
          if (value) {
            value = new Date(value);
          } else {
            value = Date.now();
          }
          //console.log(value);

          break;
      }
      key = pushValue(value);

      helpers.fixValue(parent, key, childField);
    }

    function pushValue(value) {
      switch (field.type) {
        case 'array':
          var length = parentValue.length;
          parentValue.push(value);
          return length;
        case 'object':
        case 'media':
          if (!key) {
            console.error('Must provide key for object', field);
          }
          parentValue[key] = value;
          return key;
        default:
          console.error(
            'Cannot add value to an unrecognised type: ',
            field.type
          );
          break;
      }
    }
  };

  vm.objectField = function(childField, parentField, parent, key) {
    var parentValue = parent.__value;
    var validators = childField.validators;
    var required = (validators && validators.required) || childField.required;
    //console.log(childField.name, required, parentValue[key]);
    if (required && !parentValue[key]) {
      vm.addValue(parentField, parent, key);
    }
  };

  vm.onFieldSelect = function(parentField, parentData, childField, key) {
    for (var name in childField.options) {
      var option = childField.options[name];
      if (option.require) {
        if (name == key) {
          vm.addValue(parentField, parentData, option.require);
        } else {
          vm.removeValue(option.require, parentData);
        }
      }
    }
  };

  vm.excerpt = function excerpt(data) {
    var res = vm.edit.lng(data);
    if (res) {
      return res;
    }

    if (angular.isArray(data)) {
      return excerpt(data[0]);
    }

    if (angular.isObject(data)) {
      return excerpt(data[Object.keys(data)[0]]);
    }

    return data;
  };
};
