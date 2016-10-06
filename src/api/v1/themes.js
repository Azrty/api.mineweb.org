
/** Function used to transform new DB model to old one */
var transform = function (themes) {
  var transformed = {};

  themes.forEach(function (theme) {
    // push the old format to the returned array
    transformed[theme.author.username.toLowerCase() + '.' + theme.slug.toLowerCase() + '.' + theme.id] = {
      apiID: theme.id,
      name: theme.name,
      slug: theme.slug,
      author: theme.author.username,
      version: theme.version,
      price: theme.price,
      supported: theme.supported || []
    }
  })
  // return the old formated themes
  return transformed;
}

module.exports = {

  /** Get all themes **/
  getAllThemes: function (req, res) {
    Theme.find().populate('author').exec(function (err, themes) {
      if (err)
        return res.json([]);
      return res.json(transform(themes))
    });
  },

  /** Get all free theme **/
  getFreeThemes: function (req, res) {
    Theme.find({ price: 0 }).populate('author').exec(function (err, themes) {
      if (err)
        return res.json([]);
      return res.json(transform(themes))
    });
  },

  /** Get all purchased themes by user**/
  getPurchasedThemes: function (req, res) {
    if (req.params.licenseID === undefined)
      return res.json([]);

    var licenseID = req.params.licenseID;

    License.findOne({ id: licenseID }).exec(function (err, license) {
      if (err || license === undefined)
        return res.json([]);

      Purchase.find({ user: license.user, type: 'THEME' }).exec(function (err, purchases) {
        if (purchases === undefined || purchases.length === 0)
          return res.json([]);

        // get an array of theme id
        var theme_ids = purchases.map(function (item) {
          return item.itemId;
        })

        // query all of them
        Theme.find({ id: theme_ids }).populate('author').exec(function (err, themes) {
          if (themes === undefined || themes.length === 0)
            return res.json([]);
          else
            return res.json({ status: 'success', success: transform(themes) });
        })
      })
    });
  }
};
