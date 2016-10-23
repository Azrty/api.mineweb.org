var express = require('express');
var router = express.Router();
var multer = require('multer')
var path = require('path');
var JSZip = require("jszip");
var pump = require('pump');
var pmx = require('pmx');
var fs = require('fs');

// upload wrapper
var upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    // accept only zip file
    if (file.mimetype !== 'application/zip')
      cb(null, false)
    else
      cb(null, true)
  },
  limit: { fileSize: 5000000 }
})

// handle upload call
router.post('/upload', upload.single('file'), function (req, res, next) {
  if (req.ip.indexOf("51.255.36.20") === -1) return res.sendStatus(404);

  var type = req.body.type, version = req.body.version, slug = req.body.slug, id = req.body.id;

  if (!type || !version || !slug | !id)
    return res.sendStatus(400);

  JSZip.loadAsync(req.file.buffer).then(function (zip) {
    var folder = slug.substr(0, 1).toUpperCase() + slug.substr(1);
    var zipFolder = (type == 'THEME') ? zip.folder(folder).folder('Config') : zip.folder(folder)

    zipFolder.file('config.json').async('string').then(function (config) {
      config = JSON.parse(config);
      config.apiID = parseInt(id);
      zipFolder.file('config.json', JSON.stringify(config))

      var file_name = type + "_" + slug + "_" + version + ".zip";

      zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE' }).pipe(fs.createWriteStream(path.resolve(__dirname, '../public/', file_name))).on('finish', function () {
        res.send()
      })
      //pump(zip.generateNodeStream({ streamFiles: true }), fs.createWriteStream(path.normalize(__dirname, '../public/', file_name)));
      //return res.sendStatus(200);
    })
  })
})

module.exports = router;
