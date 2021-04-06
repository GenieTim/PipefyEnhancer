const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const inquirer = require('inquirer')
const asyncForEach = require('../utils/async-foreach')

const otherEmailFields = ['subject', 'name', 'fromName', 'fromEmail', 'toEmail', 'ccEmail', 'bccEmail']

class EditEmailTemplatesCommand extends Command {
  async run() {
    const {flags, args} = this.parse(EditEmailTemplatesCommand)
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
      timezone = flags.timezone
      this.log('Will set all timezones to "' + timezone + '"')
    }
    if (flags.language) {
      language = flags.language
      this.log('Will set all languages to "' + language + '"')
    }

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {headers: headers})
    const coreClient = new GraphQLClient('https://app.pipefy.com/graphql/core', {headers: headers})
    let pipeIds = args.pipeIds ? args.pipeIds : await this.loadPipeIds(normalClient, args.organizationId)
    this.log('Found ' + pipeIds.length + ' pipes.')
    await asyncForEach(pipeIds, async pipeId => {
      this.log('Processing pipe ' + pipeId)
      await this.processEMailsForPipe(coreClient, pipeId, timezone, language, flags)
    })
  }

  async processEMailsForPipe(client, pipeId, timezone, language, flags) {
    let templates = await this.getEMailsForPipe(client, pipeId)
    this.log(`Found ${templates.edges.length} templates`)
    await asyncForEach(templates.edges, async template => {
      try {
        if (timezone !== '') {
          template.timeZone = timezone
        }
        if (language !== '') {
          template.locale = language
        }
        await this.processEMailTemplate(client, template.node, flags)
      } catch (error) {
        this.warn('Failed to process E-Mail Template')
        this.error(error, {exit: false})
      }
    })
  }

  /**
   * Ask fields and trigger save
   *
   * @param {GraphQLClient} client the client to use for API
   * @param {object} emailTemplate The template to edit
   * @param {object} flags the command line flags
   */
  async processEMailTemplate(client, emailTemplate, flags) {
    this.log(`Processing Template with current Subject "${emailTemplate.subject}"`)
    let questions = [{
      type: 'editor',
      name: 'body',
      message: 'What is the HTML content of the E-Mail?',
      default: emailTemplate.body.replaceAll(/\s{2,}/g, ' ').replaceAll(/<p>\s\{/g, '<p>{').replaceAll(/\s{1,}\./g, '.').replaceAll(/\s{1,},/g, ','),
      postfix: 'edit-mail.html',
    }]
    if (flags.otherFields) {
      flags.otherFields.forEach(field => {
        questions.push({
          type: 'text',
          name: field,
          message: 'What is the ' + field + ' of the E-Mail?',
          default: emailTemplate[field],
        })
      })
    }
    if (flags.skipEdit) {
      this.log('Skipping edit...')
    } else {
      this.log('You will be asked questions now...')
      let answers = await inquirer.prompt(questions)
      for (const [key, value] of Object.entries(answers)) {
        this.debug(`Setting ${key} to ${value}`)
        emailTemplate[key] = value
      }
    }
    await this.updateEMailTemplate(client, emailTemplate)
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

  /**
   * Run mutation to update the edited E-Mail-Template
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {object} template The template to persist
   */
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

EditEmailTemplatesCommand.description = `Edit your Pipefy E-Mail Templates
...
This command loops all your Pipefy E-Mail-Templates so you can fix them one by one.
The editor for the E-Mail-Templates is read from $VISUAL or $EDITOR environment variables. 
If neither of those are present, notepad (on Windows) or vim (Linux or Mac) is used.
(See: https://github.com/SBoudrias/Inquirer.js/#editor---type-editor)
`

EditEmailTemplatesCommand.flags = {
  timezone: flags.string({char: 't', description: 'timezone to reset for all templates'}),
  language: flags.string({char: 'l', description: 'language to reset for all templates'}),
  skipEdit: flags.boolean({char: 's', description: 'skip edit of E-Mail body'}),
  otherFields: flags.string({char: 'a', description: 'whether to ask/replace other fields (instead of only the E-Mail body) specified here', multiple: true, options: otherEmailFields}),
}

EditEmailTemplatesCommand.args = [{
  name: 'token',
  required: true,
  description: 'The API-Token for the Pipefy GraphQL API',
  hidden: false,
}, {
  name: 'organizationId',
  required: true,
  description: 'The id of the organization whose E-Mails to edit. Not used if pipeIds is specified.',
  hidden: false,
  parse: input => input.split(','),
}, {
  name: 'pipeIds',
  required: false,
  description: 'The comma-separated ids of the pipes whose E-Mails to edit. Empty = all pipes of your organization.',
  hidden: false,
  parse: input => input.split(','),
}]

module.exports = EditEmailTemplatesCommand
