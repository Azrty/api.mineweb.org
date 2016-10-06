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
    waterline.loadCollection(Waterline.Collection.extend(require('./models/License.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Hosting.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Plugin.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Theme.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/User.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Purchase.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Version.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/Ticket.js')));
    waterline.loadCollection(Waterline.Collection.extend(require('./models/TicketReply.js')));

    // init the connection and models
    waterline.initialize(config, function (err, instance) {
        if (err)
            callback(err, null)
        else
          callback(null, instance);
    });
  }
}