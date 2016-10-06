var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var multipart = require('multiparty');
var serialization = require("php-serialization");

var cms_public_key = fs.readFileSync(path.resolve(__dirname, '../../secret/v1/cms_public.key'));
var api_private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/v1/api_private.key'));

var RSAkeyAPI = new NodeRSA(api_private_key, 'private');
RSAkeyAPI.setOptions({ encryptionScheme: 'pkcs1' })
var RSAkeyCMS = new NodeRSA(cms_public_key, 'public');
RSAkeyCMS.setOptions({ encryptionScheme: 'pkcs1' })

// list all post action and its name in the log
var ACTIONS = {};
ACTIONS['key_verif'] = 'KEY_VERIFY';
ACTIONS['getSecretKey'] = 'GET_SECRET_KEY';
ACTIONS['get_plugin'] = 'GET_PLUGIN';
ACTIONS['get_theme'] = 'GET_THEME';
ACTIONS['get_update'] = 'GET_UPDATE';
ACTIONS['addTicket'] = 'ADD_TICKET';
ACTIONS['get_secret_key'] = 'GET_SECRET_KEY';


/** all post request need to be verified */
router.post('/:action', function (req, res, next) {
  // verify the action
  if (req.params.action === undefined || ACTIONS[req.params.action] === undefined) {
    return res.status(404).json({ status: 'error', msg: 'Invalid action to perform' });
  }

  var form = new multipart.Form();
  form.parse(req, function (err, fields, files) {
    if (err) return res.status(404).json({ status: 'error', msg: 'Cant parse body.' });

    req.body = fields

    // try to decrypt the post data using RSA private key and parse it to json
    try {
      var data = JSON.parse(RSAkeyAPI.decrypt(Buffer.from(fields['0'][0], 'base64')));
    } catch (exception) {
      return res.status(400).json({ status: 'error', msg: exception.message })
    }

    // verify that it contain all the info we need
    if (data.id === undefined || data.key === undefined || data.domain === undefined)
      return res.status(500).json({ status: 'error', msg: 'Data not complete' })

    License.findOne({ id: data.id, key: data.key }).populate('user', 'hosting').exec(function (err, license) {
      // if the license isnt found, search for a hosting license
      if (license === undefined) {
        logger.info('Invalid ID or Key', { action: ACTIONS[req.params.action], ip: req.ip, status: false, data: data });
        return res.status(404).json({ status: 'error', msg: 'ID_OR_KEY_INVALID' })
      }

      var type = license.hosting !== null ? 'license' : 'hosting';

       // verify that license hasnt been disabled by us
      if (license.suspended !== null && license.suspended.length > 0) {
        logger.info('License suspended', { action: ACTIONS[req.params.action], ip: req.ip, status: false, type: type.toUpperCase(), data: data });
        return res.status(403).json({ status: false, msg: 'LICENSE_DISABLED' })
      }

      // verify that the license/hosting isnt disabled by user
      if (license.state === false) {
        logger.info('License disabled by user', { action: ACTIONS[req.params.action], ip: req.ip, status: false, type: type.toUpperCase(), data: data });
        return res.status(403).json({ status: 'error', msg: 'LICENSE_DISABLED' })
      }

      // verify that the input domain is a valid one
      if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false) {
        logger.info('Invalid domain', { action: ACTIONS[req.params.action], ip: req.ip, status: false, type: type.toUpperCase(), data: data });
        return res.status(403).json({ status: 'error', msg: 'INVALID_URL' })
      }
      
      // normalize last slash in domain
      if (license.host !== null) {
        license.host = license.host[license.host.length - 1] === '/' ? license.host.substr(0, license.host.length - 1) : license.host;
        data.domain = data.domain[data.domain.length - 1] === '/' ? data.domain.substr(0, data.domain.length - 1) : data.domain;

        var domain = license.host.toLowerCase();
        var input_domain = data.domain.toLowerCase();

        // normalize domain in the db
        if (domain.hosting !== null && domain.hosting.hostType === 'SUBDOMAIN')
          domain = 'http://' + domain + ".craftwb.fr";
        else if (domain.hosting !== null && domain.hosting.hostType === 'DOMAIN')
          domain = 'http://' + domain;
        else if (domain.indexOf('www.') !== -1)
          domain = domain.replace('www.', '');

        if (input_domain.indexOf('www.') !== -1)
          input_domain = input_domain.replace('www.', '');

        // verify that domain match
        if (input_domain !== domain) {
          logger.info('Domain doesnt match', { action: ACTIONS[req.params.action], ip: req.ip, status: false, type: type.toUpperCase(), data: data });
          return res.status(403).json({ status: 'error', msg: 'INVALID_URL' });
        }
      }

       // its all good, log the request and pass the request to the actual route
      logger.info('Successfly passed post check', { action: ACTIONS[req.params.action], ip: req.ip, status: true, type: type.toUpperCase(), data: data });
      req.model = license;
      req.type = type;
      req.domain = domain || 'none';
      req.user = model.user;

      return next()
    })
  });
});

var themeRoutes = require('./themes')
var pluginRoutes = require('./plugins')
var downloadRoutes = require('../download')

/** Get the latest release of the cms  */
router.get('/get_update', function (req, res) {
  Version.findOne({ state: 'RELEASE' }).sort('id DESC').exec(function (err, version) {
    if (err || !version)
      return res.status(404).json({ status: false, error: 'Not Found' });
    return res.status(200).json({
      type: version.type.toLowerCase(),
      visible: (version.visible),
      last_version: version.version
    })
  });
})

/** Route linked to download */
router.post('/update', downloadRoutes.get_cms)
router.post('/get_theme', downloadRoutes.get_theme)
router.post('/get_plugin', downloadRoutes.get_plugin)

/** Route linked to plugins */
router.get('/getFreeThemes', themeRoutes.getFreeThemes)
router.get('/getAllThemes', themeRoutes.getAllThemes)
router.get('/getPurchasedThemes/:licenseID', themeRoutes.getPurchasedThemes)

/** Route linked to themes */
router.get('/getFreePlugins', pluginRoutes.getFreePlugins)
router.get('/getAllPlugins', pluginRoutes.getAllPlugins)
router.get('/getPurchasedPlugins/:licenseID', pluginRoutes.getPurchasedPlugins)

/** Used to verify that the license used is valid */
router.post('/key_verif', function (req, res) {
  var data = { time: Math.floor(new Date().getTime() / 1000), domain: req.domain };

  //Serialize
  var serializedData = new serialization.Class("")
  serializedData.__addAttr__("time", "string", data.time, "integer")
  serializedData.__addAttr__("domain", "string", data.domain, "string")
  serializedData = serialization.serialize(serializedData, "array")

  try {
    var encoded = RSAkeyCMS.encrypt(serializedData, 'base64');
  } catch (exception) {
    return res.status(500).json({ status: 'error', msg: exception.message })
  }
  return res.status(200).json({ status: 'success', time: encoded })
})

/** Used to get the secret key to communicate between the CMS and the minecraft plugin  */
router.post('/get_secret_key', function (req, res) {
  // if the license/hosting doesnt have secret key, generate one for him
  if (req.model.secretKey === null) {
    req.model.secretKey = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 32; i++)
      req.model.secretKey += possible.charAt(Math.floor(Math.random() * possible.length));

    req.model.save(function (err) { })
  }

  // encrypt and send the key
  try {
    var encoded = RSAkeyCMS.encrypt(req.model.secretKey, 'base64');
  } catch (exception) {
    return res.status(500).json({ status: 'error', error: exception.message })
  }
  return res.status(200).json({ status: 'success', secret_key: encoded })
})

/** Used to create a ticket from CMS  */
router.post('/addTicket', function (req, res) {

  var data = req.body.debug,
    content = req.body.content,
    title = req.body.title;

  // if invalid data just tell him that its good
  if (data === undefined || content === undefined || title === undefined || title.length === 0 || content.length === 0)
    return res.sendStatus(200);

  data.id = req.model.id;
  data.type = req.type;

  // log data put by the cms
  logger.info('Debug trace', { action: req.path, ip: req.ip, status: true, type: type.toUpperCase(), data: data });

  // create the ticket
  var ticket = {
    user: req.user,
    title: title,
    category: 'OTHER'
  }
  // 5/5 ultra pratique eywek gg
  ticket[req.type] = req.model;
  Ticket.create(ticket, function (err, ticket) {
    if (err) return res.sendStatus(200);

    // create the actual message for the ticket
    Ticketreply.create({ user: req.user, ticket: ticket, content: content }, function (err, log) {
      return res.sendStatus(200);
    })
  })

})

/** Useless route but can be call so just send empty array */
router.get('getCustomMessage', function (req, res) {
  return res.status(200).json([]);
})

/** Useless route but can be call so just send empty array */
router.get('getFAQ', function (req, res) {
  return res.status(200).json([]);
})

// register routes here
module.exports = router;
