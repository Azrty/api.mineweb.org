
// list all post action and its name in the log
var ACTIONS = {};
ACTIONS['verify'] = 'KEY_VERIFY';
ACTIONS['secretKey'] = 'GET_SECRET_KEY';
ACTIONS['plugin'] = 'GET_PLUGIN';
ACTIONS['theme'] = 'GET_THEME';
ACTIONS['cms'] = 'GET_UPDATE';
ACTIONS['ticket'] = 'ADD_TICKET';


module.exports = function (req, res, next) {
  // verify that the request contains the signed field
  if (req.body.signed === undefined) {
    return res.status(400).json({ status: 'error', msg: 'Invalid request' });
  }

  // try to decrypt the post data using RSA private key and parse it to json
  try {
    var data = JSON.parse(RSAkeyAPI.decrypt(req.body.signed));
  } catch (exception) {
    return res.status(400).json({ status: 'error', msg: 'Could not decrypt signed content' })
  }

  // verify that it contain all the info we need
  if (data.id === undefined || data.key === undefined || data.domain === undefined)
    return res.status(500).json({ status: 'error', msg: 'Data not complete' })

  License.find({ id: data.id, key: data.key }).populate('user').limit(1).exec(function (err, licenses) {
    // if the license isnt found, search for a hosting license
    var license = licenses[0]
    if (license === undefined) {
      Hosting.find({ id: data.id, key: data.key }).populate('user').limit(1).exec(function (err, hostings) {
        // if hosting isnt found either, send an error
        var hosting = hostings[0]
        if (hosting === undefined) {
          logger.info('Invalid ID or Key', { action: req.path, ip: req.ip, status: false, data: data });
          return res.status(404).json({ status: 'error', msg: 'ID_OR_KEY_INVALID' })
        }
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
    if (model.suspended !== null) {
      logger.info('License suspended', { action: req.path, ip: req.ip, status: false, type: type.toUpperCase(), data: data });
      return res.status(403).json({ status: false, msg: 'LICENSE_DISABLED' })
    }

    // verify that the license/hosting isnt disabled by user
    if (model.state === false) {
      logger.info('License disabled by user', { action: req.path, ip: req.ip, status: false, type: type.toUpperCase(), data: data });
      return res.status(403).json({ status: 'error', msg: 'LICENSE_DISABLED' })
    }

    // verify that the input domain is a valid one
    if (/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(data.domain) === false) {
      logger.info('Invalid domain', { action: req.path, ip: req.ip, status: false, type: type.toUpperCase(), data: data });
      return res.status(403).json({ status: 'error', msg: 'INVALID_URL' })
    }

    // normalize last slash in domain
    if (model.host !== null) {
      model.host = model.host[model.host.length - 1] === '/' ? model.host.substr(0, model.host.length - 1) : model.host;
      data.domain = data.domain[data.domain.length - 1] === '/' ? data.domain.substr(0, data.domain.length - 1) : data.domain;

      var domain = model.host.toLowerCase();
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
    }

    // verify that domain match
    if (input_domain !== domain && model.host !== null) {
      logger.info('Domain doesnt match', { action: req.path, ip: req.ip, status: false, type: type.toUpperCase(), data: data });
      return res.status(403).json({ status: 'error', msg: 'INVALID_URL' });
    }

    // its all good, log the request and pass the request to the actual route
    logger.info('Successfuly passed post check', { action: req.path, ip: req.ip, status: true, type: type.toUpperCase(), data: data });
    req.model = model;
    req.type = type;
    req.domain = domain;
    req.user = model.user;

    next()
  }
}