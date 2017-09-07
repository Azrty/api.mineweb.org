var multipart = require('multiparty');
var NodeRSA = require('node-rsa');
var fs = require('fs');
var path = require('path');
var api_private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/v1/api_private.key'));

var RSAkeyAPI = new NodeRSA(api_private_key, 'private');
RSAkeyAPI.setOptions({ encryptionScheme: 'pkcs1' })

module.exports = function (req, res, next) {

  var form = new multipart.Form();
  form.parse(req, function (err, fields, files) {
    if (err) return res.status(404).json({ status: 'error', msg: 'Cant parse body.' });

    req.body = fields

    // try to decrypt the post data using RSA private key and parse it to json
    try {
      var json = RSAkeyAPI.decrypt(Buffer.from(fields['0'][0], 'base64'));
      var data = JSON.parse(json);
    } catch (exception) {
      console.error(exception, json, req.body)
      return res.status(400).json({ status: 'error', msg: exception.message })
    }

    var path = req.path.replace('/api/v1/', '')

    // verify that it contain all the info we need
    if (data.id === undefined || data.key === undefined || data.domain === undefined)
      return res.status(500).json({ status: 'error', msg: 'Data not complete' })

    License.findOne({ id: data.id, key: data.key }).populate(['user', 'hosting']).exec(function (err, license) {
      // if the license isnt found, search for a hosting license
      if (license === undefined) {
        Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'Invalid ID or Key', data: data }, function (err, log) { })
        return res.json({ status: 'error', msg: 'ID_OR_KEY_INVALID' })
      }

      var type = license.hosting !== null ? 'license' : 'hosting';

      // verify that license hasnt been disabled by us
      if (license.suspended !== null && license.suspended.length > 0) {
        Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'License suspended', license: license.id, data: data }, function (err, log) { })
        return res.json({ status: 'error', msg: 'LICENSE_DISABLED' })
      }

      // verify that the license/hosting isnt disabled by user
      if (license.state === false) {
        Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'License disabled by user', license: license.id, data: data }, function (err, log) { })
        return res.json({ status: 'error', msg: 'LICENSE_DISABLED' })
      }

      // verify that the input domain is a valid one
      if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false && /^(http:\/\/|https:\/\/)localhost(|:[0-9]*)(|\/).*$/g.test(data.domain) === false) {
        Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'Not a valid domain', license: license.id, data: data }, function (err, log) { })
        return res.json({ status: 'error', msg: 'INVALID_URL' })
      }

      // normalize last slash in domain
      if (license.host) {
        license.host = license.host[license.host.length - 1] === '/' ? license.host.substr(0, license.host.length - 1) : license.host;
        data.domain = data.domain[data.domain.length - 1] === '/' ? data.domain.substr(0, data.domain.length - 1) : data.domain;

        var domain = license.host.toLowerCase();
        var input_domain = data.domain.toLowerCase();

        // normalize domain in the db
        if (license.hosting && license.hosting.hostType === 'SUBDOMAIN')
          domain = 'http://' + domain + ".craftwb.fr";
        else if (license.hosting && license.hosting.hostType === 'DOMAIN')
          domain = 'http://' + domain;

        if (domain.indexOf('www.') !== -1)
          domain = domain.replace('www.', '');
        if (input_domain.indexOf('www.') !== -1)
          input_domain = input_domain.replace('www.', '');

        // verify that domain match
        if (input_domain !== domain) {
          data.parsed = {
            domain: domain,
            input_domain: input_domain
          }
          Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'Domain doesnt match', license: license.id, data: data }, function (err, log) { })
          return res.json({ status: 'error', msg: 'INVALID_URL' });
        }
      }
      else { // License installation, setup domain
        License.update({id: license.id}, {host: data.domain}).exec(function () {})
      }

      // its all good, log the request and pass the request to the actual route
      Apilog.create({ action: path, api_version: 1, ip: req.ip, status: true, license: license.id, data: data }, function (err, log) { })
      req.license = license;
      req.type = type;
      req.domain = domain || 'none';
      req.user = license.user;

      return next()
    })
  })
}
