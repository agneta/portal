const Promise = require('bluebird');

module.exports = function(util, options) {
  //var projectPaths = util.locals.web.project.paths;
  var services = util.locals.services;
  var templateModel,
    templateData,
    progress,
    dataRemote = services.models.Data_Remote,
    template = options.template;
  return Promise.resolve()
    .then(function() {
      return dataRemote.getTemplateModel(template);
    })
    .then(function(_templateModel) {
      templateModel = _templateModel;
      return dataRemote.__loadTemplateData({
        template: template
      });
    })
    .then(function(_templateData) {
      templateData = _templateData;
      return templateModel.find({
        fields: {
          id: true
        }
      });
    })
    .then(function(items) {
      console.log(items);
      progress = util.progress(items.length, {
        title: `Generating ${items.length} pages`
      });
      return Promise.map(
        items,
        function(item) {
          return templateModel
            .findById(item.id)
            .then(function(item) {
              return dataRemote.generate({
                item: item,
                templateData: templateData
              });
            })
            .then(function() {
              progress.tick({
                title: item.id
              });
            });
        },
        {
          concurrency: 4
        }
      );
    });
};
