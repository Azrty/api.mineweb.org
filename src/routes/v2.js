var express   = require('express');
var router    = express.Router();
var fs        = require('fs');
var path      = require('path');
var NodeRSA   = require('node-rsa');

var mineweb_public_key = fs.readFileSync(path.resolve(__dirname, '../secret/public.key'));
var mineweb_private_key = fs.readFileSync(path.resolve(__dirname, '../secret/private.key'));

var RSAkey    = new NodeRSA(mineweb_private_key, 'pkcs1-private-pem');

// list all action and its name in the log
var ACTIONS = {};
ACTIONS['check'] = 'KEY_VERIFY';
ACTIONS['getSecretKey'] = 'GET_SECRET_KEY';


/** all post request need to be verified */
router.post('/:action', function(req, res, next) {
    // verify the action
    if (req.params.action === undefined || ACTIONS.indexOf(req.params.action) === -1) {
      return res.status(404).json({ status: 'error', msg: 'Invalid action to perform' });
    }

    // try to decrypt the post data using RSA private key and parse it to json
    try {
      var data = JSON.parse(RSAkey.decrypt(req.body[0]));
    } catch (exception) {
      return res.status(400).json({ status: 'error', msg: exception.message })
    }

    // verify that it contain all the info we need
    if (data.id === undefined || data.key === undefined || data.domain === undefined)
      return res.status(500).json({ status: 'error', msg: 'Data not complete' })
    
    // verify that the source is a valid ipv4 && the id is a valid integer
    if (/^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/g.test(req.ip) === false ||
      /^[1-9]\d*$/.test(data.id) === false) {
      Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: false, error: 'Invalid post data', type: type.toUpperCase(), data: data }).exec(function (err, log) {})
      return res.status(500).json({ status: 'error', msg: 'ID or IP invalid' })
    }

    License.findOne({ id: data.id, key: data.key }).populate('user').exec(function (err, license) {
      // if the license isnt found, search for a hosting license
      if (license === undefined) {
        Hosting.findOne({ id: data.id, key: data.key }).populate('user').exec(function (err, hosting) {
          // if hosting isnt found either, send an error
          if (hosting === undefined) {
            Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: false, error: 'Invalid ID or Key', type: type.toUpperCase(), data: data }).exec(function (err, log) {})
            return res.status(404).json({ status: 'error', msg: 'ID_OR_KEY_INVALID'})
          }
          
          // if found continue
          cb_found(hosting, 'hosting');
        })
      }
      // if found continue
      else {
        cb_found(license, 'license')
      }
    })

    var cb_found = function (model, type) {
      // verify that the license/hosting isnt suspended
      if (model.suspended.length > 0) {
        Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: false, error: 'License suspended', type: type.toUpperCase(), data: data }).exec(function (err, log) {})
        return res.status(403).json({ status: false, msg: 'LICENSE_DISABLED'})
      }
      
      // verify that the license/hosting isnt disabled by user
      if (model.state === false) {
        Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: false, error: 'License disabled by user', type: type.toUpperCase(), data: data }).exec(function (err, log) {})
        return res.status(403).json({ status: 'error', msg: 'LICENSE_DISABLED'})
      }
        

      // verify that the input domain is a valid one
      if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false) {
        Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: true, type: type.toUpperCase(), data: data }).exec(function (err, log) {})
        return res.status(403).json({ status: 'error', msg: 'INVALID_URL'})
      }
      
      // normalize last slash in domain
      model.domain = model.domain[model.domain.length - 1] === '/' ? model.domain.substr(0, model.domain.length - 1) : model.domain;
      data.domain = data.domain[data.domain.length - 1] === '/' ? data.domain.substr(0, data.domain.length - 1) : data.domain;

      var domain = model.domain.toLowerCase();
      var input_domain = data.domain.toLowerCase();

      // normalize domain in the db
      if (type === 'hosting' && domain.hostType === 'SUBDOMAIN')
        domain = 'http://' + domain + ".craftwb.fr";
      else if (type === 'hosting' && domain.hostType === 'DOMAIN')
        domain = 'http://' + domain;
      else if (domain.indexOf('www.') !== -1)
        domain = domain.replace('www.', '');
      
      if (input_domain.indexOf('www.') !== -1)
        input_domain = input_domain.replace('www.', '');
      
      // verify that domain match
      if (input_domain !== domain) {
        Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: 'error', error: 'Domain doesnt match', type: type.toUpperCase(), data: data }).exec(function (err, log) {})
        return res.status(403).json({ status: 'error', msg: 'INVALID_URL' });
      }

      // its all good, log the request and pass the request to the actual route
      Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: true, type: type.toUpperCase(), data: data }).exec(function (err, log) {})
      req.model = model;
      req.type = type;
      req.domain = domain;

      next()
    }
});

var versionRoutes = require('./versions')

/** Route linked to CMS version and updates  */
router.get('/get_update', versionRoutes.getLastVersion)

/** Route linked to plugins */
router.get('/getFreePlugins', versionRoutes.getFreePlugins)
router.get('/getAllPlugins', versionRoutes.getAllPlugins)
router.get('/getPurchasedPlugins', versionRoutes.getPurchasedPlugins)

/** Used to verify that the license used is valid */
router.post('/key_verif', function(req, res) {
  var data = { time: Math.floor(Date.now()), domain: req.domain};
  try {
    var encoded = RSAkey.encryptPrivate(JSON.stringify(data));
  } catch (exception) {
    return res.status(500).json({ status: 'error', msg: exception.message })
  }
  return res.status(200).json({ status: 'success', time: encoded})
})

/** Used to get the secret key to communicate between the CMS and the minecraft plugin  */
router.post('/get_secret_key', function(req, res) {
  // if the license/hosting doesnt have secret key, generate one for him
  if (req.model.secretKey === undefined) {
    req.model.secretKey = Math.random().toString(32)
    req.model.save(function (err) { /* thug life */})
  }

  // encrypt and send the key
  try {
    var encoded = RSAkey.encryptPrivate(req.model.secretKey);
  } catch (exception) {
    return res.status(400).json({ status: 'error', error: exception.message })
  }
  return res.status(200).json({ status: 'success', secret_key: encoded})
})

/** Useless route but can be call so just send empty array */
router.get('getCustomMessage', function (req, res) {
  return res.status(200).json([]);
})

// register routes here
module.exports = router;
