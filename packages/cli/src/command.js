import parseArgs from 'minimist'
import wrapAnsi from 'wrap-ansi'
import { name, version } from '../package.json'
import { loadNuxtConfig, indent, indentLines, foldLines } from './utils'
import * as options from './options'
import * as imports from './imports'

const startSpaces = 6
const optionSpaces = 2
const maxCharsPerLine = 80

export default class NuxtCommand {
  constructor({ name, description, usage, options, external, sliceAt } = {}) {
    if (external) {
      this.setupExternal(external)
    } else {
      this.sliceAt = typeof sliceAt === 'undefined' ? 2 : sliceAt
      this.description = description || ''
      this.usage = usage || ''
      this.options = name in options
        ? Object.assign({}, options[name], options.common)
        : options.common

    }
  }

  _getMinimistOptions() {
    const minimistOptions = {
      alias: {},
      boolean: [],
      string: [],
      default: {}
    }

    for (const name of this.options) {
      const option = Options[name]

      if (option.alias) {
        minimistOptions.alias[option.alias] = name
      }
      if (option.type) {
        minimistOptions[option.type].push(option.alias || name)
      }
      if (option.default) {
        minimistOptions.default[option.alias || name] = option.default
      }
    }

    return minimistOptions
  }

  setupExternal(externalCommands) {
    this.sliceAt = 3
    this.description = externalCommands.description
    this.usage = 'start <command>'
    this.isExternal = true
  }

  getArgv(args) {
    const minimistOptions = this._getMinimistOptions()
    const argv = parseArgs(args || process.argv.slice(this.slice), minimistOptions)

    if (argv.version) {
      this.showVersion()
    } else if (argv.help) {
      this.showHelp()
    }

    return argv
  }

  async getNuxtConfig(argv, extraOptions) {
    const config = await loadNuxtConfig(argv)
    const options = Object.assign(config, extraOptions || {})

    for (const name of this.options) {
      if (Options[name].handle) {
        Options[name].handle(options, argv)
      }
    }

    return options
  }

  async getNuxt(options) {
    const { Nuxt } = await imports.core()
    return new Nuxt(options)
  }

  async getBuilder(nuxt) {
    const { Builder } = await imports.builder()
    const { BundleBuilder } = await imports.webpack()
    return new Builder(nuxt, BundleBuilder)
  }

  async getGenerator(nuxt) {
    const { Generator } = await imports.generator()
    const builder = await this.getBuilder(nuxt)
    return new Generator(nuxt, builder)
  }

  _getHelp() {
    const options = []

    let maxOptionLength = 0
    // For consistency Options determines order
    for (const name in Options) {
      const option = Options[name]
      if (this.options.includes(name)) {
        let optionHelp = '--'
        optionHelp += option.type === 'boolean' && option.default ? 'no-' : ''
        optionHelp += name
        if (option.alias) {
          optionHelp += `, -${option.alias}`
        }

        maxOptionLength = Math.max(maxOptionLength, optionHelp.length)
        options.push([ optionHelp, option.description ])
      }
    }

    const optionStr = options.map(([option, description]) => {
      const line = option +
        indent(maxOptionLength + optionSpaces - option.length) +
        wrapAnsi(description, maxCharsPerLine - startSpaces - maxOptionLength - optionSpaces)
      return indentLines(line, startSpaces + maxOptionLength + optionSpaces, startSpaces)
    }).join('\n')

    const description = foldLines(this.description, maxCharsPerLine, startSpaces)

    return `
    Description\n${description}
    Usage
      $ nuxt ${this.usage}
    Options\n${optionStr}\n\n`
  }

  showVersion() {
    process.stdout.write(`${name} v${version}\n`)
    process.exit(0)
  }

  showHelp() {
    process.stdout.write(this._getHelp())
    process.exit(0)
  }
}
