module.exports = {
  identity: 'user',
  connection: 'default',

  attributes: {
		id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		username: {
			type: 'string',
			required: true,
			unique: true,
      min: 4,
      max: 25,
      size: 25
		},

		email: {
			type: 'string',
			required: true,
			unique: true
		},

    paypalDeveloperEmail: {
			type: 'string',
			required: false,
			unique: true
		},

		password: {
			type: 'string',
			required: true
		},

		role: {
			type: 'string',
			defaultsTo: 'USER',
			in: ['USER', 'DEVELOPER', 'MOD', 'ADMIN', 'FOUNDER'],
      size: 9
		},

		developer: {
			type: 'string',
			defaultsTo: 'NONE',
			in: ['NONE', 'CANDIDATE', 'CONFIRMED'],
      size: 9
		},

		ip: {
			type: 'string',
			ip: true
		},

		lang: {
			type: 'string',
			defaultsTo: 'fr-fr',
      size: 5
		},

    twoFactorAuthKey: {
      type: 'string',
      size: 100
    },

		hostings: {
			collection: 'Hosting',
			via: 'user'
		},

		licenses: {
			collection: 'License',
			via: 'user'
		},

		plugins: {
			collection: 'Plugin',
			via: 'author'
		},

		themes: {
			collection: 'Theme',
			via: 'author'
		},
    
    purchases: {
			collection: 'Purchase',
			via: 'user'
		},

		toJSON: function() {
			var user = this.toObject();
			delete user.password;
			delete user.tokens;
			delete user.ip;
			//delete user.id;
			delete user.email;
			return user;
		}

  },
}