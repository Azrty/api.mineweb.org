module.exports = {
  identity: 'log',
  connection: 'default',

  attributes: {
    id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

		action: {
			type: 'string',
			required: true,
			in: ['GET_PLUGIN', 'GET_UPDATE', 'KEY_VERIFY', 'ADD_TICKET', 'GET_SECRET_KEY', 'GET_THEME', 'DEBUG', 'TRY_LOGIN', 'LOGIN']
		},

		ip: {
			type: 'string',
			required: true,
			ip: true
		},

		status: {
			type: 'boolean',
			required: true
		},

		error: {
			type: 'string'
		},

		type: {
			type: 'string',
			in: ['LICENSE', 'HOSTING', 'USER']
		},

		data: {
			type: 'json'
		}
  },
}
