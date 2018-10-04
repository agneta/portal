const _ = require('lodash');
const humanizeString = require('humanize-string');
var Promise = require('bluebird');

module.exports = function(Model, app) {
  var loadDirectory = Model.loadDirectory;
  var project = app.web.project;
  Model.loadDirectory = function(req) {
    return Promise.resolve()
      .then(function() {
        return loadDirectory(req);
      })
      .then(function(result) {
        var omitKeys = _.map(result.templates || [], function(item) {
          return item.id;
        });
        var templates = _.keys(_.omit(project.site.templates, omitKeys)) || [];
        templates = _.map(templates, function(id) {
          return {
            id: id,
            title: humanizeString(id)
          };
        });
        templates = result.templates.concat(templates);
        templates = _.orderBy(templates, ['title']);
        result.templates = templates;
        return result;
      });
  };
};
