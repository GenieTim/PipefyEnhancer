const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const asyncForEach = require('../utils/async-foreach')

class FixDuplicateDBFieldValues extends Command {
  async run() {
    const {flags, args} = this.parse(FixDuplicateDBFieldValues)
    // check if all arguments & flags make sense
    if (!args.databaseId) {
      this.warn('databaseId is not specified. Exiting.')
      return
    }

    // setup GraphQL Client
    let headers = {
      Authorization: 'Bearer ' + args.token,
    }
    const normalClient = new GraphQLClient('https://api.pipefy.com/graphql', {
      headers: headers,
    })
    let databaseId = args.databaseId ?
      args.databaseId :
      await this.loaddatabaseId(normalClient, args.organizationId)
    this.log('Found ' + databaseId.length + ' databases.')
    await asyncForEach(databaseId, async pipeId => {
      this.log('Processing database ' + pipeId)
      await this.processDatabase(normalClient, databaseId, flags)
    })
  }

  async processDatabase(client, databaseId, flags) {
    // load all entries (TODO: might be better to run one cursor at a time, memory-wise)
    let database = await this.getDatabaseEntries(client, databaseId, false)
    this.log(
      `Database "${database.table.name}" has currently ${database.table.table_records_count} entries (found ${database.table.table_records.edges.length})`,
    )

    let duplicatesFound = 0
    await asyncForEach(database.table.table_records.edges, async node => {
      node = node.node
      let refValue = ''
      let valueToCheck = ''
      let fieldId = ''
      node.record_fields.forEach(field => {
        if (
          field.field.id === flags.fieldReset ||
          field.field.internal_id === flags.fieldReset
        ) {
          refValue = field.value
          fieldId = field.field.id
        }
        if (
          field.field.id === flags.fieldCheck ||
          field.field.internal_id === flags.fieldCheck
        ) {
          valueToCheck = field.value
        }
      })

      if ((refValue === valueToCheck || (flags.checkRearrange && this.matchesRearranged(refValue, valueToCheck))) && valueToCheck !== '' && fieldId !== '') {
        // update!
        duplicatesFound++
        if (!flags.dry) {
          await this.resetDatabaseCardField(client, node.id, fieldId)
        }
      }
    })

    this.log(
      `Updated ${duplicatesFound} entries... of originally ${database.table.table_records.edges.length} cards`,
    )
  }

  /**
   * Check whether two strings, split by " ", consist of the same components
   * 
   * @param {string} value1 The first value to compare
   * @param {string} value2 The value to compare the first to
   * @returns {boolean} whether the values match
   */
  matchesRearranged(value1, value2) {
    const delimeter = ' '
    const value1split = value1.split(delimeter).sort()
    const value2split = value2.split(delimeter).sort()
    return value1split.equals(value2split)
  }

  /**
   * Fetch the Entries (Cards) in a database
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} databaseId the ID of the database to load the entries for
   * @param {string} cursor The cursor where to start
   * @returns {object} the table ojbect
   */
  async getDatabaseEntries(client, databaseId, cursor = false) {
    let recordArgs = 'first: 50'
    if (cursor !== false) {
      recordArgs = 'after: "' + cursor + '"'
    }
    let query = gql`query {
      table(id: "${databaseId}") {
        table_records(${recordArgs}) {
          edges {
            node {
              title
              id
              record_fields {
                field {
                  internal_id
                  id
                }
                value
              }
              parent_relations {
                id
                name
                repo_items(first: 2) {
                  edges {
                    cursor
                    node {
                      ... on Card {
                        id
                      }
                      ... on TableRecord {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
        table_records_count
        name
      }
    }
    `

    let results = await client.request(query)
    const pageInfo = results.table.table_records.pageInfo
    if (pageInfo.hasNextPage) {
      this.log(`Loading additional cards for cursor "${pageInfo.endCursor}"`)
      const nextData = await this.getDatabaseEntries(
        client,
        databaseId,
        pageInfo.endCursor,
      )
      results.table.table_records.edges =
        results.table.table_records.edges.concat(
          nextData.table.table_records.edges,
        )
    }
    return results
  }

  /**
   * Reset the database entries field by id
   *
   * @param {GraphQLClient} client The client for API Communication
   * @param {int} toChangeCardId The ids of the cards to delete
   * @param {string} fieldId The id of the field to reset
   */
  async resetDatabaseCardField(client, toChangeCardId, fieldId) {
    let query = gql`mutation {
      N0 :setTableRecordFieldValue(input: {table_record_id: "${toChangeCardId}", field_id: "${fieldId}", value: ""}){clientMutationId}
    }`

    await client.request(query)
  }
}

FixDuplicateDBFieldValues.description = `Remove duplicate field values from a Pipefy Database
...
This command loops all your Pipefy DataBase Entries of the specified database 
and sets one field to empty if it has the same value as another one
`

FixDuplicateDBFieldValues.flags = {
  fieldCheck: flags.string({
    required: true,
    default: false,
    description: 'The first field to check the value',
  }),
  fieldReset: flags.string({
    required: true,
    default: false,
    description:
      'The field to set to an empty value if it has the same value as fieldCheck',
  }),
  checkRearrange: flags.boolean({
    required: false,
    default: false,
    description:
      "Whether the field's value should be checked for a match when split at a space\n" +
      "E.g.: names: 'Test Nest' matches 'Nest Test'.",
  }),
  dry: flags.boolean({
    required: false,
    default: false,
    description:
      'Whether to do a dry run: just output how many entries would be deleted etc.',
  }),
}

FixDuplicateDBFieldValues.args = [
  {
    name: 'token',
    required: true,
    description: 'The API-Token for the Pipefy GraphQL API',
    hidden: false,
  },
  {
    name: 'databaseId',
    required: true,
    description: 'The id of the database to filter for duplicates.',
    hidden: false,
    parse: input => input.split(','),
  },
]

module.exports = FixDuplicateDBFieldValues
