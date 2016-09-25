/** Function used to transform new DB model to old one */
var transform = function (plugins) {
  var transformed = [];

  plugins.forEach(function (plugin) {
    // push the format to the returned array
    plugin.author = plugin.author.username;
    transformed.push(plugin);
  })
  // return the formated plugin
  return transformed;
}

module.exports = {

  /** Get all plugins **/
  getAllPlugins: function (req, res) {
    Plugin.find().populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all free plugins **/
  getFreePlugins: function (req, res) {
    Plugin.find({ price: 0 }).populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all purchased plugins by user**/
  getPurchasedPlugins: function (req, res) {

    Purchase.find({ user: req.user, type: 'PLUGIN' }).exec(function (err, purchases) {
      if (purchases === undefined || purchases.length === 0)
        return res.json([]);

      // get an array of plugin id
      var plugin_ids = purchases.map(function (item) {
        return item.itemId;
      })

      // query all of them
      Plugin.find({ id: plugin_ids }).populate('author').exec(function (err, plugins) {
        if (plugins === undefined || plugins.length === 0)
          return res.json([]);
        else
          return res.json({ status: 'success', success: transform(plugins) });
      })
    })
  }
};