var fs = require('fs');
var path = require('path');
var JSZip = require('jszip');

// simple function to return the exact path of a file
var getFilePath = function (name) {
  return path.join(__dirname, '../public', name);
}

module.exports = {

  /** Download the last version of cms */
  get_cms: function (req, res) {
      var path = getFilePath('cms_mineweb_' + '1.4.0' + ".zip");

      fs.readFile(path, function (err, data) {
          if (err) return res.status(404).json({status: false, error: 'File Not Found'});

          JSZip.loadAsync(data).then(function (zip) { // create object from zip content

              // Send headers
              res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Disposition': 'attachment; filename=MineWebCMS-' + '1.4.0' + '.zip'
              })

              // stream zip contnet to response
              zip.generateNodeStream({streamFiles: true, compression: 'DEFLATE'}).pipe(res).on('finish', res.end);
          })
      })
  }
};
