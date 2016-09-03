module.exports = {
  identity: 'purchase',
  connection: 'default',

  attributes: {

    id: {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

    user : {
			model: 'User',
			required: true
		},

    type: {
			type: 'string',
			required: true,
			in: ['PLUGIN', 'THEME', 'LICENSE', 'HOSTING'],
      size: 7
		},

    itemId: {
      type: 'integer',
      required: true
    },

    paymentId: {
      type: 'integer'
    },

    paymentType: {
      type: 'string',
      in: ['PAYPAL', 'DEDIPASS', 'FREE']
    }

  }

};