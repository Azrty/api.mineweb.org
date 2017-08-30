var JSZip = require("jszip");
var yauzl = require("yauzl");

/** Function used to transform new DB model to old one */
var transform = function (themes) {
    var transformed = [];

    themes.forEach(function (theme) {
        // push the old format to the returned array
        transformed.push({
            id: theme.id,
            name: theme.name,
            slug: theme.slug,
            author: theme.author.username,
            version: theme.version,
            price: theme.price,
            supported: theme.supported || []
        })
    })
    // return the old formated themes
    return transformed;
}

module.exports = {

    /** Get all themes **/
    getAllThemes: function (req, res) {
        Theme.find({state: 'CONFIRMED'}).populate('author').exec(function (err, themes) {
            if (err)
                return res.json([]);
            return res.json(transform(themes))
        });
    },

    /** Get all free theme **/
    getFreeThemes: function (req, res) {
        Theme.find({price: 0, state: 'CONFIRMED'}).populate('author').exec(function (err, themes) {
            if (err)
                return res.json([]);
            return res.json(transform(themes))
        });
    },

    /** Get all purchased themes by user**/
    getPurchasedThemes: function (req, res) {
        if (req.license.type === 'DEV') {
            Theme.find({ state: 'CONFIRMED', price: {'>': 0} }).populate('author').exec(function (err, themes) {
                if (err || themes === undefined || themes.length === 0)
                    return res.json([]);
                else
                    return res.json({ status: 'success', success: transform(themes) });
            })
        } else {
            Purchase.query('SELECT * FROM purchase ' +
                'LEFT JOIN paypalhistory ON purchase.paymentId = paypalhistory.id ' +
                'WHERE purchase.user = ? ' +
                'AND purchase.type = \'THEME\' ' +
                'AND (purchase.paymentType != \'PAYPAL\' OR paypalhistory.state = \'COMPLETED\')', [req.user.id], function (err, purchases) {
                if (err || purchases === undefined || purchases.length === 0)
                    return res.json([]);

                // get an array of theme id
                var theme_ids = purchases.map(function (item) {
                    return item.itemId;
                });

                // query all of them
                Theme.find({id: theme_ids, state: 'CONFIRMED'}).populate('author').exec(function (err, themes) {
                    if (themes === undefined || themes.length === 0)
                        return res.json([]);
                    else
                        return res.json({status: 'success', success: transform(themes)});
                })
            })
        }
    },

    /** Generate secure from archive (.zip) **/
    generateSecure: function (theme, file, next) {
        var secure = {
            configuration: {},
            routes: {},
            files: {}
        };

        JSZip.loadAsync(file).then(function (zip) {
            var folder = theme.slug.substr(0, 1).toUpperCase() + theme.slug.substr(1);
            var zipFolder = zip.folder(folder);

            // Configuration
            zipFolder.file('Config/config.json').async('string').then(function (config) {
                config = JSON.parse(config);
                secure.options = [];
                for (key in config.configurations)
                    secure.options.push(key);
                delete config['configurations'];
                secure.configuration = config;

                // Files
                var files = {};
                yauzl.fromBuffer(file, {lazyEntries: true}, function (err, zipfile) {
                    if (err) {
                        console.error(err);
                        return next('Unable to scan zip.');
                    }
                    zipfile.readEntry();
                    zipfile.on("entry", function (entry) {
                        if (!/\/$/.test(entry.fileName) && entry.fileName.indexOf('.DS_Store') === -1 && entry.fileName.indexOf('__MACOSX') === -1)
                            files[entry.fileName.substr(theme.slug.length + 1)] = entry.uncompressedSize;
                        zipfile.readEntry();
                    }).on('end', function () {
                        secure.files = files;
                        next(undefined, secure);
                    });
                });
            });
        });
    }
};
