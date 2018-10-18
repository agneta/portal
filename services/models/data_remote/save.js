/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/services/models/data-remote/save.js
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
const _ = require('lodash');
const diff = require('deep-diff').diff;
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');

module.exports = function(Model, app) {
  var clientHelpers = app.client.app.locals;
  var webProject = app.web.project;

  Model.save = function(id, template, data, req) {
    let templateData;
    let model;
    let item;
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
            message: `Item not found with id: ${id}`
          });
        }

        var writableFields = ['skip'];
        for (let field of templateData.fields) {
          if (field.readonly) {
            continue;
          }
          if (field.readOnly) {
            continue;
          }
          writableFields.push(field.name);
        }

        data = clientHelpers.get_values(data);
        data = _.pick(data, templateData.fieldNames.concat(writableFields));

        if (model.validateData) {
          // Important to alter data before saved into database so that the diff behaves properly
          return model.validateData(data);
        }
      })
      .then(function() {
        var differences = diff(
          _.pick(item.__data, templateData.fieldNames),
          data
        );

        if (!differences) {
          return;
        }
        if (!differences.length) {
          return;
        }
        //console.log(data);

        return item.updateAttributes(data).then(function(item) {
          return app.models.History.add({
            model: model,
            data: data,
            id: item.id,
            diff: differences,
            req: req
          });
        });
      })
      .then(function() {
        return Model.getRelations({
          item: item,
          templateData: templateData
        });
      })
      .then(function(relationsResult) {
        templateLocals = _.defaultsDeep(
          {},
          item.__data,
          relationsResult.locals
        );

        let pages = templateData.pages || [];
        if (templateData.page) {
          pages.push(templateData.page);
        }
        if (!pages.length) {
          return;
        }

        if (!_.isString(data.name)) {
          return;
        }

        let fieldsBase = ['title', 'cover', 'name', 'description', 'skip'];

        return Promise.map(pages, function(page) {
          if (!page) {
            return;
          }
          let fields = page.fields || [];
          let fieldMap = {};
          fields = fields.map(function(field) {
            let parsed = field.split('@');
            if (parsed[1]) {
              fieldMap[parsed[0]] = parsed[1];
              return parsed[0];
            }
            return field;
          });
          fields = fieldsBase.concat(fields);
          var pageData = _.pick(data, fields);
          for (var key in fieldMap) {
            var name = fieldMap[key];
            pageData[name] = pageData[key];
            delete pageData[key];
          }
          pageData = _.extend({}, pageData, page.data);

          for (let key in pageData) {
            let value = pageData[key];
            if (_.isString(value)) {
              pageData[key] = template(value);
            }
          }

          if (page.viewData) {
            pageData.viewData = _.pick(
              _.extend(
                {
                  id: id
                },
                data
              ),
              page.viewData
            );
          }

          var content = yaml.safeDump(pageData);
          var fileName = template(page.location) || '';
          var fileNameParsed = fileName.split('/');
          if (fileNameParsed.length != _.compact(fileNameParsed).length) {
            console.log(
              `Could not save file due to incorrect path: ${page.location}`
            );
            return;
          }
          var outputPath =
            path.join(webProject.paths.app.source, fileName) + '.yml';

          return fs.outputFile(outputPath, content);
        });

        function template(content) {
          var result;
          try {
            result = _.template(content)(templateLocals);
          } catch (err) {
            result = null;
          }
          return result;
        }
      })
      .then(function() {
        return Model.loadOne(id, template);
      })
      .catch(function(error) {
        console.log(error);
        if (_.isError(error)) {
          error = {
            message: error.message,
            stack: error.stack
          };
        }
        return {
          error: error
        };
      });
  };

  Model.remoteMethod('save', {
    description: 'Save project data',
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
        arg: 'data',
        type: 'object',
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
      verb: 'post',
      path: '/save'
    }
  });
};
