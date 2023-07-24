import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  GuildChannelManager,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  Colors,
  StringifiedPermissionBitfields,
  PhoneticAlphabet,
} from "../constants.js";
import {
  confirmOnEmbed,
  doubleConfirmOnEmbed,
} from "../methods/confirmationMethods.js";
import sequelize from "../sequelize.js";
import makeConversations from "../methods/makeConversations.js";

import BotUsageError from "../classes/BotUsageError.js";
import ConfirmationHelper from "../classes/ConfirmationHelper.js";
import ExtendedChannel from "../classes/ExtendedChannel.js";
import AnonEvent from "../classes/Event.js";

const CHANNELS_PER_CATEGORY = 10;
/**
 *
 * @param {*} number
 * @param {GuildChannelManager} channelManager
 */
async function createChatChannels(number, channelManager) {
  //Type of UUID (not rly) to differentiate between channels
  const nowStamp = Math.round(
    (Math.round(Date.now() / 1e3) % (30 * PhoneticAlphabet.length)) / 30
  );

  const categoryNames = Array.from(
    { length: Math.ceil(number / CHANNELS_PER_CATEGORY) },
    (_, i) => `${PhoneticAlphabet[nowStamp]}_${(1 + i).toString()}`
  );

  const channelNames = Array.from(
    { length: CHANNELS_PER_CATEGORY },
    (_, i) => `${1 + i}`
  );

  const createdChannels = [];

  for (const categoryName of categoryNames) {
    const categoryChannel = await channelManager.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
    });

    const channelsToCreate = channelNames.map((channelName) => ({
      name: channelName,
      parent: categoryChannel.id,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: channelManager.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    }));

    for (const channel of channelsToCreate) {
      const c = await channelManager.create(channel);
      createdChannels.push(c.id);
    }
  }

  return createdChannels;
}

export default {
  guildCommand: true,

  data: {
    name: "event",
    type: ApplicationCommandType.ChatInput,
    description: "Event related commands",
    options: [
      {
        name: "setup",
        type: ApplicationCommandOptionType.Subcommand,
        description: "Setup the event channels and the entry message",

        options: [
          {
            name: "max_users",
            type: ApplicationCommandOptionType.Integer,
            description: "The maximum number of participants",

            min_value: 2,
            max_value: 400,

            required: true,
            autocomplete: false,
          },

          {
            name: "channel",
            type: ApplicationCommandOptionType.Channel,
            description: "The channel the entry message should be sent in",

            channel_types: [ChannelType.GuildText],

            required: false,
            autocomplete: false,
          },
          {
            name: "logs",
            type: ApplicationCommandOptionType.Channel,
            description: "The channel the logs should be sent in",

            channel_types: [ChannelType.GuildText],

            required: false,
            autocomplete: false,
          },
        ],
      },
      {
        name: "entrymsg",
        type: ApplicationCommandOptionType.Subcommand,
        description: "Set/reset the entry message",

        options: [
          {
            name: "channel",
            type: ApplicationCommandOptionType.Channel,
            description: "The channel the entry message should be sent in",

            channel_types: [ChannelType.GuildText],

            required: false,
            autocomplete: false,
          },
        ],
      },
      {
        name: "util",
        type: ApplicationCommandOptionType.SubcommandGroup,
        description: "Some utility commands",

        options: [
          {
            name: "delete_cat",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Delete all channels under a category",

            options: [
              {
                name: "channel",
                type: ApplicationCommandOptionType.Channel,
                description: "The channel the entry message should be sent in",

                channel_types: [ChannelType.GuildCategory],

                required: true,
                autocomplete: false,
              },
            ],
          },
        ],
      },
      {
        name: "toggle_lock",
        type: ApplicationCommandOptionType.Subcommand,
        description: "Toggle the queue lock",
        options: [],
      },
      {
        name: "start",
        type: ApplicationCommandOptionType.Subcommand,
        description: "Start the event",
        options: [],
      },
      {
        name: "admit",
        type: ApplicationCommandOptionType.Subcommand,
        description: "Let someone into the event",
        options: [
          {
            name: "user",
            type: ApplicationCommandOptionType.User,
            description: "Person to let in",

            required: true,
          },
        ],
      },
    ],
    dm_permission: false,
    default_member_permissions: StringifiedPermissionBitfields.STAFF_DEFAULT,
  },

  /**
   * Slash command process for this command
   * @param {ChatInputCommandInteraction} interaction
   * @returns {*}
   */
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "delete_cat") {
      const categoryChannel = interaction.options.getChannel("channel");
      const confirmationHelper = new ConfirmationHelper({
        title: "Confirm Action",
        description: `By doing this, you will delete all the channels under ${categoryChannel}`,
      });

      const { success, buttonInteraction } = await doubleConfirmOnEmbed(
        interaction,
        confirmationHelper,
        {
          userId: interaction.user.id,
        }
      );

      if (!success) return;

      confirmationHelper.setColor(Colors.SANDY_GOLD).suffix("Please wait...");

      const fetchedReply = await buttonInteraction.update({
        embeds: [confirmationHelper.embed],
        components: [],
        fetchReply: true,
      });

      interaction.guild.channels.fetch();

      try {
        await Promise.all(
          [
            ...interaction.guild.channels.cache
              .filter((channel) => channel.parentId === categoryChannel.id)
              .values(),
          ].map((channel) => channel.delete())
        );

        await categoryChannel.delete();
        confirmationHelper.setColor(Colors.TIDE_GREEN).suffix("**Done!**");
      } catch (err) {
        confirmationHelper.setColor(Colors.TOMATO_RED).suffix(`${err}`);
      }

      await fetchedReply.edit({ embeds: [confirmationHelper.embed] });
      return;
    }

    if (interaction.options.getSubcommand() === "toggle_lock") {
      const event = interaction.client.events.find(
        (event) => event.model.guild === interaction.guildId
      );

      const confirmationHelper = new ConfirmationHelper({
        title: event.locked ? "Open Queue" : "Lock Queue",
        description: `Are you sure you want to ${
          event.locked ? "open" : "lock"
        } the queue?`,
      });

      const { success, buttonInteraction } = await confirmOnEmbed(
        interaction,
        confirmationHelper
      );

      if (!success) return;

      event.locked = !event.locked;

      await buttonInteraction.update({
        embeds: [
          confirmationHelper.suffix(
            `The queue is now ${event.locked ? "locked" : "open"}`
          ).embed,
        ],
        components: [],
      });

      return;
    }

    if (interaction.options.getSubcommand() === "start") {
      const event = interaction.client.events.find(
        (event) => event.model.guild === interaction.guildId
      );

      if (!event) throw new BotUsageError("No event was found.");

      if (!event.locked)
        throw new BotUsageError(
          "Please use `/event toggle_lock` to lock the queue first."
        );

      if (event.processing)
        throw new BotUsageError(
          "The queue hasn't become empty yet. Please try again in a while."
        );

      await event.updateCountUnsafe();

      if (event.count % 2 !== 0)
        throw new BotUsageError(
          `The event currently has an odd number (**${event.count}**) of participants. Use \`/event admit\` to add another participant.`
        );

      const confirmationHelper = new ConfirmationHelper({
        title: "Start event",
        description: `Are you sure you want to start the event?\n\n- Participants: ${event.count}`,
      });

      const { success, buttonInteraction } = await doubleConfirmOnEmbed(
        interaction,
        confirmationHelper
      );

      if (!success) return;

      await makeConversations(event, interaction.client);

      await buttonInteraction.update({
        embeds: [confirmationHelper.suffix("The event has begun").embed],
        components: [],
      });

      return;
    }

    if (interaction.options.getSubcommand() === "admit") {
      const user = interaction.options.getUser("user");
      const anonEvent = interaction.client.events.get(interaction.message.id);

      if (anonEvent.has(user.id)) {
        throw new BotUsageError("Person is already in queue;");
      }

      const oldChannel = interaction.client.extendedChannels.find(
        (ch) => ch.userId === user.id && ch.guildId === interaction.guildId
      );

      if (oldChannel) {
        throw new BotUsageError(
          `They already have the channel ${oldChannel.channel}`
        );
      }

      anonEvent.addRequest(user.id);

      await interaction.reply({
        content:
          "Please wait. They will be added to a channel soon\nSpamming will show failed interaction errors.",
        ephemeral: true,
      });
      return;
    }

    const startMessageChannel =
      interaction.options.getChannel("channel") ?? interaction.channel;

    //If the channel option is empty, ensure current channel is acceptable type
    if (startMessageChannel.type !== ChannelType.GuildText) {
      throw new BotUsageError(
        "This channel is not a server text channel. Please either run this command in a text channel, or use the `channel` option to specify another channel."
      );
    }

    if (interaction.options.getSubcommand() === "setup") {
      const logChannel = interaction.options.getChannel("logs");

      if (interaction.options.getInteger("max_users") % 2)
        throw new BotUsageError("Max users must be an even number.");

      const confirmationHelper = new ConfirmationHelper({
        title: "Confirm Action",
        description: `By doing this, you will:\n\n- Reset all already created channels\n- Create new channels if needed to accomodate all participants.\n- Send an entry message in ${startMessageChannel}, making the previous one obsolete${
          logChannel ? `\n- Make ${logChannel} the new logs channel` : ""
        }`,
      });

      const { success, buttonInteraction } = await doubleConfirmOnEmbed(
        interaction,
        confirmationHelper,
        {
          userId: interaction.user.id,
        }
      );

      if (!success) return;

      const oldEvent = interaction.client.events.find(
        (event) => event.model.guild === interaction.guildId
      );

      if (oldEvent) {
        interaction.client.events.delete(oldEvent.startChannel.id);
        await oldEvent.model.update({ active: false });
      }

      if (logChannel) {
        const [channel, created] = await sequelize.models.Channel.findOrCreate({
          where: { id: logChannel.id, guild: logChannel.guildId },
          defaults: {
            type: "log",
          },
        });

        if (!created && channel.type !== "log")
          throw new BotUsageError(
            `The channel ${logChannel} is already under use for a different purpose than logging.`
          );
      }

      confirmationHelper.setColor(Colors.SANDY_GOLD).suffix("Please wait...");

      const fetchedReply = await buttonInteraction.update({
        embeds: [confirmationHelper.embed],
        components: [],
        fetchReply: true,
      });

      const eventChannels = await sequelize.models.Channel.findAll({
        where: { type: "chat", guild: interaction.guildId },
      });

      await interaction.guild.channels.fetch();

      const deletedChannels = eventChannels.filter(
        (channel) => !interaction.guild.channels.cache.has(channel.id)
      );

      await sequelize.models.Channel.destroy({
        where: { id: deletedChannels.map((c) => c.id) },
      });

      const keptChannels = eventChannels.filter((channel) =>
        interaction.guild.channels.cache.has(channel.id)
      );

      for (const dbChannel of keptChannels) {
        if (dbChannel.user) {
          const channel = interaction.guild.channels.cache.get(dbChannel.id);
          await channel.permissionOverwrites.set([]);
        }
      }

      await sequelize.models.Channel.update(
        { user: null },
        { where: { guild: interaction.guildId, type: "chat" } }
      );

      if (keptChannels.length < interaction.options.getInteger("max_users")) {
        const createdChannels = await createChatChannels(
          interaction.options.getInteger("max_users") - keptChannels.length,
          interaction.guild.channels
        );

        await sequelize.models.Channel.bulkCreate(
          createdChannels.map((channel) => ({
            id: channel,
            guild: interaction.guildId,
            type: "chat",
            user: null,
          }))
        );
      }

      const startMessage = await startMessageChannel.send({
        embeds: [new EmbedBuilder({ title: "Press Button to Join" })],
      });

      await sequelize.models.Channel.destroy({
        where: {
          guild: interaction.guildId,
          type: "start",
        },
      });

      await sequelize.models.Channel.create({
        id: startMessageChannel.id,
        guild: startMessageChannel.guildId,
        user: startMessage.id,
        type: "start",
      });

      const newEventModel = await sequelize.models.Event.create({
        guild: interaction.guildId,
        size: interaction.options.getInteger("max_users"),
      });

      console.log(newEventModel);

      const newEvent = await AnonEvent.create(
        newEventModel,
        interaction.client
      );

      interaction.client.events.set(newEvent.startChannel.user, newEvent);

      interaction.client.extendedChannels.sweep(
        (ch) => ch.guildId === interaction.guildId
      );

      if (oldEvent) {
        interaction.client.conversations.sweep(
          (conv) => conv.model.eventId === oldEvent.id
        );
      }

      const channelModels = await sequelize.models.Channel.findAll({
        where: { type: "chat", guild: interaction.guildId },
      });

      for (const model of channelModels) {
        const channel = interaction.client.channels.cache.get(model.id);
        if (!channel) continue;

        interaction.client.extendedChannels.set(
          channel.id,
          await ExtendedChannel.prepareExtendedChannel({ channel, model })
        );
      }

      await startMessage.edit({
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId("join_event_button")
              .setLabel("Join")
              .setStyle(ButtonStyle.Primary),
          ]),
        ],
      });

      confirmationHelper.setColor(Colors.TIDE_GREEN).suffix("Done!");

      await fetchedReply.edit({ embeds: [confirmationHelper.embed] });

      return;
    }

    if (interaction.options.getSubcommand() === "entrymsg") {
      const confirmationHelper = new ConfirmationHelper({
        title: "Confirm Action",
        description:
          "By doing this, you will:\n\n- Send a new entry message, making the previous one obsolete",
      });

      const { success, buttonInteraction } = await doubleConfirmOnEmbed(
        interaction,
        confirmationHelper,
        {
          userId: interaction.user.id,
        }
      );

      if (!success) return;

      confirmationHelper.setColor(Colors.SANDY_GOLD).suffix("Please wait...");

      const fetchedReply = await buttonInteraction.update({
        embeds: [confirmationHelper.embed],
        components: [],
        fetchReply: true,
      });

      const startMessage = await startMessageChannel.send({
        embeds: [new EmbedBuilder({ title: "Press Button to Join" })],
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId("join_event_button")
              .setLabel("Join")
              .setStyle(ButtonStyle.Primary),
          ]),
        ],
      });

      await sequelize.models.Channel.destroy({
        where: {
          guild: interaction.guildId,
          type: "start",
        },
      });

      await sequelize.models.Channel.create({
        id: startMessageChannel.id,
        guild: startMessageChannel.guildId,
        user: startMessage.id,
        type: "start",
      });

      confirmationHelper.setColor(Colors.TIDE_GREEN).suffix("Done!");

      await fetchedReply.edit({ embeds: [confirmationHelper.embed] });
    }
  },
};
