const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const asyncForEach = require('../utils/async-foreach')

class AddWarningToEveryPhaseCommand extends Command {
  async run() {
    const {flags, args} = this.parse(AddWarningToEveryPhaseCommand)

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

  async addConditional(client, actionFieldId, conditionFieldId, phaseId) {
    let query = gql`mutation {
      createFieldCondition(input: {
        name: "PEAG: Warning for field with id ${actionFieldId} by ${conditionFieldId} on phase ${phaseId}",
        phaseId: "${phaseId}",
        actions: [
          {
            phaseFieldId: "${actionFieldId}",
            actionId: "show",
            whenEvaluator: true
          },
          {
            phaseFieldId: "${actionFieldId}",
            actionId: "hide",
            whenEvaluator: false
          }
        ],
        condition: {
          expressions: [{
            field_address: "${conditionFieldId}",
            operation: "blank",
            value: ""
          }]
        }
      }) { clientMutationId }
    }`

    return client.request(query)
  }

  async processPhase(client, phaseId, flags) {
    let query = gql`mutation {
      createPhaseField(input: {
        label: "${flags.label}",
        phase_id: "${phaseId}",
        type: "statement",
        description: "${flags.description}",
        help: "${flags.help}",
        minimal_view: ${flags.minimal},
        editable: false
      }) { clientMutationId phase_field { id internal_id } }
    }`

    const results = await client.request(query)

    console.log(results)

    await this.addConditional(client, results.createPhaseField.phase_field.id, flags.fieldId, phaseId)
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

AddWarningToEveryPhaseCommand.description = `Add a conditional statement field to every phase in a pipe
...
This command loops all your Pipefy phases of the pipe specified and adds the warning as specified.
The warning is shown if the field you specify by id is emtpy.
`

AddWarningToEveryPhaseCommand.flags = {
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
  minimal: flags.boolean({
    required: false,
    default: false,
    description:
      'Whether to use the minimal view',
  }),
  fieldId: flags.string({
    required: true,
    description: 'Id of the field to trigger the warning',
  }),
}

AddWarningToEveryPhaseCommand.args = [
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

module.exports = AddWarningToEveryPhaseCommand
