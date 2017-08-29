var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var NodeRSA = require('node-rsa');
var private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/private.key'));
var RSAkeyAPI = new NodeRSA(private_key, 'private');

module.exports = function (secure) {
    // SECURE
    var password = '0123456789ABCDEF';
    var iv = '1234567890123456';
    var cipher = crypto.createCipheriv('aes-128-cbc', password, iv);

    var crypted = cipher.update(JSON.stringify(secure), 'utf8', 'binary');
    crypted += cipher.final('binary');
    var hexVal = new Buffer(crypted, 'binary');
    crypted = hexVal.toString('hex');

    // INFOS
    try {
        var cryptedPassword = RSAkeyAPI.encryptPrivate(JSON.stringify({pwd: password, iv: iv}), 'base64');
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
