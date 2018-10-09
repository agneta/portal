/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/data-remote/loadOne.js
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
const Promise = require('bluebird');
const _ = require('lodash');

module.exports = function(Model, app) {
  Model.loadOne = function(id, template, req) {
    let templateData;
    let item;
    let log;
    let model;
    let relations = {};
    let result;

    return Promise.resolve()
      .then(function() {
        return Model.__loadTemplateData({
          template: template
        });
      })
      .then(function(_templateData) {
        templateData = _templateData;
        return Model.getTemplateModel(template);
      })
      .then(function(_model) {
        model = _model;
        return model.findById(id);
      })
      .then(function(_item) {
        item = _item;

        if (!item) {
          return Promise.reject({
            statusCode: 404,
            message: `Could not find item with id: ${id}`
          });
        }

        //console.log(require('util').inspect(item, { depth: null }));

        return Promise.all([
          app.models.History.load({
            id: item.id,
            model: model
          }).then(function(_log) {
            log = _log;
          }),
          Model.getRelations({
            templateData: templateData,
            item: item,
            req: req
          }).then(function(_relations) {
            relations = _relations;
          })
        ]);
      })
      .then(function() {
        let paths = [];
        result = {
          page: {
            id: item.id,
            data: item.__data,
            log: log
          },
          relations: relations
        };

        let pages = _.concat([], templateData.page, templateData.pages);
        for (var page of pages) {
          if (!page) {
            continue;
          }
          let pagePath = _.template(page.location)({
            page: result.page.data,
            relation: relations
          });
          pagePath = pagePath.split('/');
          if (_.last(pagePath) == 'index') {
            pagePath.pop();
          }
          pagePath = pagePath.join('/');
          paths.push(pagePath);
        }

        result.page.paths = paths;
        return Model.loadTemplate(template);
      })
      .then(function(template) {
        result.template = template;
        return result;
      });
  };

  Model.remoteMethod('loadOne', {
    description: 'Load Project Data with specified ID',
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
      {
        arg: 'template',
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
