/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/account/deactivateAdmin.js
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

  var Account = Model.getModel('Account');

  Model.deactivate = function(id, req) {

    return Account.__signOutAll(id)
      .then(function() {
        return Account.__get(id);
      })
      .then(function(account) {
        return account.updateAttributes({
          deactivated: true
        });
      })
      .then(function() {

        Account.activity({
          req: req,
          action: 'deactivate_account_admin'
        });

        return {
          success: {
            title: 'Deactivation Complete',
            content: 'The account may be recovered by trying to login again.'
          }
        };

      });

  };

  Model.remoteMethod(
    'deactivate', {
      description: 'Deactivate Account with given ID',
      accepts: [{
        arg: 'id',
        type: 'string',
        required: true
      }, {
        arg: 'req',
        type: 'object',
        'http': {
          source: 'req'
        }
      }],
      returns: {
        arg: 'result',
        type: 'object',
        root: true
      },
      http: {
        verb: 'post',
        path: '/deactivate'
      }
    }
  );


};
