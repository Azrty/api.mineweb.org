module.exports = {

  /** Get all themes **/
  getAllThemes: function (req, res) {
    Theme.find().exec(function(err, themes) {
        if (err)
          return res.json([]);
        return res.json(themes)
    });
  },

  /** Get all free theme **/
  getFreeThemes: function (req, res) {
    Theme.find({ price: 0}).exec(function(err, themes) {
        if (err)
          return res.json([]);
        return res.json(themes)
    });
  },

  /** Get all purchased themes by user**/
  getPurchasedThemes: function (req, res) {
    var licenseID = req.query.licenseID;

    if (licenseID)
      return res.json([]);

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

    // when found, get theme he has purchased
    var cb_found = function (userId) {
      Purchase.find({ user: userId, type: 'THEME' }).exec(function (err, purchases) {
        if (purchases === undefined || purchases.length === 0)
          return res.json([]);
        
        // get an array of theme id
        var theme_ids = purchases.map(function (item) {
          return item.id;
        })

        // query all of them
        Theme.find({ id: theme_ids}).exec(function (err, themes) {
          if (themes === undefined || themes.length === 0)
            return res.json([]);
          else
            return res.json(themes);
        })
      })
    }
  }
};