module.exports = {
  identity: 'plugin',
  connection: 'default',
  
  attributes: {
    id: {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

    name: {
			type: 'string',
			unique: true,
			required: true,
      min: 5,
      max: 20,
      size: 20
		},

		slug: {
			type: 'string',
			unique: true,
			required: true,
      min: 5,
      max: 20,
      size: 20
		},

		author: {
			model: 'User',
			required: true
		},

		description: {
			type: 'text',
			required: true
		},

		img: {
			type: 'string',
			url: true,
			required: true
		},

    version : {
      type: 'string',
      required: true,
      unique: true,
      regex: /^(\d+\.)?(\d+\.)?(\*|\d+)$/
    },

		versions : {
			type: 'json',
			required: true
		},

		requirements: {
			type: 'json',
			defaultsTo: { 'CMS': "1.0.0" }
		},

		official: {
			type: 'boolean',
			defaultsTo: false
		},

		downloads: {
			type: 'integer',
			defaultTo: 0
		},

		price: {
			type: 'float',
			defaultsTo: 0
		},

    toJSON: function () {
			var plugin = this.toObject();
      delete plugin.versions;
      plugin.apiID = id;
      delete plugin.id;
      plugin.user = plugin.user.username;
    }
  }
}