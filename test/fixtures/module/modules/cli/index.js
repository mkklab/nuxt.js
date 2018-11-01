import consola from 'consola'

const moduleFunction = function () {
  consola.info('dummy module')
}

moduleFunction.cli = {
  name: 'custom-module-cli',
  description: 'CLI commands for custom-module',
  usage: 'nuxt custom-module-cli',
  commands: [
    {
      name: 'command',
      usage: 'nuxt custom-module-cli command',
      description: 'Custom command for custom-module',
      run() {
        consola.info('dummy module command')
      },
      options: {
        dummy: {
          alias: 'd',
          type: 'boolean',
          description: 'Dummy option',
          handle(options, argv) {
            consola.info('argv ->', argv)
          }
        }
      }
    }
  ]
}

export default moduleFunction