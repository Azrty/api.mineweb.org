var pmx = require('pmx').init({
  http          : true,
  errors        : true, 
  custom_probes : true, 
  network       : true
});

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var orm = require('./db/orm.js');

var winston = require('winston');
var expressLog = require('express-winston');

var app = express();

var TRANSPORTS = []
TRANSPORTS.push(new winston.transports.Console({ json: true, colorize: true }))

// enable logging of express
app.use(expressLog.logger({
  transports: TRANSPORTS,
  meta: true,
  requestFilter: function (req, propName) {
    var data = req[propName];
    if (propName === 'user')
      return data && data.id ? data.id.toString() : undefined;
    if (propName === 'license')
      return data && data.id ? data.id.toString() : undefined;

    return req[propName];
  },
  requestWhitelist: ['url', 'method', 'user', 'license', 'ip'],
  responseWhitelist: ['statusCode']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// import routes definition
app.use('/api/v1/', require('./api/v1/'));
app.use('/api/v2/', require('./api/v2/'));
app.use('/api/storage/', require('./api/storage'));

app.get('/', function (req, res) {
  return res.json({ api_name: "Mineweb", environement: process.env.NODE_ENV || 'development' });
});

// handling 404
app.use(function (req, res, next) {
  res.sendStatus(404);
});

// handling 500 error in dev env
if (app.get('env') === 'development') 
  app.use(function (err, req, res, next) {
    return res.status(err.status || 500).json({ message: err.message, error: err });
  });
// handling 500 error in prod denv
else {
  app.use(pmx.expressErrorHandler());
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    next(err)
  });
}

var onReady = function (err, waterline) {
  if (err) return console.log(err)

  // expose model into global
  Object.keys(waterline.collections).forEach(function (key) {
    var name = key.substr(0, 1).toUpperCase() + key.substr(1);
    global[name] = waterline.collections[key];
  })
  global.ApiLog.native(function (err, collection) {
    collection.ensureIndex( { "createdAt": 1 }, { expireAfterSeconds: 604800 } ); // 1 week
    callback();
  });

  function callback()
  {
      // start http server
      var http_server = http.createServer(app);

      http_server.listen(process.env.PORT || 8080);
      http_server.on('error', function (err) {
          throw err;
      });

      // when the http server is ready, tell pm2 its good
      http_server.on('listening', function () {
          // graceful start
          process.send = process.send || function () {};
          process.send('ready');
          console.log("HTTP API is ready to handle request");
      });

      // graceful stop
      process.on('SIGINT', function() {
          http_server.close(function () {
              process.exit(0);
          })
      });
  }
}

// when the orm is ready, start everything
orm.init(onReady.bind(this));