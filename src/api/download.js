var fs = require('fs');
var path = require('path');
var pump = require('pump');
var JSZip = require('jszip');
var pmx   = require('pmx');

// simple function to return the exact path of a file
var getFilePath = function (name) {
  return path.join(__dirname, '../public', name);
}

module.exports = {

  /** Download the last version of cms */
  get_cms: function (req, res) {
    if (!req.license) { // called by mineweb.org
      if (req.ip.indexOf("51.255.36.20") === -1) return res.sendStatus(404);
      req.license = {}
      req.license.id = req.body.license_id || req.query.license_id;
    }

    Version.findOne({ state: 'RELEASE' }).sort('id DESC').exec(function (err, result) {
      if (err || !result)
        return res.status(404).json({ status: false, error: 'Not Found' });

      var path = getFilePath('cms_mineweb_' + result.version + ".zip");

      var size = fs.readFile(path, function (err, data) {
        if (err) return res.status(404).json({ status: false, error: 'File Not Found' });

        JSZip.loadAsync(data).then(function (zip) { // create object from zip content

          // Modify LICENSE_ID into /config/secure
          zip.file('config/secure', '{"id": "' + req.license.id + '","key": "NOT_INSTALL"}')

          // Send headers
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=MineWebCMS-' + result.version + '.zip'
          })

          // stream zip contnet to response
          zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE' }).pipe(res).on('finish', res.end);
        })
      })
    });
  },

  /** Download a the last version of a plugin */
  get_plugin: function (req, res) {
    var pluginID = req.params.apiID;

    if (pluginID === undefined)
      return res.json({ status: 'error', msg: 'INVALID_PLUGIN_ID' });

    Plugin.findOne({ id: pluginID, state: 'CONFIRMED' }).exec(function (err, plugin) {
      // plugin doesnt exist
      if (err || !plugin)
        return res.json({ status: 'error', msg: 'INVALID_PLUGIN_ID' });

      var trigger_download = function () {
        var path = getFilePath('PLUGIN_' + plugin.slug + '_' + plugin.version + ".zip");

        var size = fs.stat(path, function (err, data) {
          if (err) return res.status(404).json({ status: false, error: 'File Not Found' });

          var stream = fs.createReadStream(path)

          // write header
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': data.size
          });

          // stream the file to the response
          pump(stream, res, res.end);
        });

        // add a download to the plugin
        plugin.downloads = typeof(plugin.downloads) === 'number' ? plugin.downloads + 1 : 1;
        plugin.save(console.error);
      };

      // if the plugin is paid, verify that he paid it
      if (plugin.price > 0 && req.license.type !== "DEV" && req.user.id !== plugin.author && (req.user.developer === 'CONFIRMED' && req.license.type === 'USER_DEV'))
        Purchase.query('SELECT purchase.id FROM purchase LEFT JOIN paypalhistory ON purchase.paymentId = paypalhistory.id WHERE purchase.user = ? AND purchase.type = \'PLUGIN\' AND purchase.itemId = ? AND (paypalhistory.state = \'COMPLETED\' OR purchase.paymentType != \'PAYPAL\')', [req.user.id, pluginID],
          function (err, purchase) {
            // dont buyed it, go fuck yourself
            if (err || !purchase || purchase.length === 0)
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
    var themeID = req.params.apiID;

    if (themeID === undefined)
      return res.json({ status: 'error', msg: 'INVALID_THEME_ID' });

    Theme.findOne({ id: themeID, state: 'CONFIRMED' }).exec(function (err, theme) {
      // theme doesnt exist
      if (err || !theme)
        return res.json({ status: 'error', msg: 'INVALID_THEME_ID' });

      var trigger_download = function () {
        var path = getFilePath('THEME_' + theme.slug + '_' + theme.version + ".zip");

        var size = fs.stat(path, function (err, data) {
          if (err) return res.status(404).json({ status: false, error: 'File Not Found' });

          var stream = fs.createReadStream(path)

          // write header
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': data.size
          });

          // stream the file to the response
          pump(stream, res, res.end);
        });

        // add a download to the theme
        theme.downloads = typeof(theme.downloads) === 'number' ? theme.downloads + 1 : 1;
        theme.save(console.error);
      };

      // if the theme is paid, verify that he paid it
      if (theme.price > 0 && req.license.type !== "DEV" && req.user.id !== theme.author)
        Purchase.query('SELECT purchase.id FROM purchase LEFT JOIN paypalhistory ON purchase.paymentId = paypalhistory.id WHERE purchase.user = ? AND purchase.type = \'THEME\' AND purchase.itemId = ? AND (paypalhistory.state = \'COMPLETED\' OR purchase.paymentType != \'PAYPAL\')', [req.user.id, themeID],
          function (err, purchase) {
            // dont buyed it, go fuck yourself
            if (err || !purchase || purchase.length === 0)
              return res.json({ status: 'error', msg: 'THEME_NOT_FREE' });
            else
              trigger_download();
          });
      else
        trigger_download();
    })
  }
};
