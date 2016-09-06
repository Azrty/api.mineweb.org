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


/** all post request need to be verified */
router.post('/:action', function(req, res, next) {
    // verify the action
    if (req.params.action === undefined || ACTIONS.indexOf(req.params.action) === -1) {
      return res.status(404).json({ status: false, error: 'Invalid action to perform' });
    }

    // try to decrypt the post data using RSA private key and parse it to json
    try {
      var data = JSON.parse(RSAkey.decrypt(req.body));
    } catch (exception) {
      return res.status(400).json({ status: false, error: exception.message })
    }

    // verify that it contain all the info we need
    if (data.id === undefined || data.key === undefined || data.domain === undefined)
      return res.status(400).json({ status: false, error: 'Request do not contains necessary informations.' })
    
    // verify that the source is a valid ipv4 && the id is a valid integer
    if (/^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/g.test(req.ip) === false ||
      /^[1-9]\d*$/.test(data.id) === false) {
      return res.status(400).json({ status: false, error: 'Request do not contains necessary informations.' })
    }

    License.findOne({ id: data.id, key: data.key }).exec(function (err, license) {
      // if the license isnt found, search for a hosting license
      if (license === undefined) {
        Hosting.findOne({ id: data.id, key: data.key }).exec(function (err, hosting) {
          // if hosting isnt found either, send an error
          if (hosting === undefined)
            return res.status(404).json({ status: false, error: 'ID_OR_KEY_INVALID'})
          
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
      if (model.suspended.length > 0)
        return res.status(403).json({ status: false, error: 'LICENSE_DISABLED'})
      
      // verify that the license/hosting isnt disabled by user
      if (model.state === false)
        return res.status(403).json({ status: false, error: 'LICENSE_DISABLED'})

      // verify that the input domain is a valid one
      if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false)
        return res.status(403).json({ status: false, error: 'Invalid hostname source.'})
      
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
        return res.status(403).json({ status: false, error: 'INVALID_URL' });
      }

      // its all good, log the request and pass the request to the actual route
      Log.create({ action: ACTIONS[req.params.action], ip: req.ip, status: true, type: type.toUpperCase(), data: data }).exec(function (err, log) {
        if (err) return res.status(500).json({ status: false, error: 'Internal error with the database.' });

        next()
      })
    }
});

var versionRoutes = require('./versions')

router.get('/getLastVersion', versionRoutes.getLastVersion)

// register routes here
module.exports = router;
