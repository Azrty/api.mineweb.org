var NodeRSA = require('node-rsa');
var fs       = require('fs')
var key = new NodeRSA({b: 2048});

var publicDer = key.exportKey('pkcs1-public-pem');
var privateDer = key.exportKey('pkcs1-private-pem');

fs.writeFileSync('src/secret/public.key', publicDer)
fs.writeFileSync('src/secret/private.key', privateDer)
console.log("done");