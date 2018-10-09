const Promise = require('bluebird');

module.exports = function(Model, app) {
  Model.getRelations = function(options) {
    let templateData = options.templateData;
    let item = options.item;
    let relations = {};
    return Promise.map(templateData.relations, function(relation) {
      if (relation.type != 'relation-belongsTo') {
        return;
      }

      return Promise.resolve()
        .then(function() {
          let itemId = item[relation.key];
          if (!itemId) {
            return;
            //throw new Error(`Relation needs to have an ID at field: ${relation.key}`);
          }
          return Model.getTemplateModel(relation.template).then(function(
            model
          ) {
            return model.findById(itemId, {
              fields: {
                id: true,
                title: true,
                name: true
              }
            });
          });
        })
        .then(function(result) {
          result = app.lngScan(result);
          relations[relation.name] = result || {};
        });
    }).then(function() {
      return relations;
    });
  };
};
