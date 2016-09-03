var Waterline     = require('waterline');

var licenseModel = require('./models/license.js');
var hostingModel = require('./models/hosting.js');
var logModel = require('./models/log.js');
var pluginModel = require('./models/plugin.js');
var themeModel = require('./models/theme.js');
var userModel = require('./models/user.js');
var purchaseModel = require('./models/purchase.js');
var versionModel = require('./models/version.js')


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
    waterline.loadCollection(Waterline.Collection.extend(licenseModel));
    waterline.loadCollection(Waterline.Collection.extend(hostingModel));
    waterline.loadCollection(Waterline.Collection.extend(logModel));
    waterline.loadCollection(Waterline.Collection.extend(pluginModel));
    waterline.loadCollection(Waterline.Collection.extend(themeModel));
    waterline.loadCollection(Waterline.Collection.extend(userModel));
    waterline.loadCollection(Waterline.Collection.extend(purchaseModel));
    waterline.loadCollection(Waterline.Collection.extend(versionModel));

    // init the connection and models
    waterline.initialize(config, function (err, instance) {
        if (err)
            callback(err, null)
        else
          callback(null, instance);
    });
  }
}