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
    let paths = [];
    let log;
    let model;
    let relations = {};
    let result;
    let templateLocals;

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

        let pages = _.concat([], templateData.page, templateData.pages);

        pages.map(function(page) {
          if (!page) {
            return;
          }
          let sourcePath = page.location;
          let pagePath = _.get(page, 'data.path');

          if (pagePath) {
            pagePath = pagePath.split('/');
            if (_.last(pagePath) == 'index') {
              pagePath.pop();
            }
            pagePath = pagePath.join('/');
          }

          paths.push({
            source: `${sourcePath}.yml`,
            path: pagePath
          });
        });

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
          }).then(function(result) {
            relations = result.relations;
            templateLocals = result.locals;
          })
        ]);
      })
      .then(function() {
        result = {
          page: {
            id: item.id,
            data: item.__data,
            log: log
          },
          relations: relations
        };

        templateLocals = _.defaultsDeep({}, result.page.data, templateLocals);
        paths.map(function(pagePath) {
          pagePath.source = _.template(pagePath.source)(templateLocals);
          pagePath.path = _.template(pagePath.path)(templateLocals);
        });
      })
      .then(function() {
        return Model.loadTemplate(template);
      })
      .then(function(template) {
        result.template = template;
        result.page.paths = paths;
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
