import { BaseInteraction, PermissionsBitField, Events } from "discord.js";
import { Colors } from "../constants.js";
import { handleInteractionError } from "../methods/errorHandlers.js";
import {
  betterCommaJoin,
  prettyPermissionStringArray,
} from "../methods/randomMethods.js";
import logger from "../logger.js";

const getCommandIdentifier = ({ commandName, options }) => {
  return `${commandName}${
    options.getSubcommandGroup(false) ? " " + options.getSubcommandGroup() : ""
  }${options.getSubcommand(false) ? " " + options.getSubcommand() : ""}`;
};

export default {
  event: Events.InteractionCreate,

  /**
   *Event handler for interactionCreate
   * @param {BaseInteraction} interaction
   * @returns {*}
   */
  async execute(interaction) {
    if (
      interaction.isButton() &&
      interaction.customId === "join_event_button" &&
      interaction.client.events.has(interaction.message.id)
    ) {
      const anonEvent = interaction.client.events.get(interaction.message.id);

      if (anonEvent.has(interaction.user.id)) {
        return;
      }

      if (anonEvent.locked) {
        await interaction.reply({
          content: "The queue has been locked",
          ephemeral: true,
        });
      }

      const oldChannel = interaction.client.extendedChannels.find(
        (ch) =>
          ch.userId === interaction.user.id &&
          ch.guildId === interaction.guildId
      );

      if (oldChannel) {
        await interaction.reply({
          content: `You already have the channel ${oldChannel.channel}`,
          ephemeral: true,
        });
      }

      anonEvent.addRequest(interaction.user.id);

      await interaction.reply({
        content:
          "Please wait. You will be added to a channel soon\nSpamming will show failed interaction errors.",
        ephemeral: true,
      });
    }

    if (
      !interaction.isCommand() &&
      !interaction.isAutocomplete() &&
      !interaction.isContextMenuCommand()
    )
      //If interaction is not of valid type, it is returned
      return;

    //Get command export
    const intFile = await interaction.client.commands.get(
      interaction.commandName
    );

    //Staff-lock
    if (
      intFile.data.default_member_permissions &&
      //!quoteGuild.isStaff(interaction.member) &&
      !interaction.memberPermissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      if (!interaction.isAutocomplete())
        interaction
          .reply({
            content: "This is a staff-only command.",
            ephemeral: true,
          })
          .catch((err) => logger.error(err));
      return;
    }

    //Require SEND_MESSAGES
    if (
      !interaction.isAutocomplete() &&
      !interaction.channel
        .permissionsFor(interaction.guild.members.me)
        .has(PermissionsBitField.Flags.SendMessages)
    ) {
      interaction
        .reply({
          content:
            "The bot needs to be able to send and edit its messages for commands to work.",
          ephemeral: true,
        })
        .catch((err) => logger.error(err));
      return;
    }

    let commandName = interaction.isCommand()
      ? getCommandIdentifier(interaction)
      : interaction.commandName;

    //If command enforces some Discord permissions, checks if user has those
    if (intFile.requiredPermissions) {
      const isPermitted =
        intFile.requiredPermissions instanceof Permissions ||
        typeof intFile.requiredPermissions !== "object"
          ? interaction.memberPermissions.has(intFile.requiredPermissions)
          : interaction.memberPermissions.has(
              intFile.requiredPermissions[commandName] ?? 0n
            );

      if (!isPermitted) {
        if (!interaction.isAutocomplete())
          await interaction
            .reply({
              embeds: [
                {
                  description: `You lack one of the following required permissions:\n${betterCommaJoin(
                    prettyPermissionStringArray(
                      intFile.requiredPermissions[commandName] ??
                        intFile.requiredPermissions
                    )
                  )}`,
                  color: Colors.TOMATO_RED,
                },
              ],
              ephemeral: true,
            })
            .catch((err) => logger.error(err));
        return;
      }
    }

    if (interaction.isAutocomplete()) {
      try {
        const returnArr = await intFile.handleAutocomplete(interaction);
        await interaction.respond(returnArr.slice(0, 25));
      } catch (err) {
        logger.error(err);
      }
      return;
    }

    try {
      const returnVal = await intFile.execute(interaction);
    } catch (error) {
      if (error) await handleInteractionError(interaction, error);
    }
  },
};
