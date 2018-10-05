var fs = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var yaml = require('js-yaml');
var klaw = require('klaw');
const _ = require('lodash');

module.exports = function(Model, app) {
  return function(options) {
    var req = options.req;
    var items = {};

    return Promise.map(Model.__dataDirs, function(dataDir) {
      return Promise.resolve()
        .then(function() {
          return fs.ensureDir(dataDir);
        })
        .then(function() {
          return new Promise(function(resolve, reject) {
            klaw(dataDir)
              .on('data', function(item) {
                if (!item.stats.isFile()) {
                  return;
                }
                var id = path.relative(dataDir, item.path).slice(0, -4);
                items[id] = {
                  path: item.path,
                  id: id
                };
              })
              .on('error', reject)
              .on('end', resolve);
          });
        });
    })
      .then(function() {
        return Promise.map(_.values(items), function(item) {
          return fs.readFile(item.path).then(function(content) {
            var data = yaml.safeLoad(content);
            var id = item.id;
            return {
              id: id,
              title: app.lng(data.title, req),
              path_default: data.path_default
            };
          });
        });
      })
      .then(function(templates) {
        templates = _.orderBy(templates, ['title']);
        return {
          templates: templates
        };
      });
  };
};
