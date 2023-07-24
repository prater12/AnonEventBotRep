import { TextChannel } from "discord.js";
import { Model } from "sequelize";

export default class ExtendedChannel {
  constructor({ channel, model, webhook, conversation }) {
    this.channel = channel;
    this.model = model;
    this.webhook = webhook;
    this.conversation = conversation;
  }

  get userId() {
    return this.model.user;
  }

  get guildId() {
    return this.model.guild;
  }

  /**
   *
   * @param {Object} param0
   * @param {TextChannel} param0.channel
   * @param {Model} param0.model
   */
  static async prepareExtendedChannel({ channel, model }) {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find((wh) => wh.token);

    if (!webhook) {
      webhook = await channel.createWebhook({ name: "Anon" });
    }

    return new ExtendedChannel({ channel, model, webhook });
  }
}
