import { Command, Flags, Args } from "@oclif/core";
import { GraphQLClient, gql } from "graphql-request";
import asyncForEach from "../utils/async-foreach.js";

class AddFieldToEveryPipeCommand extends Command {
  async run() {
    const { flags, args } = await this.parse(AddFieldToEveryPipeCommand);

    // setup GraphQL Client
    let headers = {
      Authorization: "Bearer " + args.token,
    };
    const normalClient = new GraphQLClient("https://api.pipefy.com/graphql", {
      headers: headers,
    });

    let pipesPhases = await this.loadPipesWithPhases(
      normalClient,
      args.organizationId,
    );
    this.log(`Got ${pipesPhases.pipes.length} pipes`);
    await asyncForEach(pipesPhases.pipes, async (pipe) => {
      this.log(`Handling pipe "${pipe.name}"`);
      await asyncForEach(pipe.phases, async (phase) => {
        if (phase.name.trim() === args.phaseName.trim()) {
          let results = await this.processPhase(normalClient, phase.id, flags);
          this.log(
            `Created field with id ${results.phase_field.id} and internal id ${results.phase_field.internal_id} in phase ${phase.name}`,
          );
        } else {
          // this.log(`${phase.name} != ${args.phaseName}`)
        }
      });
    });
  }

  async processPhase(client, phaseId, flags) {
    let query = gql`mutation {
      createPhaseField(input: {
        label: "${flags.label}",
        phase_id: "${phaseId}",
        type: "${flags.type}",
        description: "${flags.description}",
        help: "${flags.help}",
        minimal_view: ${flags.minimal},
        editable: ${flags.editable}
      }) {clientMutationId phase_field { id internal_id } }
    }`;

    let results = await client.request(query);
    return results.createPhaseField;
  }

  async loadPhases(client, pipeId) {
    let query = gql`query {
      pipe(id: "${pipeId}") {
        phases {
          id, name
        }
      }
    }
    `;

    let results = await client.request(query);
    return results.pipe.phases;
  }

  async loadPipesWithPhases(client, organizationId) {
    let query = gql`query {
      organization(id: "${organizationId}") {
        pipes{
          id, name
          phases {
            id, name
          }
        }
      }
    }
    `;

    let results = await client.request(query);
    return results.organization;
  }
}

AddFieldToEveryPipeCommand.description = `Add a field to every phase with the same name in all pipes
...
This command loops all your Pipefy pipes adds the field as specified to every phase with the specified name.

`;

AddFieldToEveryPipeCommand.flags = {
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
  type: Flags.string({
    required: true,
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

AddFieldToEveryPipeCommand.args = {
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
  phaseName: Args.string({
    name: "phaseName",
    required: true,
    description: "The name of the phase in all pipes to add the fields to.",
  }),
};

// module.exports = AddFieldToEveryPipeCommand
export default AddFieldToEveryPipeCommand;
