const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const {renderDocumentation} = require('../documentator/renderer')
const asyncForEach = require('../utils/async-foreach')

class GenerateDocsCommand extends Command {
  async run() {
    const {flags, args} = this.parse(GenerateDocsCommand)
    // check if all arguments & flags make sense
    if (!args.organizationId && !args.pipeIds) {
      this.warn('Neither pipeIds nor organizationId is specified. Exiting.')
      return
    }

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {headers: headers})
    const coreClient = new GraphQLClient('https://app.pipefy.com/graphql/core', {headers: headers})
    const internalClient = new GraphQLClient('https://app.pipefy.com/internal_api', {headers: headers})
    let pipeIds = args.pipeIds ? args.pipeIds : await this.loadPipeIds(normalClient, args.organizationId)
    this.log('Found ' + pipeIds.length + ' pipes.')
    let automations = await this.getAutomations(internalClient, args.organizationId)
    await asyncForEach(pipeIds, async pipeId => {
      this.log('Processing pipe ' + pipeId)
      await this.processPipe(coreClient, automations, pipeId, flags)
    })
  }

  async processPipe(client, automations, pipeId, flags) {
    // render documentation incl. translations
    this.log('This command is not yet finished')
    let emails = await this.getEMailsForPipe(client, pipeId)
    let pipe = await this.getPipe(client, pipeId)
    // TODO: assemble data to show relations between phases, emails and automations,
    await renderDocumentation(automations, pipe, emails, flags.locale, flags.filename + '_' + pipeId + '.html')
  }

  /**
   * Load all ids of all pipes
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {int} organizationId The id of the organization to load the pipes for
   */
  async loadPipeIds(client, organizationId) {
    let query = gql`query {
        organization(id: ${organizationId}) {
          pipes{
            id name
          }
        }
    }`
    let results = await client.request(query)
    return results.organization.pipes.map(pipe => pipe.id)
  }

  /**
   * Get all fields of a pipe
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {int} pipeId The id of the organization to load the pipes for
   */
  async getPipe(client, pipeId) {
    let query = gql`query {
      pipe(id: ${pipeId}) {
        name
        phases{
            id name fields{ id internal_id type description label}
        }
      }
    }`
    let results = await client.request(query)
    return results.organization.pipes.map(pipe => pipe.id)
  }

  /**
   * Load all E-Mail Templates for a Pipe
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {int} pipeId The id of the pipe to load the E-Mail Templates for
   */
  async getEMailsForPipe(client, pipeId) {
    let query = gql`query {
      emailTemplates(repoId: ${pipeId}) {
        pageInfo {
            endCursor, hasNextPage
        }
        edges {
            node {
                bccEmail
                body
                ccEmail
                fromEmail
                fromName
                id
                name
                subject
                locale
                timeZone
                toEmail
            }
        }
      } 
    }`
    let results = await client.request(query)
    return results.emailTemplates
  }

  /**
   * Load all Automations
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {int} organizationId The id of the organization to load the pipes for
   */
  async getAutomations(client, organizationId) {
    let query = gql`query{
      getAutomations($orgId: ID!){
        automations(organizationId: $orgId) {
          id
          name
          action_id
          event_id
          action_repo {
            __typename id name
          }
          event_repo {
            __typename id name
          }
          event_params { 
            to_phase_id 
            fromPhaseId 
            inPhaseId 
            triggerFieldIds 
            kindOfSla 
          }
          action_id
          action_repo {
            id
            uuid
          }
          scheduler_frequency
          schedulerCron {
            minute
            hour
            dayOfWeek
            dayOfMonth
            month
          }
          searchFor {
            id
            field
            operation
            value
          }
          action_params {
            to_phase_id
            fields_map_order
            email_template_id: email_template_id
            field_map {
              fieldId
              value
              inputMode
            }
          }
          condition{
            expressions_structure
            expressions {
              id
              field_address
              operation
              value
              structure_id
            }
            related_cards {
              id
              title
              repo {
                __typename
                ...on Pipe { id }
                ...on Table { id }
              }
            }
          }
          related_cards {
            id
            title
            created_at
            repo {
              __typename
              ...on Pipe { id }
              ...on Table { id icon }
            }
            summary {
              title
              value
            }
          }
          active
        }
      }
    }`
    const variables = {
      orgId: organizationId,
    }
    let automations = await client.request(query, variables)
    this.log(`Loaded ${automations.data.automations.length} automations.`)
    return automations
  }
}

GenerateDocsCommand.description = `Generate a documentation of your pipes
...
This command loops all your Pipefy E-Mail-Templates, Automations etc. and 
outputs them into a HTML file (per pipe) which you can then export as PDF or 
whatever suits your needs.
`

GenerateDocsCommand.flags = {
  locale: flags.string({required: false, default: 'en', description: 'Language to use for documentation', char: 'l'}),
  filename: flags.string({required: false, default: 'pipe_documentation', description: 'File path & name to use for output', char: 'f'}),
}

GenerateDocsCommand.args = [{
  name: 'token',
  required: true,
  description: 'The API-Token for the Pipefy GraphQL API',
  hidden: false,
}, {
  name: 'organizationId',
  required: true,
  description: 'The id of the organization whose Pipes to document.',
  hidden: false,
  parse: input => input.split(','),
}, {
  name: 'pipeIds',
  required: false,
  description: 'The comma-separated ids of the pipes to document. Empty = all pipes of your organization.',
  hidden: false,
  parse: input => input.split(','),
}]

module.exports = GenerateDocsCommand
