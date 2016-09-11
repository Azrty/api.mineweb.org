/** Function used to transform new DB model to old one */
var transform = function (plugins) {
  var transformed = [];

  plugins.forEach(function (plugin) {
    // push the old format to the returned array
    transformed.push({
      apiID: plugin.id,
      name: plugin.name,
      slug: plugin.slug,
      author: plugin.author.username,
      version: plugin.version,
      price: plugin.price,
      requirements: plugin.requirements || []
    })
  })
  // return the old formated themes
  return transformed;
}

module.exports = {

  /** Get all plugins **/
  getAllPlugins: function (req, res) {
    Plugin.find().populate('author').exec(function(err, plugins) {
        if (err)
          return res.json([]);
        return res.json(transform(plugins))
    });
  },

  /** Get all free plugins **/
  getFreePlugins: function (req, res) {
    Plugin.find({ price: 0}).populate('author').exec(function(err, plugins) {
        if (err)
          return res.json([]);
        return res.json(transform(plugins))
    });
  },

  /** Get all purchased plugins by user**/
  getPurchasedPlugins: function (req, res) {
    if (req.params.licenseID === undefined && req.method !== 'POST')
      return res.json([]);

    var licenseID = req.params.licenseID;

    if (req.model === 'GET') {
      // search userId by using the license
      License.findOne({ id: licenseID }).exec(function (err, license) {
        if (license === undefined) {
          Hosting.findOne({ id: licenseID }).exec(function (err, hosting) {
            if (hosting === undefined)
              return res.json([])
            else
              cb_found(hosting.user);
          })
        }
        else
          cb_found(license.user)
      })
    }
    else
      cb_found(req.user.id);

    // when found, get plugin he has purchased
    var cb_found = function (userId) {

      Purchase.find({ user: userId, type: 'PLUGIN' }).exec(function (err, purchases) {
        if (purchases === undefined || purchases.length === 0)
          return res.json([]);

        // get an array of plugin id
        var plugin_ids = purchases.map(function (item) {
          return item.itemId;
        })

        // query all of them
        Plugin.find({ id: plugin_ids}).populate('author').exec(function (err, plugins) {
          if (plugins === undefined || plugins.length === 0)
            return res.json([]);
          else
            return res.json({status: 'success', success: transform(plugins)});
        })
      })
    }
  }
};
