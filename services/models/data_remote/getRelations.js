const Promise = require('bluebird');
const _ = require('lodash');

module.exports = function(Model, app) {
  Model.getRelations = function(options) {
    _.defaults(options, {
      scope: {}
    });
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
            let findOptions = _.defaults(options.scope[relation.name], {
              include: [],
              fields: []
            });

            findOptions.fields = findOptions.fields.concat(['id', 'title']);
            findOptions.fields = _.uniq(findOptions.fields);

            findOptions.include.map(function(item) {
              var templateRelation = _.find(relation.templateData.relations, {
                name: item.relation
              });
              if (!templateRelation) {
                return;
              }
              findOptions.fields.push(templateRelation.key);
            });

            return model.findById(itemId, findOptions);
          });
        })
        .then(function(result) {
          result = result.__data;
          result = app.lngScan(result);
          relations[relation.name] = result || {};
        });
    }).then(function() {
      return relations;
    });
  };
};
