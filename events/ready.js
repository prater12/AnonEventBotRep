import logger from "../logger.js";
import { Events } from "discord.js";

export default {
  event: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
  },
};
