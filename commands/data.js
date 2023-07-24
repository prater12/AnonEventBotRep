import {
  ChatInputCommandInteraction,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { StringifiedPermissionBitfields } from "../constants.js";

import ConfirmationHelper from "../classes/ConfirmationHelper.js";

import { confirmOnEmbed } from "../methods/confirmationMethods.js";
import sequelize from "../sequelize.js";

export default {
  guildCommand: true,

  data: {
    name: "data",
    type: ApplicationCommandType.ChatInput,
    description: "Work with role or topic data",
    options: [
      {
        name: "role",
        type: ApplicationCommandOptionType.SubcommandGroup,
        description: "Role related commands",
        options: [
          {
            name: "edit",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Edit a role",
            options: [
              {
                name: "name",
                type: ApplicationCommandOptionType.String,
                description: "The role's name",

                required: true,
                autocomplete: true,
              },
            ],
          },
          {
            name: "add",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Add a role",
            options: [],
          },
        ],
      },
      {
        name: "topic",
        type: ApplicationCommandOptionType.SubcommandGroup,
        description: "Topic related commands",
        options: [
          {
            name: "edit",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Edit a topic",
            options: [
              {
                name: "name",
                type: ApplicationCommandOptionType.String,
                description: "The topics's name",

                required: true,
                autocomplete: true,
              },
            ],
          },
          {
            name: "add",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Add a role",
            options: [],
          },
        ],
      },
    ],
    dm_permission: false,
    default_member_permissions: StringifiedPermissionBitfields.ADMINISTRATOR,
  },

  /**
   * Slash command process for this command
   * @param {ChatInputCommandInteraction} interaction
   * @returns {*}
   */
  async execute(interaction) {
    if (interaction.options.getSubcommandGroup() === "role") {
      if (interaction.options.getSubcommand() === "add") {
        const modal = new ModalBuilder()
          .setCustomId("roleadd")
          .setTitle("Add Role");

        // Add components to modal

        // Create the text input components
        const roleNameInput = new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Name")
          .setStyle(TextInputStyle.Short);

        const displayURLInput = new TextInputBuilder()
          .setCustomId("url")
          .setLabel("Avatar URL")
          .setStyle(TextInputStyle.Paragraph);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new ActionRowBuilder().addComponents(
          roleNameInput
        );
        const secondActionRow = new ActionRowBuilder().addComponents(
          displayURLInput
        );

        // Add inputs to the modal
        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
        const submission = await interaction.awaitModalSubmit({ time: 60e3 });

        const roleName = submission.fields.getTextInputValue("name");
        const displayURL = submission.fields.getTextInputValue("url");

        const confirmationHelper = new ConfirmationHelper({
          title: "Confirm Role Addition",
          description: `**Name**: ${roleName}\n\nAdd this role?`,
          thumbnail: { url: displayURL },
        });

        const { success, buttonInteraction } = await confirmOnEmbed(
          submission,
          confirmationHelper
        );

        if (!success) return;

        const roleModel = await sequelize.models.Role.create({
          name: roleName,
          image: displayURL,
        });

        interaction.client.eventRoles.set(roleModel.id, roleModel);
        await buttonInteraction.update({ embeds: [confirmationHelper.embed] });
      } else {
      }
    } else {
      if (interaction.options.getSubcommand() === "add") {
        const modal = new ModalBuilder()
          .setCustomId("topicadd")
          .setTitle("Add Topic");

        // Add components to modal

        // Create the text input components
        const topicNameInput = new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Topic")
          .setStyle(TextInputStyle.Short);

        const descriptionInput = new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Description of the Topic")
          .setStyle(TextInputStyle.Paragraph);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new ActionRowBuilder().addComponents(
          topicNameInput
        );
        const secondActionRow = new ActionRowBuilder().addComponents(
          descriptionInput
        );

        // Add inputs to the modal
        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
        const submission = await interaction.awaitModalSubmit({ time: 60e3 });

        const topicName = submission.fields.getTextInputValue("name");
        const topicDesc = submission.fields
          .getTextInputValue("description")
          .replace("_", "-");

        const confirmationHelper = new ConfirmationHelper({
          title: "Confirm Topic Addition",
          description: `**${topicName}**\n_${topicDesc}_\n\nAdd this topic?`,
        });

        const { success, buttonInteraction } = await confirmOnEmbed(
          submission,
          confirmationHelper
        );

        if (!success) return;

        const topicModel = await sequelize.models.Topic.create({
          name: topicName,
          description: topicDesc,
        });

        interaction.client.eventTopics.set(topicModel.id, topicModel);
        await buttonInteraction.update({ embeds: [confirmationHelper.embed] });
      } else {
      }
    }
  },

  async handleAutocomplete(interaction) {
    const cat = interaction.options.getSubcommandGroup();
    console.log(interaction.client.eventRoles);
    const str = interaction.options.getFocused();

    if (cat === "role") {
      return [
        ...interaction.client.eventRoles
          .filter(({ name }) => name.toLowerCase().includes(str))
          .values(),
      ].map(({ name }) => ({
        name,
        value: name,
      }));
    } else {
      return [
        ...interaction.client.eventTopics
          .filter(({ name }) => name.toLowerCase().includes(str))
          .values(),
      ].map(({ name }) => ({
        name,
        value: name,
      }));
    }
  },
};
