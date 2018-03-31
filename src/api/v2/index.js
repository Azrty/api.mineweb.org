var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');

var private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/private.key'));
var RSAkeyAPI = new NodeRSA(private_key, 'private');
var downloadRoutes = require('../download')

/** Get the latest release of the cms  */
router.get('/cms/version', function (req, res) {
    return res.json({
        version: "1.4.0",
        type: "CHOICE",
        visible: true
    })
})
router.post('/cms/update', downloadRoutes.get_cms)

/** Route linked to plugins */
router.get('/theme/free', function (req, res) {
    return res.json([])
})
router.get('/theme/all', function (req, res) {
    return res.json([])
})
router.post('/theme/purchased', function (req, res) {
    return res.json([])
})

/** Route linked to themes */
router.get('/plugin/free', function (req, res) {
    return res.json([])
})
router.get('/plugin/all', function (req, res) {
    return res.json([])
})
router.post('/plugin/purchased', function (req, res) {
    return res.json([])
})

/** Used to verify that the license used is valid */
router.post('/authentication', function (req, res) {
    // verify that the request contains the signed field
    if (req.body.signed === undefined) {
        return res.status(400).json({status: false, msg: 'Invalid request'});
    }

    // try to decrypt the post data using RSA private key and parse it to json
    try {
        var rawData = JSON.parse(RSAkeyAPI.decrypt(Buffer.from(req.body.signed, 'base64')));
        console.log(rawData)
    } catch (err) {
        return res.status(400).json({status: false, msg: 'Could not decrypt signed content : ' + err.message || err})
    }

    var data = {
        time: Math.floor(new Date('2030-01-01 10:10:10').getTime() / 1000),
        domain: rawData.domain,
        plugins: [],
        themes: [],
        type: 'BASIC'
    };
    try {
        var encoded = RSAkeyAPI.encryptPrivate(JSON.stringify(data), 'base64');
    } catch (exception) {
        return res.status(500).json({status: 'error', msg: exception.message})
    }
    return res.status(200).json({status: 'success', time: encoded});
});

/** Useless route but can be call so just send empty array */
router.post('/getCustomMessage', function (req, res) {
    return res.json({
        type: 1,
        messageHTML: '<div class="alert alert-warning"><b>Mise à jour:</b> Une nouvelle mise à jour du CMS est disponible. Veuillez la faire ou vous mettre à jour grâce à notre repo Github : https://github.com/MineWeb/MineWebCMS.</div>'
    });
});

/** Useless route but can be call so just send empty array */
router.get('/getFAQ/:lang*?', function (req, res) {
    return res.json([]);
});

// register routes here
module.exports = router;
