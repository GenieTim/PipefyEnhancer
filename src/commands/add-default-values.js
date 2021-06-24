const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const asyncForEach = require('../utils/async-foreach')
const deepEqual = require('../utils/deep-equal')

class AddDefaultValuesCommand extends Command {
  async run() {
    const {flags, args} = this.parse(AddDefaultValuesCommand)

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {
      headers: headers,
    })

    await this.processPhase(normalClient, flags)
    // await asyncForEach(databaseId, async (pipeId) => {
    //   this.log("Processing pipe " + pipeId);
    //   await this.processDatabase(normalClient, databaseId, flags);
    // });
  }

  async processPhase(client, flags) {
    // render documentation incl. translations
    let phase = await this.getPhaseEntries(client, flags.phaseId, false)
    phase = phase.phase
    this.log(
      `Pipe "${phase.name}" has currently ${phase.cards_count} entries (found ${phase.cards.edges.length})`
    )

    let nrUpdated = 0
    await asyncForEach(phase.cards.edges, async card => {
      card = card.node
      let needsUpdating = true
          // this.log(card.fields)
      card.fields.forEach(field => {
        // this.log(field)
        if (
          field.field.internal_id == flags.fieldId ||
          field.field.id == flags.fieldId
        ) {
          if (field.value) {
            needsUpdating = false
          }
        }
      })
      if (needsUpdating) {
        if (!flags.dry) {
          await this.setFieldValue(client, card.id, flags.fieldId, flags.value)
        }
        nrUpdated++
      }
    })

    this.log(`Updated ${nrUpdated} cards`)
  }

  async setFieldValue(client, cardId, fieldId, value) {
    let query = gql`mutation {
      updateCardField(input: {
        card_id: "${cardId}",
        field_id: "${fieldId}"
        new_value: "${value}"
      }) {
        success, clientMutationId
      }
    }`

    let results = await client.request(query)
    if (!results.updateCardField.success) {
      this.warn('Update of field not successfull for card with id ' + cardId)
      this.log(results)
    }
  }

  /**
   * Fetch the Entries (Cards) in a phase
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} phaseId the ID of the phase to load the entries for
   * @param {string} cursor The cursor where to start
   * @returns {object} the table ojbect
   */
  async getPhaseEntries(client, phaseId, cursor = false) {
    let recordArgs = 'first: 50'
    if (cursor !== false) {
      recordArgs = 'after: "' + cursor + '"'
    }
    let query = gql`query {
      phase(id: "${phaseId}") {
        cards(${recordArgs}) {
          edges {
            node {
              title
              id
              fields {
                field {
                  internal_id
                  id
                }
                value
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
        cards_count
        name
      }
    }
    `

    let results = await client.request(query)
    const pageInfo = results.phase.cards.pageInfo
    if (pageInfo.hasNextPage) {
      this.log(`Loading additional cards for cursor "${pageInfo.endCursor}"`)
      const nextData = await this.getPhaseEntries(
        client,
        phaseId,
        pageInfo.endCursor
      )
      results.phase.cards.edges = results.phase.cards.edges.concat(
        nextData.phase.cards.edges
      )
    }
    return results
  }

  /**
   * Delete the database entries by id
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {array} toDeleteIds The ids of the cards to delete
   */
  async deleteDatabaseEntries(client, toDeleteIds) {
    let deleteQueries = ''
    let idx = 0
    async function doDelete(deleteQueries) {
      let query = gql`mutation {
        ${deleteQueries}
      }`
      await client.request(query)
    }

    await asyncForEach(toDeleteIds, async id => {
      idx += 1
      deleteQueries += `N${idx} :deleteTableRecord(input: {id: "${id}"}) {clientMutationId, success} `
      if (idx % 30) {
        await doDelete(deleteQueries)
        deleteQueries = ''
      }
    })
    if (deleteQueries !== '') {
      await doDelete(deleteQueries)
    }
  }

  assert(condition, note) {
    if (!condition) {
      this.error(`Assertion failed: ${note}`)
    }
  }
}

AddDefaultValuesCommand.description = `Set a value to a field in all cards of a phase
...
This command loops all your Cards of the specified pipe and phase 
and sets the specified value on the specified field
`

AddDefaultValuesCommand.flags = {
  phaseId: flags.string({
    required: true,
    description: 'The phase to change the cards in',
  }),
  fieldId: flags.string({
    required: true,
    description: 'The field id to change its values',
  }),
  value: flags.string({
    required: true,
    description: 'The value to change the field to',
  }),
  dry: flags.boolean({
    required: false,
    default: false,
    description:
      'Whether to do a dry run: just output how many entries would be deleted etc.',
  }),
}

AddDefaultValuesCommand.args = [
  {
    name: 'token',
    required: true,
    description: 'The API-Token for the Pipefy GraphQL API',
    hidden: false,
  },
]

module.exports = AddDefaultValuesCommand
