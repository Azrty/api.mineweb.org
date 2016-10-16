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
  })
  // return the old formated themes
  return transformed;
}

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
    Purchase.find({ user: req.user, type: 'PLUGIN' }).exec(function (err, purchases) {
      if (err || purchases === undefined || purchases.length === 0)
        return res.json([]);

      // get an array of plugin id
      var plugin_ids = purchases.map(function (item) {
        return item.itemId;
      })

      // query all of them
      Plugin.find({ id: plugin_ids, state: 'CONFIRMED' }).populate('author').exec(function (err, plugins) {
        if (err || plugins === undefined || plugins.length === 0)
          return res.json([]);
        else
          return res.json({ status: 'success', success: transform(plugins) });
      })
    })
  }
};
