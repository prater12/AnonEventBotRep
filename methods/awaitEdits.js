import EditCollector from "../classes/structures/EditCollector.js";

/**
 *
 * @param {Message} message
 * @param {Object} options
 * @param {Number} options.time Milliseconds to wait for completion
 * @param {Number} options.idle Milliseconds to wait for the next edit
 * @param {Number} options.max Maximum amount of edits to collect
 * @param {Function} options.filter Filter function
 * @param {String[]} options.errors End reasons to throw for
 * @returns
 */
export default function awaitEdits(message, options = {}) {
  return new Promise((resolve, reject) => {
    const collector = new EditCollector(message, options);
    collector.once("end", (edits, reason) => {
      if (options.errors?.includes(reason)) reject(edits);
      else resolve(edits);
    });
  });
}
