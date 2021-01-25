const { Command, flags } = require('@oclif/command')
const { cli } = 'cli-ux'
const { GraphQLClient, gql } = 'graphql-request'
const inquirer = require('inquirer')

class EditCommand extends Command {
  async run() {
    const { flags, args } = this.parse(EditCommand)
    let language = ''
    let timezone = ''
    // check if all arguments & flags make sense
    if (flags.skipEdit && !flags.language && !flags.timezone) {
      this.warn('Skipping edit, but neither language nor timezone specified. Exiting.')
      return
    }
    if (!args.organizationId && !args.pipeIds) {
      this.warn('Neither pipeIds nor organizationId is specified. Exiting.')
      return
    }
    // read the arguments
    if (flags.timezone) {
      timezone = await cli.prompt('What timezone do you want to set for all E-Mails?')
    }
    if (flags.language) {
      language = await cli.prompt('What language do you want to set for all E-Mails?')
    }

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', { headers: headers })
    const coreClient = new GraphQLClient('https://app.pipefy.com/graphql/core', { headers: headers })
    let pipeIds = args.pipeIds ? args.pipeIds : await this.loadPipeIds(normalClient, args.organizationId)
    this.log('Found ' + pipeIds.length + ' pipes.')
    await pipeIds.forEach(async pipeId => {
      await this.processEMailsForPipe(coreClient, pipeId, timezone, language)
    })
  }

  async processEMailsForPipe(client, pipeId, timezone, language) {
    let templates = await this.getEMailsForPipe(client, pipeId)
    await templates.edges.forEach(async template => {
      await this.processEMailTemplate(client, template.node, timezone, language)
    })
  }

  async processEMailTemplate(client, emailTemplate, timezone, language) {
    let answers = await inquirer.prompt([{
      type: 'editor',
      name: 'text',
      message: 'What is the HTML content of the E-Mail?',
      default: emailTemplate.body,
    }])
    emailTemplate.body = answers.text
    if (timezone !== '') {
      emailTemplate.timeZone = timezone
    }
    if (language !== '') {
      emailTemplate.locale = language
    }
    await this.updateEMailTemplate(client, emailTemplate)
  }

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
            }
        }
      } 
    }`
    let results = await client.request(query)
    return results.emailTemplates
  }

  async updateEMailTemplate(client, template) {
    let mutation = gql`mutation updateEmailTemplate(
      $bccEmail: String, $body: String!, 
      $ccEmail: String, $fromEmail: String!, 
      $fromName: String!, $name: String!, 
      $id: ID!, $subject: String!, 
      $toEmail: String!, $timeZone: 
      String!, $locale: String!) {  
        updateEmailTemplate(input: {
          bccEmail: $bccEmail, 
          body: $body, 
          ccEmail: $ccEmail, 
          fromEmail: $fromEmail, 
          fromName: $fromName, 
          name: $name, 
          id: $id, 
          subject: $subject, 
          toEmail: $toEmail, 
          timeZone: $timeZone, 
          locale: $locale}) {    
            bccEmail    
            body    
            ccEmail    
            fromEmail 
            fromName    
            name    
            id    
            subject    
            toEmail    
            locale    
            timeZone    
            hasInsecureContent    
            __typename  
          }
        }`
    const variables = template
    await client.request(mutation, variables)
    this.log("Processed template with subject '" + template.subject + "'")
  }
}

EditCommand.description = `Edit your Pipefy E-Mail Templates
...
Extra documentation goes here
`

EditCommand.flags = {
  name: flags.string({ char: 'n', description: 'name to print' }),
  timezone: flags.boolean({ char: 't', description: 'ask for timezone to reset for all templates' }),
  language: flags.boolean({ char: 'l', description: 'ask for language to reset for all templates' }),
  skipEdit: flags.boolean({ char: 's', description: 'skip edit and only do other tasks (timezone, language, if applicable)' }),
}

EditCommand.args = [{
  name: 'pipeIds',
  required: false,
  description: 'The comma-separated ids of the pipes whose E-Mails to edit. Empty = all',
  hidden: false,
  parse: input => input.split(','),
}, {
  name: 'organizationId',
  required: false,
  description: 'The id of the organization whose E-Mails to edit. Not used if pipeIds is specified.',
  hidden: false,
  parse: input => input.split(','),
}, {
  name: 'token',
  required: true,
  description: 'The API-Token for the Pipefy GraphQL API',
  hidden: false,
}]

module.exports = EditCommand
