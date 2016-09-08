var express     = require('express');
var router      = express.Router();
var multer      = require('multer')
var path        = require('path')

// storage engine
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // dir to upload
    cb(null, path.join(__dirname, 'public'))
  },
  filename: function (req, file, cb) {
    // file name
    cb(null, req.body.type + '_' + req.body.name + '_' + req.body.version);
  }
})

// upload wrapper
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // accept only zip file
    if (req.file.mimetype !== 'application/zip')
      cb(null, false)
    else
      cb(null, true)
  },
  limit: { fileSize: 5000000 }
})

// handle upload call
app.post('/upload', upload.single('file'), function (err, req, res, next) {
  if (err) return res.sendStatus(400);

  var type = req.body.type,
      version = req.body.version,
      name = req.body.name;
  
  if (!type || !version || !name)
    return res.sendStatus(400);
  else
    return res.sendStatus(200);
})
