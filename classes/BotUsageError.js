import { BaseInteraction } from "discord.js";
import { Colors } from "../constants.js";

class BotUsageError extends Error {
  /**
   *
   * @param {String} message
   * @param {Object} param1
   * @param {Boolean} [param1.ephemeral=true] Whether the reply should be sent as an ephemeral, if possible
   * @param {Boolean} [param1.removeContents=true] Whether to remove contents of the message that don't overlap with the error's components
   * @param {Boolean} [param1.wrapEmbed = false] Whether to wrap the error in an embed
   * @param {BaseInteraction} [param1.interaction] Override for interaction to reply to
   */
  constructor(
    message = "none",
    {
      ephemeral = true,
      removeContents = true,
      wrapEmbed = false,
      interaction,
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.stack = null;
    this.ephemeral = ephemeral;
    this._wipeContents = removeContents;
    this.wrapEmbed = wrapEmbed;
    this.interaction = interaction;
  }

  get messagePayload() {
    return this.wrapEmbed
      ? {
          content: null,
          ephemeral: this.ephemeral,
          embeds: [
            { description: `⛔ ${this.message}`, color: Colors.CRIMSON_RED },
          ],
          files: [],
          components: [],
        }
      : this._wipeContents
      ? {
          content: this.message,
          ephemeral: this.ephemeral,
          embeds: [],
          files: [],
          components: [],
          allowedMentions: { parse: [] },
        }
      : {
          content: this.message,
          ephemeral: this.ephemeral,
          allowedMentions: { parse: [] },
        };
  }
}

export default BotUsageError;
