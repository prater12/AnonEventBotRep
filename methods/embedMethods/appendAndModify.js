/**
 * Appends a string to the description of an embed, and modifies its color
 * @param {EmbedBuilder} embed
 * @param {Object} param1
 * @param {String} [param1.description]
 * @param {String} param1.string
 * @param {Number} [param1.color]
 * @returns
 */

export default function appendAndModify(embed, { description, string, color }) {
  return embed
    .setDescription(`${description ?? embed.description}\n\n${string}`)
    .setColor(color ?? embed.color);
}
