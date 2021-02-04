const { Command, flags } = require('@oclif/command')
const { GraphQLClient, gql } = require('graphql-request')
const inquirer = require('inquirer')
const asyncForEach = require('../utils/async-foreach')

const otherEmailFields = ['subject', 'name', 'fromName', 'fromEmail', 'toEmail', 'ccEmail', 'bccEmail']

class GenerateDocsCommand extends Command {
  async run() {
    const { flags, args } = this.parse(GenerateDocsCommand)
    // check if all arguments & flags make sense
    if (!args.organizationId && !args.pipeIds) {
      this.warn('Neither pipeIds nor organizationId is specified. Exiting.')
      return
    }
    
    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', { headers: headers })
    const coreClient = new GraphQLClient('https://app.pipefy.com/graphql/core', { headers: headers })
    let pipeIds = args.pipeIds ? args.pipeIds : await this.loadPipeIds(normalClient, args.organizationId)
    this.log('Found ' + pipeIds.length + ' pipes.')
    await asyncForEach(pipeIds, async pipeId => {
      this.log('Processing pipe ' + pipeId)
      await this.processPipe(coreClient, pipeId, flags)
    })
  }

  async processPipe(client, pipeId, flags) {
    // TODO: fetch pipe with fields, fetch E-Mails, fetch Automations, 
    // render documentation incl. translations
    this.log("This command is not yet finished")
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
}

GenerateDocsCommand.description = `Generate a documentation of your pipes
...
This command loops all your Pipefy E-Mail-Templates, Automations etc. and 
outputs them into a HTML file (per pipe) which you can then export as PDF or 
whatever suits your needs.
`

GenerateDocsCommand.flags = {
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
