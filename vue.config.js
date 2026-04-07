const path = require('path')

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '~element-ui': path.resolve(__dirname, 'node_modules/element-ui')
      }
    }
  }
}
