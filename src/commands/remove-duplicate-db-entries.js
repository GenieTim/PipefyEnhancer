const {Command, flags} = require('@oclif/command')
const {GraphQLClient, gql} = require('graphql-request')
const asyncForEach = require('../utils/async-foreach')
const deepEqual = require('../utils/deep-equal')

class RemoveDuplicateDBEntriesCommand extends Command {
  async run() {
    const {flags, args} = this.parse(RemoveDuplicateDBEntriesCommand)
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
    // load all entries
    let database = await this.getDatabaseEntries(client, databaseId, false)
    this.log(
      `Database "${database.table.name}" has currently ${database.table.table_records_count} entries (found ${database.table.table_records.edges.length})`,
    )

    let nodeArrayArray = []
    let duplicatesFound = 0
    database.table.table_records.edges.forEach(node => {
      let foundDuplicate = false
      // search for arrays which contain this node
      // some: forEach with early exit capabilities!
      nodeArrayArray.some((nodeArray, nodeArrayIdx) => {
        // check if this array contains this node
        nodeArray.some(nodeToCompare => {
          // check if this node is equivalent
          // BUT: ignore certain properties
          let equivalent = false
          // compare them
          equivalent = deepEqual(node, nodeToCompare, ['id', 'parent_relations'])
          // this.log(`Comparing ${JSON.stringify(nodeDeproped)} with ${JSON.stringify(nodeToCompareDeproped)}: ${equivalent}`)
          if (equivalent) {
            nodeArrayArray[nodeArrayIdx].push(node)
            foundDuplicate = true
          }
          // this.log(foundDuplicate)
          return foundDuplicate
        })
        return foundDuplicate
      })

      if (foundDuplicate) {
        duplicatesFound++
      } else {
        nodeArrayArray.push([node])
      }
      // this.log(`Current nodeArrayArray size: ${nodeArrayArray.length}`)
    })
    this.log(`Found ${duplicatesFound} duplicates...`)
    if (flags.merge) {
      this.warn('Merge option not yet implemented.')
    }
    let nrOfDeletions = 0
    // now, do filter for cards to delete
    await asyncForEach(nodeArrayArray, async nodeArray => {
      if (nodeArray.length > 1) {
        // delete
        let toDeleteIds = []
        nodeArray.forEach(node => {
          let hasJoinedCards = false
          node.node.parent_relations.forEach(relation => {
            if (relation.repo_items.edges.length > 0) {
              hasJoinedCards = true
            }
          })
          if (!hasJoinedCards) {
            toDeleteIds.push(node.node.id)
          }
        })
        if (toDeleteIds.length === nodeArray.length) {
          // keep at least one
          toDeleteIds.pop()
          this.assert(nodeArray.length !== toDeleteIds.length, 'Removal of one entry to keep failed')
        }
        if (flags.dry) {
          this.log(`Would be deleting the following entries: ${JSON.stringify(toDeleteIds)} (of dupes: ${JSON.stringify(nodeArray.map(node => node.node.id))})`)
        } else {
          this.log(`Deleting the following entries: ${JSON.stringify(toDeleteIds)} (of dupes: ${JSON.stringify(nodeArray.map(node => node.node.id))})`)
          await this.deleteDatabaseEntries(client, toDeleteIds)
        }
        nrOfDeletions += toDeleteIds.length
      }
    })

    this.log(`Deleted ${nrOfDeletions} of originally ${database.table.table_records.edges.length} cards`)
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
      results.table.table_records.edges = results.table.table_records.edges.concat(
        nextData.table.table_records.edges,
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

    for (idx = 0; idx < toDeleteIds.length; idx++) {
      idx += 1
      const id = toDeleteIds[idx]
      deleteQueries += `N${idx} :deleteTableRecord(input: {id: "${id}"}) {clientMutationId, success} `
      if (idx % 30) {
        // we do the updates sequentally instead of parallel —
        // this simplifies using multiple queries at once
        // eslint-disable-next-line no-await-in-loop
        await doDelete(deleteQueries)
        deleteQueries = ''
      }
    }
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

RemoveDuplicateDBEntriesCommand.description = `Remove duplicates from a Pipefy Database
...
This command loops all your Pipefy DataBase Entries of the specified database 
and deletes the ones duplicates without connected cards (or merges them, see "-m")
`

RemoveDuplicateDBEntriesCommand.flags = {
  merge: flags.boolean({
    required: false,
    default: false,
    description:
      'Merge if duplicates have connected cards. \nCAUTION: make sure the connection field is editable.',
    char: 'm',
  }),
  dry: flags.boolean({
    required: false,
    default: false,
    description:
      'Whether to do a dry run: just output how many entries would be deleted etc.',
  }),
}

RemoveDuplicateDBEntriesCommand.args = [
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

module.exports = RemoveDuplicateDBEntriesCommand
