/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/utility/state.js
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
module.exports = function(Model,app) {

  Model.state = function(name,req) {
    return Model.getUtility(name)
      .then(function(utility) {
        return {
          status: utility.instance.status,
          confirm: utility.instance.confirm,
          parameters: app.lngScan(utility.instance.parameters,req)
        };
      });
  };

  Model.remoteMethod(
    'state', {
      description: 'Get current state of the utility',
      accepts: [{
        arg: 'name',
        type: 'string',
        required: true
      },{
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
        verb: 'get',
        path: '/state'
      },
    }
  );

};
