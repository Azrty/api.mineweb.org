var JSZip = require("jszip");
var yauzl = require("yauzl");

/** Function used to transform new DB model to old one */
var transform = function (plugins) {
  var transformed = [];

  plugins.forEach(function (plugin) {
    // push the old format to the returned array
    transformed.push({
      id: plugin.id,
      name: plugin.name,
      slug: plugin.slug,
      author: plugin.author.username,
      version: plugin.version,
      price: plugin.price,
      requirements: plugin.requirements || []
    })
  });
  // return the old formated themes
  return transformed;
};

module.exports = {

  /** Get all plugins **/
  getAllPlugins: function (req, res) {
    Plugin.find({state: 'CONFIRMED'}).populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all free plugins **/
  getFreePlugins: function (req, res) {
    Plugin.find({ price: 0, state: 'CONFIRMED' }).populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all purchased plugins by user**/
  getPurchasedPlugins: function (req, res) {
      if (req.license.type === 'DEV') {
          Plugin.find({ state: 'CONFIRMED', price: {'>': 0} }).populate('author').exec(function (err, plugins) {
              if (err || plugins === undefined || plugins.length === 0)
                  return res.json([]);
              else
                  return res.json({ status: 'success', success: transform(plugins) });
          })
      } else {
          Purchase.query('SELECT * FROM purchase ' +
              'LEFT JOIN paypalhistory ON purchase.paymentId = paypalhistory.id ' +
              'WHERE purchase.user = ? ' +
              'AND purchase.type = \'PLUGIN\' ' +
              'AND (purchase.paymentType != \'PAYPAL\' OR paypalhistory.state = \'COMPLETED\')', [req.user.id],
          function (err, purchases) {
              if (err || purchases === undefined || purchases.length === 0)
                  return res.json([]);

              // get an array of plugin id
              var plugin_ids = purchases.map(function (item) {
                  return item.itemId;
              });

              // query all of them
              Plugin.find({id: plugin_ids, state: 'CONFIRMED'}).populate('author').exec(function (err, plugins) {
                  if (err || plugins === undefined || plugins.length === 0)
                      return res.json([]);
                  else
                      return res.json({status: 'success', success: transform(plugins)});
              })
          })
      }
  },

  /** Generate secure from archive (.zip) **/
  generateSecure: function (plugin, file, next, apiID) {
      var secure = {
          configuration: {},
          routes: {},
          files: {}
      };

      JSZip.loadAsync(file).then(function (zip) {
          var folder = plugin.slug.substr(0, 1).toUpperCase() + plugin.slug.substr(1);
          var zipFolder = zip.folder(folder);

          // Configuration
          zipFolder.file('config.json').async('string').then(function (config) {
              config = JSON.parse(config);
              if (apiID !== undefined)
                  config.apiID = apiID
              secure.configuration = config;

              // Routes
              zipFolder.file('Config/routes.php').async('string').then(function (routesFile) {
                  var regex;
                  var routes = {};
                  var matches;
                  routesFile = routesFile.split(';');
                  for (var i = 0; i < routesFile.length; i++) {
                      regex = /Router::connect\('([A-Za-z/*_-]+)',( |)(array\(|\[)(.*|)'controller'( |)=>( |)'([A-Za-z_-]+)',(.*|)'action'( |)=>( |)'([A-Za-z_-]+)'(.*)(\)|\])\)/g;
                      if ((matches = regex.exec(routesFile[i])) === undefined || matches === null || matches.length === 0)
                          continue;
                      routes[matches[1]] = {
                          controller: matches[7],
                          action: matches[11]
                      };
                  }
                  secure.routes = routes;

                  // Files
                  var files = {};
                  yauzl.fromBuffer(file, {lazyEntries: true}, function(err, zipfile) {
                      if (err) {
                          console.error(err);
                          return next('Unable to scan zip.');
                      }
                      zipfile.readEntry();
                      zipfile.on("entry", function(entry) {
                          if (!/\/$/.test(entry.fileName) && entry.fileName.indexOf('.DS_Store') === -1 && entry.fileName.indexOf('__MACOSX') === -1)
                              files[entry.fileName.substr(plugin.slug.length + 1)] = entry.uncompressedSize;
                          zipfile.readEntry();
                      }).on('end', function () {
                          secure.files = files;
                          next(undefined, secure);
                      });
                  });
              });
          });
      });
  }
};
