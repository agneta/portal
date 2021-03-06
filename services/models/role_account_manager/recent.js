/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/account/recent.js
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

  Model.recent = function(limit) {

    limit = limit || 5;
    let count;
    var Account = Model.getModel('Account');

    return Account.count()
      .then(function(_count){

        count = _count;

        return Account.find({
          order: 'createdAt DESC',
          limit: limit
        });
      })
      .then(function(list){
        return {
          list: list,
          count: count
        };
      });

  };


  Model.remoteMethod(
    'recent', {
      description: 'Get recently created accounts',
      accepts: [{
        arg: 'limit',
        type: 'number',
        required: false
      }],
      returns: {
        arg: 'result',
        type: 'object',
        root: true
      },
      http: {
        verb: 'get',
        path: '/recent'
      }
    }
  );

};
