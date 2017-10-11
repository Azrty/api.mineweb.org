var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var multer = require('multer');

var private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/private.key'));
var RSAkeyAPI = new NodeRSA(private_key, 'private');

var themeRoutes = require('./themes')
var pluginRoutes = require('./plugins')
var downloadRoutes = require('../download')
var ensurePostReq = require('./acl.js');

/** Get the latest release of the cms  */
router.get('/cms/version', function (req, res) {
  Version.findOne({ state: 'RELEASE' }).sort('id DESC').exec(function (err, version) {
    if (err || !version)
      return res.status(500).json({ status: false, error: 'Not Found' });
    return res.json(version);
  });
})

/** Route linked to download */
router.post('/cms/latest', downloadRoutes.get_cms)
router.post('/cms/update', ensurePostReq, downloadRoutes.get_cms)
router.post('/theme/download/:apiID', ensurePostReq, downloadRoutes.get_theme)
router.post('/plugin/download/:apiID', ensurePostReq, downloadRoutes.get_plugin)

/** Route linked to plugins */
router.get('/theme/free', themeRoutes.getFreeThemes)
router.get('/theme/all', themeRoutes.getAllThemes)
router.post('/theme/purchased', ensurePostReq, themeRoutes.getPurchasedThemes)

/** Route linked to themes */
router.get('/plugin/free', pluginRoutes.getFreePlugins)
router.get('/plugin/all', pluginRoutes.getAllPlugins)
router.post('/plugin/purchased', ensurePostReq, pluginRoutes.getPurchasedPlugins)

/** Used to verify that the license used is valid */
router.post('/authentication', ensurePostReq, function (req, res) {
    // dev licenses
    if (req.license.type === 'DEV' || req.license.type === 'USER_DEV') {
        if (req.body.data.users_count >= 10)
            return res.status(403).json({ status: false, msg: 'DEV_USERS_LIMIT_REACHED' });
    }

    // plugins / themes
    Purchase.query('SELECT * FROM purchase ' +
        'LEFT JOIN paypalhistory ON purchase.paymentId = paypalhistory.id ' +
        'WHERE purchase.user = ? ' +
        'AND (purchase.type = \'PLUGIN\' OR purchase.type = \'THEME\') ' +
        'AND (purchase.paymentType != \'PAYPAL\' OR paypalhistory.state = \'COMPLETED\')', [req.user.id], function (err, purchases) {
        if (err) {
            console.error(err);
            return res.status(500).json({status: false, msg: 'MySQL error on purchases get'});
        }

        for (var i = 0; i < purchases.length; i++) {
            if (purchases[i].type === 'PLUGIN') {
                for (var j = 0; j < req.body.data.plugins.length; j++) {
                    if (purchases[i].itemId === req.body.data.plugins[j])
                        req.body.data.plugins.splice(j, 1);
                }
            } else if (purchases[i].type === 'THEME') {
                for (var j = 0; j < req.body.data.themes.length; j++) {
                    if (purchases[i].itemId === req.body.data.themes[j])
                        req.body.data.themes.splice(j, 1);
                }
            }
        }

        // plugins/themes free
        //Plugin.find({id: req.body.data.plugin, or: [{price: 0}, {author: req.user.id}]}).exec(function (err, freePlugins) {
        Plugin.find({id: req.body.data.plugin, price: 0}).exec(function (err, freePlugins) {
            if (err) {
                console.error(err);
                return res.status(500).json({status: false, msg: 'MySQL error on plugins get'});
            }

            var index;
            for (var i = 0; i < freePlugins.length; i++) {
                if ((index = req.body.data.plugins.indexOf(freePlugins[i].id)) > -1)
                    req.body.data.plugins.splice(index, 1);
            }

            //Theme.find({id: req.body.data.themes, or: [{price: 0}, {author: req.user.id}]}).exec(function (err, freeThemes) {
            Theme.find({id: req.body.data.themes, price: 0}).exec(function (err, freeThemes) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({status: false, msg: 'MySQL error on themes get'});
                }

                var index;
                for (var i = 0; i < freeThemes.length; i++) {
                    if ((index = req.body.data.themes.indexOf(freeThemes[i].id)) > -1)
                        req.body.data.themes.splice(index, 1);
                }

                // Remove apiID with -1
                for (var i = 0; i < req.body.data.themes.length; i++) {
                    if (req.body.data.themes[i] == '-1')
                        req.body.data.themes.splice(i, 1);
                    if (req.body.data.themes[i] == '0')
                        req.body.data.themes.splice(i, 1);
                }
                for (var i = 0; i < req.body.data.plugins.length; i++) {
                    if (req.body.data.plugins[i] == '-1')
                        req.body.data.plugins.splice(i, 1);
                    if (req.body.data.plugins[i] == '0s')
                        req.body.data.plugins.splice(i, 1);
                }

                var data = {
                    time: Math.floor(new Date().getTime() / 1000),
                    domain: req.domain,
                    plugins: req.body.data.plugins,
                    themes: req.body.data.themes,
                    type: (req.license.type === 'DEV' || req.license.type === 'USER_DEV') ? 'DEV' : 'BASIC'
                };
                try {
                    var encoded = RSAkeyAPI.encryptPrivate(JSON.stringify(data), 'base64');
                } catch (exception) {
                    return res.status(500).json({status: 'error', msg: exception.message})
                }
                return res.status(200).json({status: 'success', time: encoded});
            });
        });
    });
});

/** Used to get the secret key to communicate between the CMS and the minecraft plugin  */
router.post('/key', ensurePostReq, function (req, res) {
  // if the license/hosting doesnt have secret key, generate one for him
  if (req.license.secretKey === null) {
    req.license.secretKey = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 32; i++)
      req.license.secretKey += possible.charAt(Math.floor(Math.random() * possible.length));

    req.license.save(function (err) { })
  }

  // encrypt and send the key
  try {
    var encoded = RSAkeyAPI.encryptPrivate(req.license.secretKey, 'base64');
  } catch (exception) {
    return res.status(500).json({ status: 'error', error: exception.message })
  }
  return res.status(200).json({ status: 'success', secret_key: encoded })
});

/** Used to create a ticket from CMS  */
router.post('/ticket/add', ensurePostReq, function (req, res) {

  var data = req.body.debug,
    content = req.body.content,
    title = req.body.title;

  // if invalid data just tell him that its good
  if (data === undefined || content === undefined || title === undefined || title.length === 0 || content.length === 0)
    return res.sendStatus(400);

  data.id = req.license.id;
  data.type = req.type;

  // log data put by the cms
  Apilog.create({ action: 'DEBUG', ip: req.ip, api_version: 2, status: true, type: req.type.toUpperCase(), data: data }, function (err, log) {})

  Ticket.create({
      user: req.user,
      title: title,
      category: 'OTHER',
      license: req.license.id
  }, function (err, ticket) {
    if (err) return res.status(500).json({ status: 'error', error: err.message })

    // create the actual message for the ticket
    Ticketreply.create({ user: req.user, ticket: ticket, content: content }, function (err, log) {
      return res.sendStatus(200);
    })
  })

});

/** Useless route but can be call so just send empty array */
router.post('/getCustomMessage', function (req, res) {
  return res.status(200).json([]);
});

/** Useless route but can be call so just send empty array */
router.get('/getFAQ/:lang*?', function (req, res) {
  var lang = req.params.lang;
  if (!lang)
    return res.json([]);

  Faq.find({lang: lang}).exec(function (err, questions) {
    if (err) return res.json([])

    return res.json(questions);
  })
});

var upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        // accept only zip file
        if (file.mimetype !== 'application/zip')
            cb(null, false)
        else
            cb(null, true)
    },
    limit: { fileSize: 5000000 }
});
var encryptSecure = require('./encrypt_secure');

router.post('/:type/security/generate', upload.single('file'), function (req, res) {
    if (req.ip.indexOf("51.255.36.20") === -1 && process.env.NODE_ENV !== 'development')
        return res.sendStatus(404);
    if (req.body === undefined || req.body.slug === undefined || req.body.slug.length === 0)
        return res.sendStatus(400);
    var fct = req.params.type == 'plugin' ? pluginRoutes : themeRoutes;

    fct.generateSecure({slug: req.body.slug}, req.file.buffer, function (err, secure) {
        if (err)
            return res.status(500).json({status: false, error: err});
        secure = encryptSecure(secure);
        if (!secure)
            return res.status(500).json({status: false, error: 'Unable to crypt infos.'});
        return res.json({status: true, success: JSON.stringify(secure)});
    });
});

// register routes here
module.exports = router;
