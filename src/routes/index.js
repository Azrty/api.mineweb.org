var express   = require('express');
var router    = express.Router();
var fs        = require('fs');
var path      = require('path');
var NodeRSA   = require('node-rsa');

var mineweb_public_key = fs.readFileSync(path.resolve(__dirname, '../secret/public.key'));
var mineweb_private_key = fs.readFileSync(path.resolve(__dirname, '../secret/private.key'));

var RSAkey    = new NodeRSA(mineweb_private_key, 'pkcs1-private-pem');


/** all post request need to be verified */
router.post('/', function(req, res, next) {

    // try to decrypt the post data using RSA private key and parse it to json
    try {
      var data = JSON.parse(RSAkey.decrypt(req.body));
    } catch (exception) {
      return res.status(400).json({ status: false, error: exception.message })
    }

    // verify that it contain all the info we need
    if (data.id === undefined || data.key === undefined || data.domain === undefined)
      return res.status(400).json({ status: false, error: 'Request do not contains necessary informations.'})
    
    next()
});

var versionRoutes = require('./versions')

router.get('/getLastVersion', versionRoutes.getLastVersion)

// register routes here
module.exports = router;
