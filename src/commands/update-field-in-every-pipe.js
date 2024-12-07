import { Command, Flags, Args } from "@oclif/core";
import { GraphQLClient, gql } from "graphql-request";
import asyncForEach from "../utils/async-foreach.js";

class UpdateFieldInEveryPipeCommand extends Command {
  async run() {
    const { flags, args } = await this.parse(UpdateFieldInEveryPipeCommand);

    // setup GraphQL Client
    let headers = {
      Authorization: "Bearer " + args.token,
    };
    const normalClient = new GraphQLClient("https://api.pipefy.com/graphql", {
      headers: headers,
    });

    let pipesPhases = await this.loadPipesWithPhasesAndFields(
      normalClient,
      args.organizationId,
    );
    this.log(`Got ${pipesPhases.pipes.length} pipes`);
    await asyncForEach(pipesPhases.pipes, async (pipe) => {
      this.log(`Handling pipe "${pipe.name}"`);
      await asyncForEach(pipe.phases, async (phase) => {
        for (let field of phase.fields) {
          if (
            field.label == args.fieldIdentifier ||
            field.internal_id == args.fieldIdentifier ||
            field.uuid == args.fieldIdentifier ||
            field.id == args.fieldIdentifier
          ) {
            let results = await this.updateField(normalClient, field, flags);
            this.log(
              `Updated field with id ${field.id} and internal id ${field.internal_id} in phase ${phase.name}`,
            );
          }
        }
      });
    });
  }

  async updateField(client, existingField, flags) {
    let query = gql`mutation {
      updatePhaseField(input: {
        label: "${flags.label}",
        id: "${existingField.id}",
        uuid: "${existingField.uuid}",
        description: "${flags.description}",
        help: "${flags.help}",
        minimal_view: ${flags.minimal},
        editable: ${flags.editable}
      }) {clientMutationId phase_field { id internal_id } }
    }`;

    // canConnectExisting: true,
    // canConnectMultiples: false,
    
    let results = await client.request(query);
    return results.createPhaseField;
  }

  async loadPipesWithPhasesAndFields(client, organizationId) {
    let query = gql`query {
      organization(id: "${organizationId}") {
        pipes{
          id, name
          phases {
            id, name
            id name fields { id uuid internal_id type label }
          }
        }
      }
    }
    `;

    let results = await client.request(query);
    return results.organization;
  }
}

UpdateFieldInEveryPipeCommand.description = `Update a field in all phases and pipes where it exists
...
This command loops all your Pipefy pipes and phases and modifies the field as specified.

`;

UpdateFieldInEveryPipeCommand.flags = {
  label: Flags.string({
    required: true,
    description: "The label of the field.",
    char: "l",
  }),
  description: Flags.string({
    required: false,
    default: "",
    description: "The description of the field.",
    char: "d",
  }),
  help: Flags.string({
    required: false,
    default: "",
  }),
  minimal: Flags.boolean({
    required: false,
    default: false,
    description: "Whether to use the minimal view",
  }),
  editable: Flags.boolean({
    required: false,
    default: true,
    description: "Whether the field can be edited in other phases",
  }),
};

UpdateFieldInEveryPipeCommand.args = {
  token: Args.string({
    name: "token",
    required: true,
    description: "The API-Token for the Pipefy GraphQL API",
  }),
  organizationId: Args.integer({
    name: "organizationId",
    required: true,
    description: "The id of the organization to load the pipes for.",
  }),
  fieldIdentifier: Args.string({
    name: "fieldIdentifier",
    required: true,
    description: "The label or id of the field to update.",
  }),
};

// module.exports = AddFieldToEveryPipeCommand
export default UpdateFieldInEveryPipeCommand;
