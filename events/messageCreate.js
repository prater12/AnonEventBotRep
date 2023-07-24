import logger from "../logger.js";
import { Events, Message } from "discord.js";

export default {
  event: Events.MessageCreate,
  once: false,

  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const { client } = message;

    const extendedChannel = client.extendedChannels.get(message.channel.id);
    console.log(extendedChannel);

    console.log(client.conversations);

    if (
      !extendedChannel ||
      extendedChannel.userId !== message.author.id ||
      !extendedChannel.conversation
    )
      return;

    const { conversation } = extendedChannel;

    const roleNumber =
      conversation.model.role1channelid === message.channelId ? 0 : 1;

    const otherChannel =
      roleNumber === 0
        ? conversation.extChannelTwo
        : conversation.extChannelOne;

    const role = client.eventRoles.get(
      roleNumber === 0 ? conversation.model.role2id : conversation.model.role1id
    );

    await otherChannel.webhook.send({
      content: message.content,
      allowedMentions: [],
      username: role.name,
      avatarURL: role.image,
    });
  },
};
