var NodeRSA = require('node-rsa');
var fs       = require('fs')
var key = new NodeRSA();
var path = require('path')

//var cms_public_key = fs.readFileSync(path.resolve(__dirname, '../secret/v2/api_public.key'));
var keyData = fs.readFileSync(path.resolve(__dirname, 'src/secret/v2/api_private.key'));

key.importKey(keyData, 'pkcs1');
//var publicDer = key.exportKey('pkcs8-public-der');
var privateDer = key.exportKey('private');

// var publicDer = key.exportKey('pkcs1-public-pem');
// var privateDer = key.exportKey('pkcs1-private-pem');

//fs.writeFileSync('src/secret/public.key', publicDer)
fs.writeFileSync('src/secret/private.key', privateDer)
console.log("done");
