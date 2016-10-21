var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');

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
router.post('/cms/update', ensurePostReq, downloadRoutes.get_cms)
router.post('/theme/download', ensurePostReq, downloadRoutes.get_theme)
router.post('/plugin/download', ensurePostReq, downloadRoutes.get_plugin)

/** Route linked to plugins */
router.get('/theme/free', themeRoutes.getFreeThemes)
router.get('/theme/all', themeRoutes.getAllThemes)
router.post('/theme/purchased', ensurePostReq, themeRoutes.getPurchasedThemes)

/** Route linked to themes */
router.get('/plugin/free', pluginRoutes.getFreePlugins)
router.get('/plugin/all', pluginRoutes.getAllPlugins)
router.post('/plugin/purchased', ensurePostReq, pluginRoutes.getPurchasedPlugins)

/** Used to verify that the license used is valid */
router.post('/verification', ensurePostReq, function (req, res) {
  var data = { time: Math.floor(new Date().getTime() / 1000), domain: req.domain };
  try {
    var encoded = RSAkeyAPI.encrypt(data, 'base64');
  } catch (exception) {
    return res.status(500).json({ status: 'error', msg: exception.message })
  }
  return res.status(200).json({ status: 'success', time: encoded })
})

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
    var encoded = RSAkeyAPI.encrypt(req.license.secretKey, 'base64');
  } catch (exception) {
    return res.status(500).json({ status: 'error', error: exception.message })
  }
  return res.status(200).json({ status: 'success', secret_key: encoded })
})

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
  Log.create({ action: 'DEBUG', ip: req.ip, api_version: 2, status: true, type: req.type.toUpperCase(), data: data }, function (err, log) {})

  // create the ticket
  var ticket = {
    user: req.user,
    title: title,
    category: 'OTHER'
  }

  ticket[req.type] = req.license;
  Ticket.create(ticket, function (err, ticket) {
    if (err) return res.status(500).json({ status: 'error', error: err.message })

    // create the actual message for the ticket
    Ticketreply.create({ user: req.user, ticket: ticket, content: content }, function (err, log) {
      return res.sendStatus(200);
    })
  })

})

/** Useless route but can be call so just send empty array */
router.get('/getCustomMessage', function (req, res) {
  return res.status(200).json([]);
})

/** Useless route but can be call so just send empty array */
router.get('/getFAQ', function (req, res) {
  var lang = req.params.lang;
  if (!lang)
    return res.json([]);

  Faq.find({lang: lang}).exec(function (err, questions) {
    if (err) return res.json([])

    return res.json(questions);
  })
})

// register routes here
module.exports = router;
