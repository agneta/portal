/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/account/roleRemove.js
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

module.exports = function(Model) {

  Model.roleRemove = function(id, name) {

    var Account = Model.projectModel('Account');

    return Account.__get(id)
      .then(function(account) {

        var RoleModel = getRoleModel(account, name);

        return RoleModel.findOne({
          where: {
            accountId: account.id
          }
        });

      })
      .then(function(result) {

        if (!result) {
          return Promise.reject({
            statusCode: 400,
            message: 'Role was not found'
          });
        }

        return result.updateAttributes({
          status: 'inactive'
        });

      })
      .then(function() {
        return {
          message: 'The role was removed'
        };
      });

    function getRoleModel(account, name) {

      var role = Account.roleOptions[name];

      if (!role) {
        throw new Error('No role found: ' + name);
      }

      return Account.getModel(role.model);

    }

  };

  Model.remoteMethod(
    'roleRemove', {
      description: '',
      accepts: [{
        arg: 'id',
        type: 'string',
        required: true
      }, {
        arg: 'name',
        type: 'string',
        required: true
      }],
      returns: {
        arg: 'result',
        type: 'object',
        root: true
      },
      http: {
        verb: 'post',
        path: '/role-remove'
      }
    }
  );

};
