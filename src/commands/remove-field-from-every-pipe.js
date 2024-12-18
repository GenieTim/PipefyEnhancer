import { Command, Flags, Args } from "@oclif/core";
import { GraphQLClient, gql } from "graphql-request";
import asyncForEach from "../utils/async-foreach.js";

class RemoveFieldFromEveryPipeCommand extends Command {
  async run() {
    const { flags, args } = await this.parse(RemoveFieldFromEveryPipeCommand);

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
          if (field.label == args.fieldName) {
            if (flags.type === null || field.type === flags.type) {
              let results = await this.processField(
                normalClient,
                field.id,
                pipe.uuid,
              );
              this.log(
                `Deleted field with id ${field.id} and internal id ${field.internal_id} in phase ${phase.name}`,
              );
            }
          }
        }
      });
    });
  }

  async processField(client, fieldId, pipeUuid) {
    let query = gql`mutation {
      deletePhaseField(input: {
        id: "${fieldId}",
        pipeUuid: "${pipeUuid}"
      }) {clientMutationId }
    }`;

    let results = await client.request(query);
    return results.createPhaseField;
  }

  async loadPipesWithPhasesAndFields(client, organizationId) {
    let query = gql`query {
      organization(id: "${organizationId}") {
        pipes{
          id name uuid
          start_form_fields { id internal_id type label }
          phases {
            id, name
            id name fields{ id internal_id type label }
          }
        }
      }
    }
    `;

    let results = await client.request(query);
    return results.organization;
  }
}

RemoveFieldFromEveryPipeCommand.description = `Remove a field with the same name in all pipes
...
This command loops all your Pipefy pipes and removes the field as specified.

`;

RemoveFieldFromEveryPipeCommand.flags = {
  type: Flags.string({
    required: false,
    default: null,
    description: "The type of the field.",
    char: "t",
    options: [
      "assignee_select",
      "attachment",
      "checklist_horizontal",
      "checklist_vertical",
      "cnpj",
      "connector",
      "cpf",
      "currency",
      "date",
      "datetime",
      "due_date",
      "email",
      "id",
      "label_select",
      "long_text",
      "number",
      "phone",
      "radio_horizontal",
      "radio_vertical",
      "select",
      "short_text",
      "statement",
      "time",
    ],
  }),
};

RemoveFieldFromEveryPipeCommand.args = {
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
  fieldName: Args.string({
    name: "fieldName",
    required: true,
    description: "The label of the field in all pipes to remove.",
  }),
};

// module.exports = AddFieldToEveryPipeCommand
export default RemoveFieldFromEveryPipeCommand;
