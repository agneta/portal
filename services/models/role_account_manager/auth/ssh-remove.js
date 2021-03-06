/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/account/auth/ssh-remove.js
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


  Model.sshRemove = function(accountId,keyId) {

    var Account = Model.getModel('Account');

    return Account.__get(accountId)
      .then(function(account) {
        return account.ssh.findById(keyId);
      })
      .then(function(key) {
        if(!key){
          return Promise.reject({
            message: 'SSH Key not found',
            statusCode: 401
          });
        }
        return key.destroy();
      })
      .then(function(){
        return {
          message: 'SSH Key removed from account'
        };
      });

  };

  Model.remoteMethod(
    'sshRemove', {
      description: 'Remove SSH Key from account',
      accepts: [{
        arg: 'accountId',
        type: 'string',
        required: true
      },{
        arg: 'keyId',
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
        path: '/ssh-remove'
      }
    }
  );

};
