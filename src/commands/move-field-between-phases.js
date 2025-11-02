import { Command, Flags, Args } from "@oclif/core";
import { GraphQLClient, gql } from "graphql-request";
import asyncForEach from "../utils/async-foreach.js";
import sandman from "../utils/sandman.js";

class MoveFieldBetweenPhasesCommand extends Command {
  async run() {
    const { flags, args } = await this.parse(MoveFieldBetweenPhasesCommand);

    // setup GraphQL Client
    let headers = {
      Authorization: "Bearer " + args.token,
    };
    const normalClient = new GraphQLClient("https://api.pipefy.com/graphql", {
      headers: headers,
    });

    // Load all phases in the pipe
    let phases = await this.loadPhases(normalClient, args.pipeId);
    // Find the existing field
    let fieldToMove = null;
    phases.forEach((phase) => {
      phase.fields.forEach((field) => {
        if (field.id === args.fieldId || field.internal_id === args.fieldId) {
          fieldToMove = { ...field, fromPhaseId: phase.id };
        }
      });
    });
    if (fieldToMove === null) {
      this.error(
        `Field with ID ${args.fieldId} not found in pipe ${args.pipeId}`,
      );
      return;
    }
    this.log(
      `Found field "${fieldToMove.label}" (ID: ${fieldToMove.id}) in phase ID ${fieldToMove.fromPhaseId}`,
    );

    // Load all cards in all phases
    let allCards = [];
    await asyncForEach(phases, async (phase) => {
      allCards = allCards.concat(
        (await this.loadAllCardsInPhase(normalClient, phase.id)).phase.cards
          .edges,
      );
    });

    // Create the new field in the target phase if it doesn't exist
    let targetPhase = phases.find((p) => p.id === args.toPhaseId);
    if (!targetPhase) {
      this.error(`Target phase ID ${args.toPhaseId} not found in pipe.`);
      return;
    }
    let targetField = targetPhase.fields.find(
      (f) => f.label === fieldToMove.label,
    );
    let targetFieldId = null;
    let fieldExisted = false;
    if (targetField) {
      this.warn(
        `Field "${fieldToMove.label}" already exists in target phase ID ${args.toPhaseId}.`,
      );
      targetFieldId = targetField.id;
      fieldExisted = true;
    } else {
      this.log(
        `Creating field "${fieldToMove.label}" in target phase ID ${args.toPhaseId}...`,
      );
      let createdField = await this.createPhaseField(
        normalClient,
        args.toPhaseId,
        fieldToMove,
      );
      this.log(
        `Created field with ID ${createdField.phase_field.id} in target phase.`,
      );
      targetFieldId = createdField.phase_field.id;
    }

    // Update all cards to set the field value in the new phase
    // if the field already existed, check whether there was a value already
    let failedCards = [];
    await asyncForEach(allCards, async (cardEdge) => {
      let card = cardEdge.node;
      let fieldValue = null;
      let existingFieldValue = null;
      card.fields.forEach((field) => {
        if (
          field.field.id === fieldToMove.id ||
          field.field.internal_id === fieldToMove.internal_id
        ) {
          fieldValue = field.array_value || field.float_value || field.value;
        }
        if (
          field.field.id === targetFieldId ||
          field.field.internal_id === targetFieldId
        ) {
          existingFieldValue = field.value;
        }
      });

      if (
        fieldExisted &&
        existingFieldValue !== null &&
        existingFieldValue !== undefined &&
        existingFieldValue !== fieldValue
      ) {
        this.log(
          `Skipping card "${card.title}" (ID: ${card.id}) as it already has a value for the target field.`,
        );
        failedCards.push(card);
        return;
      }

      try {
        await this.updateCardField(
          normalClient,
          card.id,
          targetFieldId,
          fieldValue,
        );
        this.log(
          `Updated card "${card.title}" (ID: ${card.id}) with new field value.`,
        );
      } catch (error) {
        this.warn(
          `Failed to update card "${card.title}" (ID: ${card.id}): ${error.message}`,
        );
        failedCards.push(card);
      }

      await sandman.randomSleep(1000);
    });

    // If no failures, remove the field from the original phase
    if (failedCards.length === 0) {
      this.log(
        `All cards updated successfully. Removing field from original phase ID ${fieldToMove.fromPhaseId}...`,
      );
      await this.removePhaseField(
        normalClient,
        await this.getPipeUuid(normalClient, args.pipeId),
        fieldToMove.id,
      );
      this.log(`Field removed from original phase.`);
    } else {
      this.warn(
        `Field not removed from original phase due to ${failedCards.length} failed card updates.`,
      );
    }
  }

  /**
   * Fetch the Entries (Cards) in a phase
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} phaseId the ID of the phase to load the entries for
   * @param {string} cursor The cursor where to start
   * @returns {object} the table object
   */
  async loadAllCardsInPhase(client, phaseId, cursor = false) {
    let recordArgs = "first: 50";
    if (cursor !== false) {
      recordArgs = 'after: "' + cursor + '"';
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
                date_value
                datetime_value
                float_value
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
    `;

    let results = await client.request(query);
    const pageInfo = results.phase.cards.pageInfo;
    if (pageInfo.hasNextPage) {
      this.log(`Loading additional cards for cursor "${pageInfo.endCursor}"`);
      const nextData = await this.getPhaseEntries(
        client,
        phaseId,
        pageInfo.endCursor,
      );
      results.phase.cards.edges = results.phase.cards.edges.concat(
        nextData.phase.cards.edges,
      );
    }
    return results;
  }

  async getPipeUuid(client, pipeId) {
    let query = gql`query {
      pipe(id: "${pipeId}") {
        uuid
      }
    }
    `;

    let results = await client.request(query);
    return results.pipe.uuid;
  }

  /**
   * Load all phases in a pipe
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} pipeId the ID of the pipe to load the phases for
   * @returns {array} the array of phases
   */
  async loadPhases(client, pipeId) {
    let query = gql`query {
      pipe(id: "${pipeId}") {
        phases {
          id, name,
          fields {
            id uuid internal_id type label
            description help minimal_view editable
            allChildrenMustBeDoneToFinishParent allChildrenMustBeDoneToMoveParent
            canConnectExisting canConnectMultiples canCreateNewConnected
            childMustExistToFinishParent custom_validation
            required
          }
        }
      }
    }
    `;

    let results = await client.request(query);
    return results.pipe.phases;
  }

  /**
   * Update a field value in a card
   *
   * @param {GraphQLClient} client the client to fetch data with
   * @param {string} cardId the ID of the card to update the field in
   * @param {string} fieldId the ID of the field to update
   * @param {any} value the new value for the field
   * @returns {object} the mutation result
   */
  async updateCardField(client, cardId, fieldId, value) {
    if (!value) {
      return {
        clientMutationId: null,
        card: { id: cardId },
      };
    }

    let query = gql`mutation {
      updateCardField(input: {
        card_id: "${cardId}",
        field_id: "${fieldId}",
        new_value: ${JSON.stringify(value)}
      }) {clientMutationId card { id } }
    }`;

    let results = await client.request(query);
    return results.updateCardField;
  }

  async createPhaseField(client, phaseId, field) {
    let query = gql`mutation {
      createPhaseField(input: {
        label: "${field.label}",
        phase_id: "${phaseId}",
        type: "${field.type}",
        description: "${field.description || ""}",
        help: "${field.help || ""}",
        minimal_view: ${field.minimal_view || false},
        editable: ${field.editable || false},
        allChildrenMustBeDoneToFinishParent: ${field.allChildrenMustBeDoneToFinishParent || false},
        allChildrenMustBeDoneToMoveParent: ${field.allChildrenMustBeDoneToMoveParent || false},
        canConnectExisting: ${field.canConnectExisting || false},
        canConnectMultiples: ${field.canConnectMultiples || false},
        canCreateNewConnected: ${field.canCreateNewConnected || false},
        childMustExistToFinishParent: ${field.childMustExistToFinishParent || false},
        custom_validation: "${field.custom_validation || ""}",
        required: ${field.required || false},
      }) {clientMutationId phase_field { id internal_id } }
    }`;

    let results = await client.request(query);
    return results.createPhaseField;
  }

  async removePhaseField(client, pipeUuid, fieldId) {
    let query = gql`mutation {
      deletePhaseField(input: {
        pipeUuid: "${pipeUuid}",
        id: "${fieldId}"
      }) {clientMutationId }
    }`;

    let results = await client.request(query);
    return results.deletePhaseField;
  }
}

MoveFieldBetweenPhasesCommand.description = `Move a field from one phase to another within the same pipe.
...
This command allows you to move a field from one phase to another within the same pipe.
The command loads all cards in the pipe, identifies the current values for the field in each card,
creates the field in the target phase if it doesn't exist, and updates each card to set the field value in the new phase.
Then, the field is removed from the original phase.
If any of the cards could not be updated, the command reports the failures at the end, and the field is not removed from the original phase.
`;

MoveFieldBetweenPhasesCommand.flags = {
  help: Flags.help({ char: "h" }),
};

MoveFieldBetweenPhasesCommand.args = {
  token: Args.string({ description: "API token", required: true }),
  pipeId: Args.string({
    description: "ID of the pipe containing the phases",
    required: true,
  }),
  toPhaseId: Args.string({
    description: "ID of the phase to move the field to",
    required: true,
  }),
  fieldId: Args.string({
    description: "ID of the field to move",
    required: true,
  }),
};

export default MoveFieldBetweenPhasesCommand;
