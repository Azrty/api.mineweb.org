module.exports = {
  identity: 'ticket',
  connection: 'default',

  attributes: {

    id: {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

    user: {
			model: 'User',
			required: true
		},

    license: {
      model: 'License',
      defaultsTo: null
    },

    hosting: {
      model: 'Hosting',
      defaultsTo: null
    },

    title: {
      type: 'string',
      required: true,
      min: 5,
      max: 20,
      size: 20
    },

    category: {
      type: 'string',
      required: true,
      in: ['GENERAL', 'SERVER', 'DEVELOPMENT', 'SUGGESTION', 'QUESTION', 'OTHER']
    },

    state: {
      type: 'string',
      in: ['WAITING_STAFF_RESPONSE', 'WAITING_USER_RESPONSE', 'CLOSED'],
      defaultsTo: 'WAITING_STAFF_RESPONSE'
    },

    supported: {
      model: 'User',
      defaultsTo: null
    },

    closedDate: {
      type: 'datetime',
      defaultsTo: null
    },

    replies: {
			collection: 'TicketReplies',
			via: 'ticket'
		},

  }
};