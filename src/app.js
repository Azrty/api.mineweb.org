var express     = require('express')
var path        = require('path')
var logger      = require('morgan')
var bodyParser  = require('body-parser')
var http        = require('http')
var errors      = require('./error.js')
var orm         = require('./db/orm.js')
var favicon     = require('serve-favicon');

var app         = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger(process.env.logger));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// import routes definition
app.use('/api/v1/', require('./routes/v2'));

app.get('/', function (req, res) {
  return res.sendStatus(200);
})

// handling 404
app.use(function(req, res, next) {
  res.sendStatus(404);
});

// handling 500 error in dev env
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    return res.status(err.status || 500).json({ message: err.message, error: err });
  });
}

// handling 500 error in prod denv
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  next(err)
});

var onReady = function (err, waterline) {
  if (err) return console.log(err)

  // expose model into global
  Object.keys(waterline.collections).forEach(function (key) {
    var name = key.substr(0, 1).toUpperCase() + key.substr(1);
    global[name] = waterline.collections[key];
  })

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