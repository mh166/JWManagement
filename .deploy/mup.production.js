module.exports = {
  servers: {
    one: {
      host: process.env.SERVER_IP,
      username: 'root',
      password: process.env.SERVER_PASSWORD
    }
  },
  app: {
    name: 'JWManagement',
    path: '../',
    docker: {
      image: 'abernix/meteord:node-8-base'
    },
    servers: {
      one: {}
    },
    env: {
      ROOT_URL: 'https://production.jwmanagement.org',
      MONGO_URL: process.env.MONGO_URL,
      MONGO_OPLOG_URL: process.env.MONGO_OPLOG_URL,
      MAIL_URL: process.env.MAIL_URL,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    },
    buildOptions: {
      serverOnly: true
    },
    enableUploadProgressBar: false
  },
  proxy: {
    domains: 'production.jwmanagement.org',
    ssl: {
      letsEncryptEmail: 'support@jwmanagement.org'
    }
  }
};
