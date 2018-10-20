const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');
const _ = require('lodash');

module.exports = function(Model, app) {
  var webProject = app.web.project;

  Model.generate = function(options) {
    let item = options.item;
    let templateData = options.templateData;
    let data = JSON.parse(JSON.stringify(item.__data));
    let templateLocals;
    return Promise.resolve()
      .then(function() {
        return Model.getRelations({
          item: item,
          templateData: templateData
        });
      })
      .then(function(relationsResult) {
        templateLocals = _.defaultsDeep({}, data, relationsResult.locals);

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
                  id: item.id
                },
                templateLocals
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

          content.generated = true;
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
      });
  };
};
