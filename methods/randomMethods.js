import {
  Message,
  MessageComponentInteraction,
  EmbedBuilder,
  Role,
  Guild,
  BaseInteraction,
  PermissionsBitField,
} from "discord.js";

/**
 * Array of funny reply message payloads, usually used when a dev command is used by a outside user
 */
const GagEmbeds = [
  { description: "_~Ahh~... nii-chan, soko wa... **DAME!!~~**_" },
];

/**
 * Get a gag embed
 * @param {Boolean} trespass Whether the embed is being generated to warn a user trying to use a dev command
 */
export function getGagEmbed(trespass) {
  const randomEmbed = new EmbedBuilder(
    GagEmbeds[(Math.random() * GagEmbeds.length) >> 0]
  );

  return trespass
    ? randomEmbed.setFooter({
        text: "This is a dev command, and shouldn't be accessible unless you're using the alpha\nIf that is not the case, please let prater12#1939 know",
      })
    : randomEmbed;
}

/**
 *Converts a number to it's ordinal representation
 * @param {Number} number
 * @return {String}
 */
export function toOrdinal(number) {
  let j = number % 10,
    k = number % 100;
  if (j == 1 && k != 11) {
    return number + "st";
  }
  if (j == 2 && k != 12) {
    return number + "nd";
  }
  if (j == 3 && k != 13) {
    return number + "rd";
  }
  return number + "th";
}

export const rankEmotes = ["🥇", "🥈", "🥉"];

/**
 * Convert a ranking number to a string representing the ordinal form and/or an emoji
 * @param {Number} rank Rank of the entry
 * @param {Boolean} [requireString=false] Whether to include rank in string form for 1st, 2nd amd 3rd (ie positions having emojis)
 * @returns
 */
export function prettyRank(rank, requireString = false) {
  if (rank >= 1 && rank <= 3) {
    return `${rankEmotes[rank - 1]}${
      requireString ? `\`${toOrdinal(rank)}\`` : ""
    }`;
  } else {
    return `\`${toOrdinal(rank)}\``;
  }
}

/**
 * Used in confirmation wrappers, when it is not known if the user prompt is a message or interaction
 * @param {Message|BaseInteraction} userPromptType
 * @param {*} messagePayload
 * @returns {Promise<Message|void>}
 */
export function confusedReply(userPromptType, messagePayload) {
  return userPromptType instanceof Message
    ? userPromptType.edit(messagePayload)
    : userPromptType.deferred || userPromptType.replied
    ? userPromptType.editReply(messagePayload)
    : userPromptType instanceof MessageComponentInteraction
    ? userPromptType.update(messagePayload)
    : userPromptType.reply(messagePayload);
}

/**
 * Used when type of interaction is not known
 * @param {Interaction} interaction
 * @param {Object} [DeferOptions]
 * @param {Boolean} [DeferOptions.ephemeral]
 * @param {Boolean} [DeferOptions.fetchReply]
 * @returns {void|Promise<Message|void>}
 */
export function confusedDefer(
  interaction,
  { ephemeral = false, fetchReply = false } = {}
) {
  if (!interaction.deferred && !interaction.replied) {
    return interaction.isMessageComponent()
      ? interaction.deferUpdate({ fetchReply })
      : interaction.deferReply({ ephemeral, fetchReply });
  }
}

/**
 * Parse a time passage string to duration in seconds
 * @param {String} timeString
 * @returns Number
 */
export function timeStringToSeconds(timeString) {
  let stringRegexIter = timeString.toLowerCase().matchAll(/(\d+)([a-z])/g);
  let timeSeconds = 0;
  for (const match of stringRegexIter) {
    if (match[1].length > 5) continue;
    switch (match[2]) {
      case "w":
        timeSeconds += +match[1] * 604800;
        break;
      case "d":
        timeSeconds += +match[1] * 86400;
        break;
      case "h":
        timeSeconds += +match[1] * 3600;
        break;
      case "m":
        timeSeconds += +match[1] * 60;
        break;
      case "s":
        timeSeconds += +match[1];
        break;
    }
  }
  return timeSeconds;
}

/**
 * Check if a role can be assigned to a user by the bot, assuming the bot can assign roles to that user
 * @param {Role} role
 * @param {Guild} guild
 */
export function unusualRole(role, withError = true) {
  const { guild } = role;
  if (guild.roles.everyone === role)
    return withError ? "Everyone is not a valid role." : "everyone";
  if ((role.tags && Object.keys(role.tags).length) || role.managed)
    return withError
      ? `The role ${role} is managed by a bot/service, it cannot be used.`
      : "managed";
  if (guild.me.roles.highest.comparePositionTo(role) <= 0)
    return withError
      ? `The role ${role} is above the bot's highest role.`
      : "above";

  return;
}

const empty = [
    "<:hp:905471988322168862>",
    "<:hp:905471987999195206>",
    "<:hp:905849344719224862>",
  ],
  green = [
    "<:hp:905471988259258378>",
    "<:hp:905471988145979392>",
    "<:hp:905850179381526559>",
  ],
  yellow = ["<:hp:905471987831427144>", "<:hp:905471988133429258>"];

/**
 * Construct a progress bar
 * @param {Number} progressFraction Number between 0 and 1
 * @param {Number} slotCount Number of slots in bar
 * @param {Number} yellowLimit progressFraction value below which bar should be yellow
 * @returns {String}
 */
export function constructProgressBar(progressFraction, slotCount, yellowLimit) {
  if (progressFraction < 0) progressFraction = 0;

  const emoteArray = [];
  const barProgress = progressFraction * slotCount;

  const full = progressFraction > yellowLimit ? green : yellow;

  if (barProgress <= 0) {
    emoteArray.push(empty[0]);
  } else {
    emoteArray.push(full[0]);
  }

  for (let i = 1; i < slotCount; i++) {
    if (i < barProgress) {
      emoteArray.push(full[1]);
    } else {
      emoteArray.push(empty[1]);
    }
  }

  if (barProgress === slotCount) {
    emoteArray.push(full[2]);
  } else {
    emoteArray.push(empty[2]);
  }
  return emoteArray.join("");
}

/**
 * Convert a list of strings to a gramatically correct comma-separated list
 * @param {String[]} stringArray Array of strings
 * @example betterCommaJoin(["a","b","c"]) // "a, b and c"
 */
export function betterCommaJoin(stringArray) {
  if (stringArray.length === 1) return stringArray[0];

  return `${stringArray.slice(0, -1).join(", ")} and ${stringArray.at(-1)}`;
}

/**
 * Get a random element from an array, or a array of random-ish elements from multiple array
 * @param {Array} arr
 * @param  {...Array} otherArrs
 * @returns {*|Array}
 */
export function randomElement(arr, ...otherArrs) {
  const index = Math.floor(arr.length * Math.random());
  if (!otherArrs.length) return arr[index];

  const out = [arr[index]];

  for (const array of otherArrs) {
    const newIndex =
      array.length > index && array.length <= arr.length
        ? index
        : Math.floor(array.length * Math.random());
    out.push(array[newIndex]);
  }

  return out;
}

/**
 * Takes a Permission BitfieldResolvable, and returns the output of the toArray method, but prettified
 * @param {BitfieldResolvable} bitfield
 * @param {Boolean} [mono=false] Whether or not to convert to monospace
 * @returns {String[]}
 */
export function prettyPermissionStringArray(bitfield, mono = false) {
  return new PermissionsBitField(bitfield).toArray().map(
    (str) =>
      `${mono ? "`" : ""}${str
        .replace("GUILD", "SERVER")
        .split("_")
        .map((e) => e[0] + e.substring(1).toLowerCase())
        .join(" ")}${mono ? "`" : ""}`
  );
}

export function commaSeparatedPerms(...args) {
  return betterCommaJoin(prettyPermissionStringArray(...args));
}

/**
 * Mutates the passes array-like after shuffling it
 * @param {String|Array} arrayish
 * @return {String|Array}
 */
export function shuffleArrayLike(arr) {
  if (typeof arr === "string" && /\s/.test(arr)) {
    arr = arr
      .split(/\s+/g)
      .map((str) => shuffleArrayLike(str))
      .join(" ");
  } else {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(i * Math.random());
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}
