const Promise = require('bluebird');
const _ = require('lodash');

module.exports = function(Model, app) {
  const char = '_';

  Model.getRelations = function(options) {
    let templateData = options.templateData;
    let item = options.item;
    let relations = {};
    let templateProps = [];
    let templateLocals = {};
    let parentScope = {};

    let pages = _.concat([], templateData.page, templateData.pages);

    pages.map(function(page) {
      if (!page) {
        return;
      }
      checkTemplate(page.location);
      checkTemplate(_.get(page, 'data.path'));
    });

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
            let findOptions = _.defaults(parentScope[relation.name], {
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
      templateProps.map(function(templateProp) {
        let sourceProp = templateProp.split(char).join('');
        let value = _.get(relations, sourceProp);
        if (!value) {
          return;
        }
        _.set(templateLocals, templateProp, value);
      });

      return {
        relations: relations,
        locals: templateLocals
      };
    });

    function checkTemplate(data) {
      if (!data) {
        return;
      }
      var props = data.match(/(?<=\$\{)(.+?)(?=\})/g);
      templateProps = templateProps.concat(props);
      templateProps = _.uniq(templateProps);
      props.map(function(prop) {
        _.set(templateLocals, prop, '???');

        let parts = prop.split('.');
        if (!parts[0][0] == char) {
          return;
        }

        let scopeName = parts.shift();
        scopeName = scopeName.split(char)[1];

        if (!scopeName) {
          return;
        }
        let scope = (parentScope[scopeName] = {
          include: [],
          fields: []
        });

        parts.map(function(part) {
          if (part[0] == char) {
            let childScope = {
              include: [],
              fields: []
            };
            scope.include.push({
              relation: part.split(char)[1],
              scope: childScope
            });
            scope = childScope;
          } else {
            scope.fields.push(part);
          }
        });
      });
      return data;
    }
  };
};
