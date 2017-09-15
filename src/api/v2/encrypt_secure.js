var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/private.key'));
var RSAkeyAPI = new NodeRSA(private_key, 'private');

var generateRandomHexa = function() {
    var key = '';
    var chars = "acbdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < 16; i++)
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
};

module.exports = function (secure) {
    // SECURE
    var password = generateRandomHexa();
    var iv = generateRandomHexa();
    var cipher = crypto.createCipheriv('aes-128-cbc', password, iv);

    var crypted = cipher.update(JSON.stringify(secure), 'utf8', 'binary');
    crypted += cipher.final('binary');
    var hexVal = new Buffer(crypted, 'binary');
    crypted = hexVal.toString('hex');

    // INFOS
    try {
        var cryptedPassword = RSAkeyAPI.encryptPrivate(JSON.stringify({pwd: password, iv: iv, md5: crypto.createHash('md5').update(crypted).digest('hex')}), 'base64');
    } catch (exception) {
        console.error(exception);
        return false;
    }

    // DATA
    return [
        cryptedPassword,
        crypted
    ];
};
