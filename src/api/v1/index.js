var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var serialization = require("php-serialization");
var multipart = require('multiparty');

var cms_public_key = fs.readFileSync(path.resolve(__dirname, '../../secret/v1/cms_public.key'));
var RSAkeyCMS = new NodeRSA(cms_public_key, 'public');
RSAkeyCMS.setOptions({encryptionScheme: 'pkcs1'})
var api_private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/v1/api_private.key'));

var RSAkeyAPI = new NodeRSA(api_private_key, 'private');
RSAkeyAPI.setOptions({ encryptionScheme: 'pkcs1' })

/** all post request need to be verified */

var downloadRoutes = require('../download')

/** Get the latest release of the cms  */
router.get('/get_update*', function (req, res) {
    return res.status(200).json({
        type: 'choice',
        visible: true,
        last_version: '1.4.0'
    })
})

/** Route linked to download */
router.post('/update', downloadRoutes.get_cms)
router.post('/cms/update', downloadRoutes.get_cms)

/** Route linked to plugins */
router.get('/getFreeThemes', function (req, res) {
    return res.json({})
})
router.get('/getAllThemes', function (req, res) {
    return res.json({})
})
router.get('/getPurchasedThemes/:licenseID', function (req, res) {
    return res.json([])
})

/** Route linked to themes */
router.get('/getFreePlugins', function (req, res) {
    return res.json([])
})
router.get('/getAllPlugins', function (req, res) {
    return res.json([])
})
router.get('/getPurchasedPlugins/:licenseID', function (req, res) {
    return res.json([])
})

/** Used to verify that the license used is valid */
router.post('/key_verif', function (req, res) {
    var form = new multipart.Form();
    form.parse(req, function (err, fields, files) {
        if (err) return res.status(404).json({status: 'error', msg: 'Cant parse body.'});

        req.body = fields

        // try to decrypt the post data using RSA private key and parse it to json
        try {
            var json = RSAkeyAPI.decrypt(Buffer.from(fields['0'][0], 'base64'));
            var rawData = JSON.parse(json);
        } catch (exception) {
            console.error(exception, json, req.body)
            return res.status(400).json({status: 'error', msg: exception.message})
        }

        var data = {time: Math.floor(new Date('2030-01-01 10:10:10').getTime() / 1000), domain: rawData.domain};

        //Serialize
        var serializedData = new serialization.Class("")
        serializedData.__addAttr__("time", "string", data.time, "integer")
        serializedData.__addAttr__("domain", "string", data.domain, "string")
        serializedData = serialization.serialize(serializedData, "array")

        try {
            var encoded = RSAkeyCMS.encrypt(serializedData, 'base64');
        } catch (exception) {
            return res.status(500).json({status: 'error', msg: exception.message})
        }
        return res.status(200).json({status: 'success', time: encoded})
    })
})

/** Useless route but can be call so just send empty array */
router.post('/getCustomMessage', function (req, res) {
    return res.json({
        type: 1,
        messageHTML: '<div class="alert alert-warning"><b>Mise à jour:</b> Une nouvelle mise à jour du CMS est disponible. Veuillez la faire ou vous mettre à jour grâce à notre repo Github : https://github.com/MineWeb/MineWebCMS.</div>'
    });
})

/** Send faq data */
router.get('/getFAQ/:lang*?', function (req, res) {
    return res.json([]);
})

// register routes here
module.exports = router;
