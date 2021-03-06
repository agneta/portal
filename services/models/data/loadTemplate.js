const _ = require('lodash');
module.exports = function(Model, app) {
  Model.__loadTemplateData = function(options) {
    return Promise.resolve()
      .then(function() {
        if (!options.data) {
          if (!options.template) {
            console.error(options);
            return Promise.reject(new Error('Template is undefined'));
          }
          return Model.__getTemplatePath(options.template);
        }

        return options.path;
      })
      .then(function(templatePath) {
        var templateOptions = _.extend(options, {
          path: templatePath
        });

        return app.web.services.edit.loadTemplate(templateOptions);
      });
  };

  Model.__loadTemplate = function(options) {
    var orderFields = [];

    return Promise.resolve()
      .then(function() {
        return Model.__loadTemplateData(options);
      })
      .then(function(templateData) {
        templateData.list.order.map(function(fieldName) {
          var field = templateData.field[fieldName];
          if (!field) {
            return;
          }
          var title = app.lng(field.title, options.req);
          orderFields.push({
            title: `${title} - Ascending`,
            value: `${field.name} ASC`
          });
          orderFields.push({
            title: `${title} - Descending`,
            value: `${field.name} DESC`
          });
        });

        var fields = templateData.fields.map(function(field) {
          field = _.cloneDeep(field);
          field.relation = _.omit(field.relation, ['templateData']);
          field = app.lngScan(field);
          return field;
        });

        return {
          fields: fields,
          eval: templateData.eval || {},
          orderList: orderFields,
          title: app.lng(templateData.title, options.req),
          id: options.template
        };
      });
  };

  Model.loadTemplate = function(template, req) {
    return Model.__loadTemplate({
      template: template,
      req: req
    });
  };
};
