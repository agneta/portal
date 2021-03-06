/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/page/loadOne.js
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
const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');

module.exports = function(Model, app) {
  var source;
  var clientHelpers = app.web.app.locals;
  var project = app.web.project;
  Model.loadOne = function(id) {
    var result;
    var page;
    var log;

    return Model.getPage(id)
      .then(function(_page) {
        //////////////////////////////////////////
        page = _page;
        source = Model.pageSource(page);

        if (page.hasError) {
          return Promise.reject({
            statusCode: '400',
            message: `This page has an error.\nFor more details visit the page:\n<a href="${clientHelpers.get_path(
              page.path
            )}" target="_blank">${page.path}</a>`
          });
        }

        return fs
          .pathExists(path.join(process.cwd(), source))
          .then(function(exists) {
            if (!exists) {
              return;
            }
            return app.git
              .log({
                file: source
              })
              .then(function(_log) {
                log = _log;
              });
          });
      })
      .then(function() {
        return fs.readFile(project.theme.getFile(page.full_source));
      })
      .then(function(content) {
        var data = yaml.safeLoad(content);

        result = {
          page: {
            paths: [page.path],
            data: data,
            id: id,
            log: log
          }
        };
        return Model.loadTemplate(result.page.data.template);
      })
      .then(function(template) {
        result.template = template;
        return result;
      });
  };

  Model.remoteMethod('loadOne', {
    description: 'Load page with specified ID',
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
      {
        arg: 'req',
        type: 'object',
        http: {
          source: 'req'
        }
      }
    ],
    returns: {
      arg: 'result',
      type: 'object',
      root: true
    },
    http: {
      verb: 'get',
      path: '/load-one'
    }
  });
};
