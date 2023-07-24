import {
  ChatInputCommandInteraction,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from "discord.js";
import { StringifiedPermissionBitfields } from "../constants.js";

import BotUsageError from "../classes/BotUsageError.js";

export default {
  guildCommand: true,

  data: {
    name: "reload",
    type: ApplicationCommandType.ChatInput,
    description: "Reload commands",
    options: [
      {
        name: "command",
        type: ApplicationCommandOptionType.String,
        description: "Name of the command",

        required: true,
        autocomplete: true,
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
    if (interaction.user.id !== process.env["DEV"]) return;

    const command = interaction.client.commands.get(
      interaction.options.getString("command")
    );

    if (!command) {
      throw new BotUsageError("You fucked up");
    }

    try {
      interaction.client.commands.delete(command.data.name);
      const newCommand = (await import(`./${command.data.name}.js`)).default;
      interaction.client.commands.set(newCommand.data.name, newCommand);
      await interaction.reply(
        `Command \`${newCommand.data.name}\` was reloaded!`
      );
    } catch (error) {
      await interaction.reply(
        `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
      );
    }
  },

  async handleAutocomplete(interaction) {
    const str = interaction.options.getFocused();
    return [
      ...interaction.client.commands
        .filter((_, name) => name.toLowerCase().includes(str))
        .keys(),
    ].map((name) => ({
      name,
      value: name,
    }));
  },
};
