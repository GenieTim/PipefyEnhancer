import {Command, Flags} from '@oclif/core'
import {GraphQLClient, gql} from 'graphql-request'
import asyncForEach from '../utils/async-foreach.js'
import sandman from '../utils/sandman.js'

class MovePhaseFieldCommand extends Command {
  async run() {
    const {flags, args} = await this.parse(MovePhaseFieldCommand)

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {
      headers: headers,
    })

    await this.processPipe(normalClient, flags)
  }

  /**
   * Add the default values to one phase as specified
   *
   * @param {object} client The GraphQL Cleint
   * @param {object} flags The console command's flags
   */
  async processPipe(client, flags) {
    let pipe = await this.getPipePhases(client, flags.pipeId)
    this.log("Processing pipe '" + pipe.name + "'")
    let cardValueMap = {}
    let fieldToCreate = null

    await asyncForEach(pipe.phases, async phase => {
      phase.fields.forEach(field => {
        if (
          field.id === flags.fieldId ||
          field.internal_id === flags.fieldId ||
          field.uuid === flags.fieldId
        ) {
          if (fieldToCreate !== null) {
            this.error(
              'Found more than one field with this id. Operation not save.',
              {exit: true},
            )
          }
          fieldToCreate = field
        }
      })

      this.log("Retrieving contents of phase '" + phase.name + "'")
      let phaseEntries = await this.getPhaseEntries(client, phase.id, false)
      let nrToUpdate = 0
      phaseEntries.phase.cards.edges.forEach(edge => {
        const card = edge.node
        card.fields.forEach(field => {
          if (
            field.field.internal_id === flags.fieldId ||
            field.field.id === flags.fieldId
          ) {
            cardValueMap[card.id] = field.array_value ?
              field.array_value :
              field.value
            nrToUpdate++
          }
        })
      })
      this.log(
        `Phase "${phase.name}" has currently ${phase.cards_count} entries (found ${phaseEntries.phase.cards.edges.length}), of which ${nrToUpdate} values will be moved`,
      )
    })

    // create field
    let fieldMutationResult = await this.createField(
      client,
      fieldToCreate,
      flags.targetPhaseId,
    )
    let newField = fieldMutationResult.createPhaseField.phase_field

    this.log(
      `Created field with id ${newField.id} and internal_id ${newField.internal_id}`,
    )

    // migrate data to new field
    for (const [key, value] of Object.entries(cardValueMap)) {
      // eslint-disable-next-line no-await-in-loop
      await this.setFieldValue(client, key, newField.id, value)
      // eslint-disable-next-line no-await-in-loop
      await sandman.randomSleep(100) // as we are doing a lot of requests, this is probably needed to prevent blocks
    }

    this.log(`Done migrating ${Object.entries(cardValueMap).length} values`)
    this.log(
      'Remember to delete the field and adjust conditionals and automations. For safety, this is not yet done automatically.',
    )
  }

  /**
   * Use the GraphQL API to set the value of a field
   *
   * @param {object} client The graphQL client
   * @param {int} cardId The id of the card to set the field on
   * @param {string} fieldId The id of the field to set the value of
   * @param {string|int|boolean} value The value to set the field to
   */
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
                array_value
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
        pageInfo.endCursor,
      )
      results.phase.cards.edges = results.phase.cards.edges.concat(
        nextData.phase.cards.edges,
      )
    }
    return results
  }

  /**
   * Fetch the Entries (Cards) in a phase
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} pipeId the ID of the phase to load the entries for
   * @returns {object} the table ojbect
   */
  async getPipePhases(client, pipeId) {
    let query = gql`query {
      pipe(id: "${pipeId}") {
        phases {
          name 
          id 
          cards_count
          fields {
            description editable help id internal_id is_multiple label minimal_view required synced_with_card type uuid custom_validation
            allChildrenMustBeDoneToFinishParent allChildrenMustBeDoneToMoveParent canConnectExisting canConnectMultiples canCreateNewConnected
            childMustExistToFinishParent options
          }
        }
        cards_count
        name
      }
    }
    `

    let results = await client.request(query)
    return results.pipe
  }

  /**
   * Fetch the Entries (Cards) in a phase
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {object} field the PhaseField object to use as blueprint
   * @param {int} phaseId the id of the phase to create the field on
   * @returns {object} the created PhaseField
   */
  async createField(client, field, phaseId) {
    const translationMap = {
      // eslint-disable-next-line camelcase
      synced_with_card: 'sync_with_card',
    }
    let inputString = '{'
    for (const [key, value] of Object.entries(field)) {
      let translatedKey = key
      if (key in translationMap) {
        translatedKey = translationMap[key]
      }
      // filter properties that may not be submitted
      if (['id', 'internal_id', 'is_multiple', 'uuid'].includes(translatedKey)) {
        continue
      }
      if (typeof value === 'boolean' || typeof value === 'number') {
        inputString += translatedKey + `: ${value}, `
      } else {
        inputString += translatedKey + `: "${value}", `
      }
    }
    inputString += `phase_id: "${phaseId}"`
    inputString += '}'

    let mutation =
      gql`mutation {
      createPhaseField(input: ` +
      inputString +
      `) {
        phase_field {
          description editable help id internal_id is_multiple label minimal_view required synced_with_card type uuid custom_validation
          allChildrenMustBeDoneToFinishParent allChildrenMustBeDoneToMoveParent canConnectExisting canConnectMultiples canCreateNewConnected
          childMustExistToFinishParent options
        }
      }
    }
    `

    let results = await client.request(mutation)
    return results
  }
}

MovePhaseFieldCommand.description = `Move a field from one phase to another
...
This command loops all your Cards of the specified pipe and phase 
and gets the specified value on the specified field, 
then adds the new field, sets its value (where possible), 
and finally reminds you to delete the old field.

⚠️ NOTE: untested for certain field types! 
`

MovePhaseFieldCommand.flags = {
  version: Flags.version(),
  help: Flags.help(),
  pipeId: Flags.string({
    required: true,
    description: 'The id of the pipe containing the phases and field',
  }),
  targetPhaseId: Flags.string({
    required: true,
    description: 'The id of the new phase to move the field to',
  }),
  fieldId: Flags.string({
    required: true,
    description: 'The id of the field to move',
  }),
  dry: Flags.boolean({
    required: false,
    default: false,
    description:
      'Whether to do a dry run: just output how many entries would be deleted etc.',
  }),
}

MovePhaseFieldCommand.args = [
  {
    name: 'token',
    required: true,
    description: 'The API-Token for the Pipefy GraphQL API',
    hidden: false,
  },
]

// module.exports = MovePhaseFieldCommand
export default MovePhaseFieldCommand
