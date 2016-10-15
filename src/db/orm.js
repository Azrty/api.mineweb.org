var Waterline = require('waterline');

// config orm
var config = {
  adapters: {
    'sails-mysql': require('sails-mysql'),
    'sails-elasticsearch': require('waterline-elasticsearch')
  },
  connections: {
    'mysql': {
      adapter: 'sails-mysql',
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PWD,
      database: process.env.MYSQL_DB
    }
  },
  defaults: {
    migrate: 'safe',
    connection: 'mysql'
  }
};

// if we are in production mode
if (process.env.NODE_ENV === 'production') {
  config.connections.elasticsearch = {
    adapter: 'sails-elasticsearch',
    host: process.env.ELASTIC_HOST,
    port: process.env.ELASTIC_PORT,
    log: 'warning',
    index: 'api-log'
  }
}

module.exports = {
  init: function (callback) {
    // new instance
    var waterline = new Waterline();

    var models = ['Question', 'Log', 'License', 'Hosting', 'Plugin', 'Theme', 'User', 'Purchase', 'Version',
      'Ticket', 'TicketReply', 'Token', 'RememberTokens', 'PayPalHistory', 'Pushbullet', 'DedipassHistory', 'Voucher'];
    // import models
    models.forEach(function (name) {
      var model = require('./models/' + name + ".js");
      model.identity = name.toLowerCase();
      model.connection = 'mysql'
      waterline.loadCollection(Waterline.Collection.extend(model));
    })

    // init the connection and models
    waterline.initialize(config, function (err, instance) {
      if (err)
        callback(err, null)
      else
        callback(null, instance);
    });
  }
}