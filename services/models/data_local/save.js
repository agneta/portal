/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/data-local/save.js
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
var path = require('path');
var fs = require('fs-extra');

module.exports = function(Model, app) {

  var web = app.web;
  var webPrj = web.project;

  Model.save = function(id, data) {

    var filePath = path.join(webPrj.paths.app.data, id + '.yml');

    return fs.access(filePath)
      .then(function() {
        return app.edit.saveYaml(filePath, data);
      })
      .then(function() {
        var relativePath = filePath.substring(webPrj.paths.app.website.length);
        return {
          message: `Saved at:\n${relativePath}`
        };
      });

  };

  Model.remoteMethod(
    'save', {
      description: 'Save project data',
      accepts: [{
        arg: 'id',
        type: 'string',
        required: true
      }, {
        arg: 'data',
        type: 'object',
        required: true
      }],
      returns: {
        arg: 'result',
        type: 'object',
        root: true
      },
      http: {
        verb: 'post',
        path: '/save'
      },
    }
  );

};
