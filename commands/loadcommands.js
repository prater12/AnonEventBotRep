import {
  ChatInputCommandInteraction,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord.js";
import { StringifiedPermissionBitfields } from "../constants.js";

import loadCommands from "../methods/loadCommands.js";

export default {
  guildCommand: true,

  data: {
    name: "loadcommands",
    type: ApplicationCommandType.ChatInput,
    description: "Load commands",
    options: [],
    dm_permission: false,
    default_member_permissions: StringifiedPermissionBitfields.ADMINISTRATOR,
  },

  /**
   * Slash command process for this command
   * @param {ChatInputCommandInteraction} interaction
   * @returns {*}
   */
  async execute(interaction) {
    const { client } = interaction;

    interaction.deferReply();

    const commandsData = [
      ...client.commands.map((command) => command.data).values(),
    ];

    await loadCommands(commandsData, interaction.guild);

    interaction.editReply({ content: "Done" });
  },
};
