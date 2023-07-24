import { PermissionFlagsBits } from "discord.js";
import { Op } from "sequelize";
import logger from "../logger.js";
import sequelize from "../sequelize.js";

export default class AnonEvent {
  constructor({ model, client, startChannel, logChannel, count }) {
    this.model = model;
    this.client = client;
    this.startChannel = startChannel;
    this.logChannel = logChannel;

    this.count = count;
    this._additionQueue = [];
    this._userSet = new Set();
    this.processing = false;
    this.locked = false;
  }

  get maxFinalCount() {
    return this.count + this._additionQueue.length + (this.processing ? 1 : 0);
  }

  hasSafeSpace() {
    return this.maxFinalCount < this.model.size;
  }

  queue(e) {
    this._additionQueue.push(e);
    this._userSet.add(e);
  }

  dequeue(e) {
    this._additionQueue.shift(e);
    this._userSet.delete(e);
  }

  async updateCountUnsafe() {
    this.count = await sequelize.models.Channel.count({
      where: {
        type: "chat",
        guild: this.model.guild,
        user: { [Op.not]: null },
      },
    });
  }

  has(e) {
    return this._userSet.has(e);
  }

  static async create(model, client) {
    const channelModels = await sequelize.models.Channel.findAll({
      where: { type: { [Op.not]: "chat" }, guild: model.guild },
    });

    const startChannelModel = channelModels.find((ch) => ch.type == "start");
    const count = await sequelize.models.Channel.count({
      where: { type: "chat", guild: model.guild, user: { [Op.not]: null } },
    });

    return new AnonEvent({
      model,
      client,
      count,
      startChannel: startChannelModel,
      logChannel: channelModels.find((ch) => ch.type == "log"),
    });
  }

  async processRequests() {
    if (this.processing) {
      return; // Already processing requests, so don't start another cycle
    }

    this.processing = true;

    while (this._additionQueue.length > 0) {
      const request = this._additionQueue.shift();
      try {
        const result = await this.processRequest(request); // Call your processing logic here
        this.respondToRequest(request, result);
      } catch (error) {
        this.respondWithError(request, error);
      }
      this._userSet.delete(request);
    }

    this.processing = false;
  }

  addRequest(request) {
    this.queue(request);
    this.processRequests();
  }

  async processRequest(request) {
    // Your asynchronous processing logic for a single request goes here
    // This function should return a Promise that resolves with the result of the processing
    // For example:
    return new Promise((resolve, reject) => {
      const channel = this.client.extendedChannels.find((ch) => !ch.userId);

      if (!channel) reject();

      channel.model.user = request;
      channel.model
        .save()
        .then(() =>
          channel.channel.permissionOverwrites.set([
            {
              id: request,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
              ],
            },
          ])
        )
        .then((channel) => {
          channel.send({
            content: `<@!${request}>`,
            allowedMentions: { users: [request] },
          });
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  respondToRequest(request, result) {
    ++this.count;
  }

  respondWithError(request, error) {
    // Your logic to respond with an error goes here
    logger.error(`Error processing request "${request}": ${error}`);
  }
}
