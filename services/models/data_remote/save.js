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
const Promise = require('bluebird');

module.exports = function(Model, app) {
  var clientHelpers = app.client.app.locals;

  Model.save = function(id, template, data, req) {
    let templateData;
    let model;
    let item;
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

        return item.updateAttributes(data).then(function(_item) {
          item = _item;
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
        return Model.generate({
          item: item,
          templateData: templateData
        });
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
