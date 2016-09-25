var Waterline     = require('waterline');

// config orm
var config = {
    adapters: {
        'sails-mysql': require('sails-mysql')
    },
    connections: {
     'default': {
       adapter: 'sails-mysql',
       host: process.env.MYSQL_HOST,
       user: process.env.MYSQL_USER,
       password: process.env.MYSQL_PWD,
       database: process.env.MYSQL_DB
     },
   },
   defaults: {
    migrate: 'safe'
  }
};

module.exports = {
  init: function (callback) {
    // new instance
    var waterline     = new Waterline();

    // import models
    waterline.loadCollection(Waterline.Collection.extend(require('./models/license.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/hosting.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/plugin.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/theme.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/user.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/purchase.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/version.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/ticket.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/ticketReply.js')));

    // init the connection and models
    waterline.initialize(config, function (err, instance) {
        if (err)
            callback(err, null)
        else
          callback(null, instance);
    });
  }
}