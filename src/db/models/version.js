module.exports = {
  identity: 'version',
  connection: 'default',

  attributes: {

    id : {
			type: 'integer',
			unique: true,
    	autoIncrement: true,
    	primaryKey: true,
		},

    version : {
      type: 'string',
      required: true,
      unique: true,
      regex: /^(\d+\.)?(\d+\.)?(\*|\d+)$/
    },

    type: {
      type: 'string',
      in: ['CHOICE', 'FORCED'],
      defaultsTo: 'CHOICE',
      size: 6
    },

    visible: {
      type: 'boolean',
      defaultsTo: false
    },

    state: {
      type: 'string',
      in: ['STAGING', 'DEVELOPMENT', 'SNAPSHOT', 'RELEASE'],
      defaultsTo: 'DEVELOPMENT',
      size: 11
    },

    releaseDate: {
			type: 'datetime'
		},

    changelog: {
      type: 'json'
    }

  }
};