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
    // api v2
    return res.json([{"apiID":1,"name":"Boutique","slug":"Shop","author":"Eywek","version":"0.5.4","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":2,"name":"Support","slug":"Support","author":"Eywek","version":"0.3.2","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":3,"name":"Vote","slug":"Vote","author":"Eywek","version":"0.8.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":4,"name":"Classement factions","slug":"FactionRanking","author":"Eywek","version":"0.2.2","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":5,"name":"FAQ personnalisée","slug":"MyFaq","author":"Vavaballz","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":6,"name":"MyHomeModal","slug":"MyHomeModal","author":"Vavaballz","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":8,"name":"Smartlook","slug":"SmartLook","author":"kenshimdev","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":24,"name":"Liste des membres","slug":"ListMembers","author":"EmpireDev","version":"1.2.0","price":2,"requirements":{"CMS":">= 1.1.0"}},{"apiID":28,"name":"Youtube","slug":"Youtube","author":"PHPierre","version":"1.0.0","price":0,"requirements":{}},{"apiID":30,"name":"Banlist","slug":"Banlist","author":"KilioZ","version":"1.3.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":36,"name":"Status des serveurs","slug":"Status","author":"EmpireDev","version":"1.3.0","price":2,"requirements":{"CMS":">= 1.1.4"}},{"apiID":38,"name":"Online","slug":"Online","author":"KilioZ","version":"1.1.2","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":42,"name":"Staff","slug":"Staff","author":"KilioZ","version":"1.3.0","price":1.5,"requirements":{"CMS":">= 1.1.0"}},{"apiID":48,"name":"Forum","slug":"Forum","author":"PHPierre","version":"1.1.10","price":4,"requirements":{"CMS":">= 1.0.0"}},{"apiID":50,"name":"Donation","slug":"Donation","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":52,"name":"Stats","slug":"Stats","author":"KilioZ","version":"1.1.0","price":2.5,"requirements":{"CMS":">= 1.1.4"}},{"apiID":54,"name":"ChangeLog","slug":"ChangeLog","author":"kenshimdev","version":"1.0.0","price":1.8,"requirements":{"CMS":">= 1.0.0"}},{"apiID":58,"name":"Twitch","slug":"Twitch","author":"MrtomDev","version":"1.2.5","price":0,"requirements":{"CMS":">= 1.1.4"}},{"apiID":62,"name":"Partenaire","slug":"Partenaire","author":"M4gie","version":"1.1.2","price":0.5,"requirements":{}},{"apiID":70,"name":"Avis","slug":"Avis","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":74,"name":"Code Cadeau","slug":"CodeCadeau","author":"EmpireDev","version":"1.0.0","price":2,"requirements":{"CMS":">= 1.1.4"}},{"apiID":76,"name":"Dynmap","slug":"Dynmap","author":"KilioZ","version":"1.0.0","price":0.5,"requirements":{"CMS":">= 1.1.0"}},{"apiID":88,"name":"Wiki","slug":"Wiki","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":90,"name":"Reglement","slug":"Reglement","author":"KilioZ","version":"1.0.1","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":98,"name":"CPS","slug":"CPS","author":"Tronai","version":"1.1.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":102,"name":"Auth Mineweb","slug":"Auth","author":"EmpireDev","version":"1.3.0","price":3.5,"requirements":{"CMS":">= 1.1.4"}}])
    Plugin.find({ state: 'CONFIRMED' }).populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all free plugins **/
  getFreePlugins: function (req, res) {
    // api v2
    return res.json([{"apiID":1,"name":"Boutique","slug":"Shop","author":"Eywek","version":"0.5.4","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":2,"name":"Support","slug":"Support","author":"Eywek","version":"0.3.2","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":3,"name":"Vote","slug":"Vote","author":"Eywek","version":"0.8.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":4,"name":"Classement factions","slug":"FactionRanking","author":"Eywek","version":"0.2.2","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":5,"name":"FAQ personnalisée","slug":"MyFaq","author":"Vavaballz","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":6,"name":"MyHomeModal","slug":"MyHomeModal","author":"Vavaballz","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":8,"name":"Smartlook","slug":"SmartLook","author":"kenshimdev","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":24,"name":"Liste des membres","slug":"ListMembers","author":"EmpireDev","version":"1.2.0","price":2,"requirements":{"CMS":">= 1.1.0"}},{"apiID":28,"name":"Youtube","slug":"Youtube","author":"PHPierre","version":"1.0.0","price":0,"requirements":{}},{"apiID":30,"name":"Banlist","slug":"Banlist","author":"KilioZ","version":"1.3.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":36,"name":"Status des serveurs","slug":"Status","author":"EmpireDev","version":"1.3.0","price":2,"requirements":{"CMS":">= 1.1.4"}},{"apiID":38,"name":"Online","slug":"Online","author":"KilioZ","version":"1.1.2","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":42,"name":"Staff","slug":"Staff","author":"KilioZ","version":"1.3.0","price":1.5,"requirements":{"CMS":">= 1.1.0"}},{"apiID":48,"name":"Forum","slug":"Forum","author":"PHPierre","version":"1.1.10","price":4,"requirements":{"CMS":">= 1.0.0"}},{"apiID":50,"name":"Donation","slug":"Donation","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":52,"name":"Stats","slug":"Stats","author":"KilioZ","version":"1.1.0","price":2.5,"requirements":{"CMS":">= 1.1.4"}},{"apiID":54,"name":"ChangeLog","slug":"ChangeLog","author":"kenshimdev","version":"1.0.0","price":1.8,"requirements":{"CMS":">= 1.0.0"}},{"apiID":58,"name":"Twitch","slug":"Twitch","author":"MrtomDev","version":"1.2.5","price":0,"requirements":{"CMS":">= 1.1.4"}},{"apiID":62,"name":"Partenaire","slug":"Partenaire","author":"M4gie","version":"1.1.2","price":0.5,"requirements":{}},{"apiID":70,"name":"Avis","slug":"Avis","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":74,"name":"Code Cadeau","slug":"CodeCadeau","author":"EmpireDev","version":"1.0.0","price":2,"requirements":{"CMS":">= 1.1.4"}},{"apiID":76,"name":"Dynmap","slug":"Dynmap","author":"KilioZ","version":"1.0.0","price":0.5,"requirements":{"CMS":">= 1.1.0"}},{"apiID":88,"name":"Wiki","slug":"Wiki","author":"KilioZ","version":"1.0.0","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":90,"name":"Reglement","slug":"Reglement","author":"KilioZ","version":"1.0.1","price":0,"requirements":{"CMS":">= 1.1.0"}},{"apiID":98,"name":"CPS","slug":"CPS","author":"Tronai","version":"1.1.0","price":0,"requirements":{"CMS":">= 1.0.0"}},{"apiID":102,"name":"Auth Mineweb","slug":"Auth","author":"EmpireDev","version":"1.3.0","price":3.5,"requirements":{"CMS":">= 1.1.4"}}])
    Plugin.find({ state: 'CONFIRMED', price: 0 }).populate('author').exec(function (err, plugins) {
      if (err)
        return res.json([]);
      return res.json(transform(plugins))
    });
  },

  /** Get all purchased plugins by user**/
  getPurchasedPlugins: function (req, res) {
    return res.json([]); // API V2
    if (req.params.licenseID === undefined)
      return res.json([]);

    var licenseID = req.params.licenseID;

    License.findOne({ id: licenseID }).exec(function (err, license) {
      if (err || license === undefined)
        return res.json([]);

      Purchase.find({ user: license.user, type: 'PLUGIN' }).exec(function (err, purchases) {
        if (err || purchases === undefined || purchases.length === 0)
          return res.json([]);

        // get an array of plugin id
        var plugin_ids = purchases.map(function (item) {
          return item.itemId;
        })

        // query all of them
        Plugin.find({ state: 'CONFIRMED', id: plugin_ids }).populate('author').exec(function (err, plugins) {
          if (err || plugins === undefined || plugins.length === 0)
            return res.json([]);
          else
            return res.json({ status: 'success', success: transform(plugins) });
        })
      })
    })
  }
};
