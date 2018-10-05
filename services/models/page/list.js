module.exports = function(Model, app) {
  var directory = app.explorer.directory({
    model: Model,
    namespace: 'pages',
    pathProp: 'path',
    fields: {
      title: true,
      path: true
    }
  });

  Model.list = function(dir, marker, req) {
    var lang = app.getLng(req);
    return directory.list({
      dir: dir,
      limit: 20,
      where: {
        lang: lang
      },
      order: ['title ASC'],
      marker: marker
    });
  };
};
