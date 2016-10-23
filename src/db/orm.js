var Waterline = require('waterline');

// config orm
var config = {
  adapters: {
    'sails-mysql': require('sails-mysql'),
    'sails-mongo': require('sails-mongo')
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
  config.connections.mongodb = {
    adapter: 'sails-mongo',
    host: process.env.MONGO_HOST,
    port: process.env.MONGO_PORT,
    database: process.env.MONGO_DB
  }
}

module.exports = {
  init: function (callback) {
    // new instance
    var waterline = new Waterline();

    var models = ['Question', 'Log', 'License', 'Hosting', 'Plugin', 'Theme', 'User', 'Purchase', 'Version', 'Faq',
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