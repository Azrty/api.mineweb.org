
/** Function used to transform new DB model to old one */
var transform = function (themes) {
  var transformed = {};

  themes.forEach(function (theme) {
    if (!theme.author || !theme.author.username) return ;

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
    // api v2
      res.json({"eywek.mineweb.1":{"apiID":1,"name":"MineWeb","slug":"Mineweb","author":"Eywek","version":"1.1.0","price":0,"supported":{"CMS":">= 1.0.0","plugin--eywek.shop.1":">= 0.4.0","plugin--eywek.support.2":">= 0.3.0","plugin--eywek.vote.3":">= 0.7.0","plugin--eywek.factionranking.4":">= 0.2.0"}},"mrsheepsheep.flatcolor.2":{"apiID":2,"name":"Flatcolor","slug":"Flatcolor","author":"MrSheepSheep","version":"1.1.0","price":0,"supported":{"CMS":">= 0.1.0"}},"eywek.universal.3":{"apiID":3,"name":"Universal","slug":"Universal","author":"Eywek","version":"1.0.1","price":0,"supported":{"CMS":">= 1.0.0","plugin--eywek.shop.1":">= 0.4.0","plugin--eywek.support.2":">= 0.3.0","plugin--eywek.vote.3":">= 0.7.0","plugin--eywek.factionranking.4":">= 0.2.0"}},"mrsheepsheep.justice.18":{"apiID":18,"name":"Justice","slug":"Justice","author":"MrSheepSheep","version":"1.3.0","price":2,"supported":{"CMS":">= 1.0.0"}},"narty.mineflat.22":{"apiID":22,"name":"MineFlat","slug":"Mineflat","author":"Narty","version":"1.0.4","price":2,"supported":{"CMS":">= 0.1.0","plugin--eywek.shop.1":">= 0.5.2","plugin--eywek.support.2":">= 0.3.2","plugin--eywek.vote.3":">= 0.8.0","plugin--eywek.factionranking.4":">= 0.2.1","plugin--vavaballz.myfaq.5":">= 1.0.0","plugin--empiredev.listmembers.24":">= 1.1.2","plugin--trix_folloow.staff.42":">= 1.0.0","plugin--trix_folloow.banlist.30":">= 1.0.1"}},"narty.minestorm.32":{"apiID":32,"name":"MineStorm","slug":"MineStorm","author":"Narty","version":"1.0.4","price":4,"supported":{"CMS":">= 1.0.0","thème--kilioz.staff.42":">= 1.3.0","thème--phpierre.forum.48":">= 1.1.6"}},"automate59go.multi.34":{"apiID":34,"name":"Multi","slug":"Multi","author":"automate59go","version":"1.0.2","price":0,"supported":{"CMS":">= 1.1.2"}},"alexm.urban.38":{"apiID":38,"name":"Urban","slug":"Urban","author":"AlexM","version":"1.2.2","price":3,"supported":{"CMS":">= 1.1.4","plugin--eywek.shop.1":">= 0.5.4","plugin--eywek.vote.3":">= 0.8.0","plugin--eywek.support.2":">= 0.3.2","plugin--vavaballz.myfaq.5":">= 1.0.0","plugin--phpierre.forum.48":">= 1.1.7"}},"kilioz.toonweb.40":{"apiID":40,"name":"ToonWeb","slug":"ToonWeb","author":"KilioZ","version":"1.0.0","price":0,"supported":{"CMS":">= 1.1.4"}},"orphevs.unruly.42":{"apiID":42,"name":"Unruly","slug":"Unruly","author":"orphevs","version":"1.0.3","price":3,"supported":{"CMS":">= 1.1.4","thème--eywek.shop.1":">= 0.5.4","thème--eywek.support.2":">= 0.3.2","thème--eywek.vote.3":">= 0.8.0","thème--phpierre.forum.48":">= 1.1.7","plugin--kilioz.donation.50":">= 1.0.0"}},"alexm.kraken.48":{"apiID":48,"name":"Kraken","slug":"Kraken","author":"AlexM","version":"1.0.1","price":2,"supported":{"CMS":">= 0.1.0"}},"mrsheepsheep.guide.54":{"apiID":54,"name":"Guide","slug":"Guide","author":"MrSheepSheep","version":"1.0.0","price":2,"supported":{"thème--eywek.shop.1":"0.5.4","thème--vavaballz.myfaq.5":"1.0.0","CMS":"1.1.4","thème--eywek.vote.3":"0.8.0"}},"automate59go.kuoo.56":{"apiID":56,"name":"Kuoo","slug":"Kuoo","author":"automate59go","version":"1.0.0","price":1,"supported":{"CMS":">= 0.1.0"}},"thomasfar.absolute.58":{"apiID":58,"name":"Absolute","slug":"Absolute","author":"ThomasFar","version":"1.2.2","price":1.2,"supported":{}},"orphevs.darker.70":{"apiID":70,"name":"Darker","slug":"Darker","author":"orphevs","version":"1.1.0","price":4,"supported":{}}})
    Theme.find({ state: 'CONFIRMED' }).populate('author').exec(function (err, themes) {
      if (err)
        return res.json([]);
      return res.json(transform(themes))
    });
  },

  /** Get all free theme **/
  getFreeThemes: function (req, res) {
    // api v2
      res.json({"eywek.mineweb.1":{"apiID":1,"name":"MineWeb","slug":"Mineweb","author":"Eywek","version":"1.1.0","price":0,"supported":{"CMS":">= 1.0.0","plugin--eywek.shop.1":">= 0.4.0","plugin--eywek.support.2":">= 0.3.0","plugin--eywek.vote.3":">= 0.7.0","plugin--eywek.factionranking.4":">= 0.2.0"}},"mrsheepsheep.flatcolor.2":{"apiID":2,"name":"Flatcolor","slug":"Flatcolor","author":"MrSheepSheep","version":"1.1.0","price":0,"supported":{"CMS":">= 0.1.0"}},"eywek.universal.3":{"apiID":3,"name":"Universal","slug":"Universal","author":"Eywek","version":"1.0.1","price":0,"supported":{"CMS":">= 1.0.0","plugin--eywek.shop.1":">= 0.4.0","plugin--eywek.support.2":">= 0.3.0","plugin--eywek.vote.3":">= 0.7.0","plugin--eywek.factionranking.4":">= 0.2.0"}},"mrsheepsheep.justice.18":{"apiID":18,"name":"Justice","slug":"Justice","author":"MrSheepSheep","version":"1.3.0","price":2,"supported":{"CMS":">= 1.0.0"}},"narty.mineflat.22":{"apiID":22,"name":"MineFlat","slug":"Mineflat","author":"Narty","version":"1.0.4","price":2,"supported":{"CMS":">= 0.1.0","plugin--eywek.shop.1":">= 0.5.2","plugin--eywek.support.2":">= 0.3.2","plugin--eywek.vote.3":">= 0.8.0","plugin--eywek.factionranking.4":">= 0.2.1","plugin--vavaballz.myfaq.5":">= 1.0.0","plugin--empiredev.listmembers.24":">= 1.1.2","plugin--trix_folloow.staff.42":">= 1.0.0","plugin--trix_folloow.banlist.30":">= 1.0.1"}},"narty.minestorm.32":{"apiID":32,"name":"MineStorm","slug":"MineStorm","author":"Narty","version":"1.0.4","price":4,"supported":{"CMS":">= 1.0.0","thème--kilioz.staff.42":">= 1.3.0","thème--phpierre.forum.48":">= 1.1.6"}},"automate59go.multi.34":{"apiID":34,"name":"Multi","slug":"Multi","author":"automate59go","version":"1.0.2","price":0,"supported":{"CMS":">= 1.1.2"}},"alexm.urban.38":{"apiID":38,"name":"Urban","slug":"Urban","author":"AlexM","version":"1.2.2","price":3,"supported":{"CMS":">= 1.1.4","plugin--eywek.shop.1":">= 0.5.4","plugin--eywek.vote.3":">= 0.8.0","plugin--eywek.support.2":">= 0.3.2","plugin--vavaballz.myfaq.5":">= 1.0.0","plugin--phpierre.forum.48":">= 1.1.7"}},"kilioz.toonweb.40":{"apiID":40,"name":"ToonWeb","slug":"ToonWeb","author":"KilioZ","version":"1.0.0","price":0,"supported":{"CMS":">= 1.1.4"}},"orphevs.unruly.42":{"apiID":42,"name":"Unruly","slug":"Unruly","author":"orphevs","version":"1.0.3","price":3,"supported":{"CMS":">= 1.1.4","thème--eywek.shop.1":">= 0.5.4","thème--eywek.support.2":">= 0.3.2","thème--eywek.vote.3":">= 0.8.0","thème--phpierre.forum.48":">= 1.1.7","plugin--kilioz.donation.50":">= 1.0.0"}},"alexm.kraken.48":{"apiID":48,"name":"Kraken","slug":"Kraken","author":"AlexM","version":"1.0.1","price":2,"supported":{"CMS":">= 0.1.0"}},"mrsheepsheep.guide.54":{"apiID":54,"name":"Guide","slug":"Guide","author":"MrSheepSheep","version":"1.0.0","price":2,"supported":{"thème--eywek.shop.1":"0.5.4","thème--vavaballz.myfaq.5":"1.0.0","CMS":"1.1.4","thème--eywek.vote.3":"0.8.0"}},"automate59go.kuoo.56":{"apiID":56,"name":"Kuoo","slug":"Kuoo","author":"automate59go","version":"1.0.0","price":1,"supported":{"CMS":">= 0.1.0"}},"thomasfar.absolute.58":{"apiID":58,"name":"Absolute","slug":"Absolute","author":"ThomasFar","version":"1.2.2","price":1.2,"supported":{}},"orphevs.darker.70":{"apiID":70,"name":"Darker","slug":"Darker","author":"orphevs","version":"1.1.0","price":4,"supported":{}}})
    Theme.find({  state: 'CONFIRMED', price: 0 }).populate('author').exec(function (err, themes) {
      if (err)
        return res.json([]);
      return res.json(transform(themes))
    });
  },

  /** Get all purchased themes by user**/
  getPurchasedThemes: function (req, res) {
    return res.json([]) // api v2
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
        Theme.find({  state: 'CONFIRMED', id: theme_ids }).populate('author').exec(function (err, themes) {
          if (err || themes === undefined || themes.length === 0)
            return res.json([]);
          else
            return res.json({ status: 'success', success: transform(themes) });
        })
      })
    });
  }
};
