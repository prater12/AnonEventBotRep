import { EmbedBuilder } from "discord.js";

/**
 * Helps a lot, I swear
 */
export default class ConfirmationHelper {
  /**
   * Create a ConfirmationHelper
   * @param {MessageEmbed} embed
   * @param {Object} [param1]
   * @param {String} [param1.description]
   * @param {Boolean} [param1.asIs]
   * @returns
   */
  constructor(embed, { description, asIs = false } = {}) {
    this._description = description ?? embed.description;
    this.embed =
      asIs && embed instanceof EmbedBuilder
        ? embed
        : new EmbedBuilder(embed).setDescription(this._description);
    return this;
  }

  suffix(suffixString) {
    this.embed.setDescription(`${this._description}\n\n${suffixString}`);
    return this;
  }

  setColor(color) {
    this.embed.setColor(color);
    return this;
  }
}
