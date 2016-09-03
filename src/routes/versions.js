module.exports = {

  /** Get last release version of the cms */
  getLastVersion: function (req, res) {
    Version.findOne({state: 'RELEASE'}).sort('id DESC').exec(function(err, version) {
        if (err || !version)
          return res.sendStatus(404);
        return res.status(200).json({
          type: version.type,
          visible: version.visible,
          version: version.version
        })
    });
  }
};