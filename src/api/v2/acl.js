var NodeRSA = require('node-rsa');
var fs = require('fs');
var path = require('path');

var private_key = fs.readFileSync(path.resolve(__dirname, '../../secret/private.key'));
var RSAkeyAPI = new NodeRSA(private_key, 'private');

module.exports = function (req, res, next) {
  // verify that the request contains the signed field
  if (req.body.signed === undefined) {
    return res.status(400).json({ status: false, msg: 'Invalid request' });
  }

  // try to decrypt the post data using RSA private key and parse it to json
  try {
    var data = JSON.parse(RSAkeyAPI.decrypt(Buffer.from(req.body.signed, 'base64')));
    console.log(data)
  } catch (err) {
    return res.status(400).json({ status: false, msg: 'Could not decrypt signed content : ' + err.message || err })
  }

  // verify that it contain all the info we need
  if (data.id === undefined || data.key === undefined || data.domain === undefined)
    return res.status(500).json({ status: false, msg: 'Data not complete' })

  var path = req.path.replace('/api/v2/', '');

  License.findOne({ id: data.id, key: data.key }).populate('user', 'hosting').exec(function (err, license) {
    // if the license isnt found, search for a hosting license
    if (license === undefined) {
      Apilog.create({ action: path, api_version: 2, ip: req.ip, status: false, error: 'Invalid ID or Key', data: data }, function (err, log) { })
      return res.status(404).json({ status: false, msg: 'ID_OR_KEY_INVALID' })
    }

    var type = license.hosting !== null ? 'license' : 'hosting';

    // verify that license hasnt been disabled by us
    if (license.suspended !== null && license.suspended.length > 0) {
      Apilog.create({ action: path, api_version: 2, ip: req.ip, status: false, error: 'License suspended', type: type.toUpperCase(), data: data }, function (err, log) { })
      return res.status(403).json({ status: false, msg: 'LICENSE_DISABLED' })
    }

    // verify that the license/hosting isnt disabled by user
    if (license.state === false) {
      Apilog.create({ action: path, api_version: 2, ip: req.ip, status: false, error: 'License disabled by user', type: type.toUpperCase(), data: data }, function (err, log) { })
      return res.status(403).json({ status: false, msg: 'LICENSE_DISABLED' })
    }

    // verify that the input domain is a valid one
    if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false && /^(http:\/\/|https:\/\/)localhost(|:[0-9]*)(|\/).*$/g.test(data.domain) === false) {
      Apilog.create({ action: path, api_version: 1, ip: req.ip, status: false, error: 'Not a valid domain', license: license.id, data: data }, function (err, log) { })
      return res.json({ status: false, msg: 'INVALID_URL' })
    }

    // normalize last slash in domain
    if (license.host) {
      license.host = license.host[license.host.length - 1] === '/' ?
                  license.host.substr(0, license.host.length - 1) : license.host;
      data.domain = data.domain[data.domain.length - 1] === '/' ? 
                  data.domain.substr(0, data.domain.length - 1) : data.domain;

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
        Apilog.create({ action: path, api_version: 2, ip: req.ip, status: false, error: 'Domain doesnt match', type: type.toUpperCase(), data: data }, function (err, log) { })
        return res.status(403).json({ status: false, msg: 'INVALID_URL' });
      }
    }

    // its all good, log the request and pass the request to the actual route
    var log = {
      action: path,
      api_version: 2,
      ip: req.ip,
      status: true,
      type: type.toUpperCase(),
      data: data
    };
    if (req.url === '/authentification') {
        log['plugins'] = req.body.data.plugins;
        log['themes'] = req.body.data.themes;
        log['current_theme'] = req.body.data.current_theme;
        log['users_count'] = req.body.data.users_count;
    }
    Apilog.create(log, function (err, log) {});
    req.license = license;
    req.type = type;
    req.domain = domain || 'none';
    req.user = license.user;

    return next()
  })
};