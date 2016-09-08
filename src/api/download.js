var fs      = require('fs');
var path    = require('path');
var pump    = require('pump');

// simple function to return the exact path of a file
var getFilePath = function (name) {
  return path.join(__dirname, 'public', name);
}

module.exports = {

  /** Download the last version of cms */
  get_cms: function (req, res) {
    Version.findOne({state: 'RELEASE'}).sort('id DESC').exec(function(err, result) {
      if (err || !result)
        return res.status(404).json({ status: false, error: 'Not Found' });
      
      var path = getFilePath('cms_mineweb_' + result.version);
      var size = fs.statSync(path)
      var stream = fs.createReadStream(path)

      // write header
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': size, 
          'Content-Disposition': 'attachment; filename=MinewebCMS' + '_' + plugin.version});

      // stream the file to the response
      pump(stream, res);
    });
  },

  /** Download a the last version of a plugin */
  get_plugin: function (req, res) {
    var pluginID = req.query.apiID;

    if (pluginID === undefined) 
      return res.json({ status: 'error', msg: 'INVALID_PLUGIN_ID' });
    
    Plugin.findOne({ id: pluginID }).exec(function (err, plugin) {
      // plugin doesnt exist
      if (err || !plugin)
        return res.json({ status: 'error', msg: 'INVALID_PLUGIN_ID' });
      
      var trigger_download = function () {
        var path = getFilePath('plugin_' + plugin.slug + '_' + plugin.version);
        var size = fs.statSync(path)
        var stream = fs.createReadStream(path)

        // write header
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': size,
          'Content-Disposition': 'attachment; filename=' + plugin.slug + '_' + plugin.version});

        // stream the file to the response
        pump(stream, res);
      }

      // if the plugin is paid, verify that he paid it
      if (plugin.price > 0)
        Purchase.findOne({ user: req.user, type: 'PLUGIN', itemId: pluginID })
          .exec(function (err, purchase) {
            // dont buyed it, go fuck yourself
            if (err || !purchase)
              return res.json({ status: 'error', msg: 'PLUGIN_NOT_FREE' });
            else
              trigger_download();
          });
      else
        trigger_download();
    })
  },


  /** Download a the last version of a theme */
  get_theme: function (req, res) {
    var themeID = req.query.apiID;

    if (themeID === undefined) 
      return res.json({ status: 'error', msg: 'INVALID_THEME_ID' });
    
    Theme.findOne({ id: themeID }).exec(function (err, theme) {
      // theme doesnt exist
      if (err || !theme)
        return res.json({ status: 'error', msg: 'INVALID_THEME_ID' });
      
      var trigger_download = function () {
        var path = getFilePath('theme_' + theme.slug + '_' + theme.version);
        var size = fs.statSync(path)
        var stream = fs.createReadStream(path)

        // write header
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': size, 
          'Content-Disposition': 'attachment; filename=' + theme.slug + '_' + theme.version});

        // stream the file to the response
        pump(stream, res);
      }

      // if the theme is paid, verify that he paid it
      if (theme.price > 0)
        Purchase.findOne({ user: req.user, type: 'THEME', itemId: themeID })
          .exec(function (err, purchase) {
            // dont buyed it, go fuck yourself
            if (err || !purchase)
              return res.json({ status: 'error', msg: 'THEME_NOT_FREE' });
            else
              trigger_download();
          });
      else
        trigger_download();
    })
  }
};