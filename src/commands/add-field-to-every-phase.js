const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const asyncForEach = require('../utils/async-foreach')

class AddFieldToEveryPhaseCommand extends Command {
  async run() {
    const {flags, args} = this.parse(AddFieldToEveryPhaseCommand)

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {
      headers: headers,
    })

    let phases = await this.loadPhases(normalClient, args.pipeId)
    await asyncForEach(phases, async phase => {
      this.log('Processing phase ' + phase.name)
      await this.processPhase(normalClient, phase.id, flags)
    })
  }

  async processPhase(client, phaseId, flags) {
    let query = gql`mutation {
      createPhaseField(input: {
        label: "${flags.label}",
        phase_id: "${phaseId}",
        type: "${flags.type}",
        description: "${flags.description}",
        help: "${flags.help}",
        minimal_view: ${flags.minimal},
        editable: false
      }) {clientMutationId}
    }`

    await client.request(query)
  }

  async loadPhases(client, pipeId) {
    let query = gql`query {
      pipe(id: "${pipeId}") {
        phases {
          id, name
        }
      }
    }
    `

    let results = await client.request(query)
    return results.pipe.phases
  }
}

AddFieldToEveryPhaseCommand.description = `Add a field to every phase in a pipe
...
This command loops all your Pipefy phases of the pipe specified and adds the field as specified.

`

AddFieldToEveryPhaseCommand.flags = {
  label: flags.string({
    required: true,
    description:
      'The label of the field.',
    char: 'l',
  }),
  description: flags.string({
    required: false,
    default: '',
    description:
      'The description of the field.',
    char: 'd',
  }),
  help: flags.string({
    required: false,
    default: '',
  }),
  type: flags.string({
    required: true,
    description:
      'The type of the field.',
    char: 't',
    options: [
      'assignee_select',
      'attachment',
      'checklist_horizontal',
      'checklist_vertical',
      'cnpj',
      'connector',
      'cpf',
      'currency',
      'date',
      'datetime',
      'due_date',
      'email',
      'id',
      'label_select',
      'long_text',
      'number',
      'phone',
      'radio_horizontal',
      'radio_vertical',
      'select',
      'short_text',
      'statement',
      'time',
    ],
  }),
  minimal: flags.boolean({
    required: false,
    default: true,
    description:
      'Whether to use the minimal view',
  }),
}

AddFieldToEveryPhaseCommand.args = [
  {
    name: 'token',
    required: true,
    description: 'The API-Token for the Pipefy GraphQL API',
    hidden: false,
  },
  {
    name: 'pipeId',
    required: true,
    description: 'The id of the pipe to add the fields to.',
    hidden: false,
    parse: input => input.split(','),
  },
]

module.exports = AddFieldToEveryPhaseCommand
