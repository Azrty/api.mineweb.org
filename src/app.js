var express     = require('express')
var path        = require('path')
var logger      = require('morgan')
var bodyParser  = require('body-parser')
var http        = require('http')
var errors      = require('./error.js')
var orm         = require('./db/orm.js')

var app         = express();

app.use(logger(process.env.logger));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// import routes definition
app.use('/api/v3/', require('./routes/index'));

// handling 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// handling 500 error in dev env
if (process.env.NODE_ENV === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json('error', {
      message: err.message,
      error: err
    });
  });
}

// handling 500 error in prod denv
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  next(err)
});

var onReady = function (err, waterline) {
  // expose model into all
  global.Hosting = collections.Hosting;
  global.License = collections.License;
  global.Log = collections.Log;
  global.Plugin = collections.Plugin;
  global.Theme = collections.Theme;

  // start http server
  var server = http.createServer(app);
  server.listen(process.env.PORT || 8080);
  server.on('error', errors.onError.bind(this));

  // when the http server is ready, tell pm2 its good
  server.on('listening', function () {
    console.log("API is ready to handle request");
    process.send('ready');
  });
}

// when the orm is ready, start everything
orm.init(onReady.bind(this));