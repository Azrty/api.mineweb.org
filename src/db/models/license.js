module.exports = {
  identity: 'license',
  connection: 'default',

  attributes: {
		id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		user: {
			model: 'User',
			required: true
		},

		key: {
			type: 'string',
			unique: true,
      defaultsTo: function () {
				return uuid.v4().substr(4, 24);
			},
      size: 19
		},

		state: {
			type: 'boolean',
			defaultsTo: true
		},

		host: {
			type: 'string',
			url: true
		},

		secretKey: {
			type: 'string',
			alphanumeric: true
		},

		suspended: {
			type: 'text'
		},

    purchase: {
      model: 'Purchase'
    }

  },
};