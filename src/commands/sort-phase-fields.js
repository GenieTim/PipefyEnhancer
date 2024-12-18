import { Command, Flags, Args } from "@oclif/core";
import { GraphQLClient, gql } from "graphql-request";
import asyncForEach from "../utils/async-foreach.js";

class SortPhaseFieldsCommand extends Command {
  async run() {
    const { flags, args } = await this.parse(SortPhaseFieldsCommand);

    // setup GraphQL Client
    let headers = {
      Authorization: "Bearer " + args.token,
    };
    const normalClient = new GraphQLClient("https://api.pipefy.com/graphql", {
      headers: headers,
    });

    let fields = await this.loadPhasesAndFields(normalClient, args.phaseId);

    let minimumIndex = 0;
    if (flags.after) {
      let afterFieldFound = false;
      for (let field of fields.fields) {
        if (field.label == flags.after) {
          minimumIndex = field.index;
          afterFieldFound = true;
          break;
        }
      }
      if (!afterFieldFound) {
        this.error(`Field "${flags.after}" not found.`);
        return;
      }
    }

    let sortedFields = fields.fields.sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

    let nFieldsMoved = 0;
    for (let i = 0; i < sortedFields.length; i++) {
      if (sortedFields[i].index >= minimumIndex) {
        this.log(
          `Moving field "${sortedFields[i].label}" to index ${minimumIndex + i}...`,
        );
        await this.updateField(normalClient, sortedFields[i], minimumIndex + i);
        nFieldsMoved += 1;
      }
    }

    this.log(`Got ${sortedFields.length} fields, moved ${nFieldsMoved} fields.`);
  }

  async updateField(client, existingField, index) {
    let query = gql`mutation {
      updatePhaseField(input: {
        label: "${existingField.label}",
        id: "${existingField.id}",
        uuid: "${existingField.uuid}",
        index: ${index}
      }) {clientMutationId phase_field { id internal_id } }
    }`;

    // canConnectExisting: true,
    // canConnectMultiples: false,

    let results = await client.request(query);
    return results.createPhaseField;
  }

  async loadPhasesAndFields(client, phaseId) {
    let query = gql`query {
      phase(id: "${phaseId}") {
            id name
            fields { 
              id uuid internal_id type label editable minimal_view index 
            }
      }
    }
    `;

    let results = await client.request(query);
    return results.phase;
  }
}

SortPhaseFieldsCommand.description = `Reorder fields in a specific phase
...
This command loops all fields in a specific phase and re-orders the fields based on their label.

`;

SortPhaseFieldsCommand.flags = {
  after: Flags.string({
    required: true,
    description: "The label of the field after which to start sorting.",
    char: "a",
  }),
  inverse: Flags.boolean({
    required: false,
    default: false,
    description: "Whether to reverse the sorting order.",
  }),
};

SortPhaseFieldsCommand.args = {
  token: Args.string({
    name: "token",
    required: true,
    description: "The API-Token for the Pipefy GraphQL API",
  }),
  phaseId: Args.string({
    name: "phaseId",
    required: true,
    description: "The id of the phase to sort the fields in.",
  }),
};

// module.exports = AddFieldToEveryPipeCommand
export default SortPhaseFieldsCommand;
