import logger from "../logger.js";
import { Events } from "discord.js";

export default {
  event: Events.ChannelDelete,
  once: true,

  async execute(channel) {
    const { client } = channel;
    if (client.extendedChannels.has(channel.id)) {
      const oldExtChannel = client.extendedChannels.get(channel.id);
      client.extendedChannels.delete(channel.id);

      if (oldExtChannel.conversation) {
      }

      const anonEvent = client.events.find(
        (event) => event.model.guild === interaction.guildId
      );

      if (anonEvent && oldExtChannel.userId) {
        --anonEvent.count;
      }

      await oldExtChannel.model.destroy();
    }
  },
};
