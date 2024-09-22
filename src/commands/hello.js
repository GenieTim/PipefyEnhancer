import {Command, Flags} from '@oclif/core'

class HelloCommand extends Command {
  async run() {
    const {flags} = await this.parse(HelloCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/commands/hello.js`)
  }
}

HelloCommand.description = `This is a test command
...
You can call it so that it greets you.
`

HelloCommand.flags = {
  name: Flags.string({char: 'n', description: 'name to print'}),
}

// module.exports = HelloCommand
export default HelloCommand
