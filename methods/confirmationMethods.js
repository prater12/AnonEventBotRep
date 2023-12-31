import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  Message,
  EmbedBuilder,
  MessagePayload,
  ButtonInteraction,
  ComponentType,
  ButtonStyle,
} from "discord.js";
import logger from "../logger.js";

import { confusedReply } from "./randomMethods.js";
import ConfirmationHelper from "../classes/ConfirmationHelper.js";

const confirmRow = new ActionRowBuilder().addComponents([
  new ButtonBuilder()
    .setCustomId("accept")
    .setStyle(ButtonStyle.Success)
    .setEmoji("✅"),
  new ButtonBuilder()
    .setCustomId("reject")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("✖️"),
]);

const defaultCancellationPayload = {
  content: "Process was cancelled",
  embeds: [],
  files: [],
  components: [],
};

const doubleConfirmRows = [
  new ActionRowBuilder().addComponents([
    new ButtonBuilder()
      .setCustomId("lock")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🔓"),
    new ButtonBuilder()
      .setCustomId("accept")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✅")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("reject")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("✖️"),
  ]),

  new ActionRowBuilder().addComponents([
    new ButtonBuilder()
      .setCustomId("lock")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔒")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("accept")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId("reject")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("✖️"),
  ]),
];

async function _basicRejectionListener(
  userPrompt,
  messagePayload,
  userID,
  { endOnCancel, cancellationPayload } = {}
) {
  try {
    const confirmationPrompt = await confusedReply(userPrompt, messagePayload);

    const buttonInteraction = await confirmationPrompt.awaitMessageComponent({
      filter: (int) => int.user.id === userID,
      time: 30e3,
      componentType: ComponentType.Button,
    });

    if (buttonInteraction.customId === "reject") {
      if (endOnCancel) {
        await buttonInteraction.update(
          cancellationPayload ?? defaultCancellationPayload
        );
        return { success: false };
      } else {
        return { success: false, buttonInteraction };
      }
    }
    return { success: true, buttonInteraction };
  } catch (err) {
    if (err.code !== "INTERACTION_COLLECTOR_ERROR") logger.error(err);
    return { success: false };
  }
}

function _performChecks(userPrompt, userID, messagePayload) {
  if (
    !userPrompt instanceof CommandInteraction &&
    !userPrompt instanceof Message
  )
    throw new TypeError(
      "Argument to confirm function must be either a command interaction or a message"
    );

  if (userPrompt instanceof Message) {
    if (!userID)
      throw new TypeError(
        "User ID must be provided in the case of message as user prompt"
      );
  } else {
    if (!userPrompt.replied && !Object.entries(messagePayload).length)
      throw new RangeError(
        "Message payload cannot be empty if a message doesn't already exist"
      );
  }
}

/**
 * @param {Message|CommandInteraction} userPromptType
 * @param {MessagePayload} messagePayload
 * @param {*} p2
 * @param {Boolean} p2.skipChecks
 * @param {Boolean} p2.endOnCancel
 * @param {String} p2.userID
 * @param {MessagePayload} p2.cancellationPayload
 * @returns {Promise<ButtonConfirmationResponse>}
 */

export async function confirmWithButtons(
  userPromptType,
  { components, fetchReply, ...messagePayload } = {},
  {
    skipChecks = process.env.NODE_ENV !== "development",
    endOnCancel = true,
    userID,
    cancellationPayload,
  } = {}
) {
  if (!skipChecks) _performChecks(userPromptType, userID, messagePayload);

  const newMessagePayload = {
    ...messagePayload,
    components: [confirmRow],
    fetchReply: true,
  };

  userID ??= userPromptType.user.id;

  return _basicRejectionListener(userPromptType, newMessagePayload, userID, {
    endOnCancel,
    cancellationPayload,
  });
}

/**
 * @typedef {Object} ButtonConfirmationResponse
 * @property {Boolean} success - Whether the confirmation was recieved successfully
 * @property {ButtonInteraction} [buttonInteraction] - The button interaction generated by the response
 */

/**
 * @param {Message|CommandInteraction} userPromptType
 * @param {MessagePayload} messagePayload
 * @param {*} p2
 * @param {Boolean} p2.skipChecks
 * @param {Boolean} p2.endOnCancel
 * @param {String} p2.userID
 * @param {MessagePayload} p2.cancellationPayload
 * @returns {Promise<ButtonConfirmationResponse>}
 */
export async function doubleConfirmWithButtons(
  userPromptType,
  { components, fetchReply, ...messagePayload } = {},
  {
    skipChecks = process.env.NODE_ENV !== "development",
    endOnCancel = true,
    userID,
    cancellationPayload,
  } = {}
) {
  if (!skipChecks) _performChecks(userPromptType, userID, messagePayload);

  let newMessagePayload = {
    ...messagePayload,
    components: [doubleConfirmRows[0]],
    fetchReply: true,
  };

  userID ??= userPromptType.user.id;

  const returnVal = await _basicRejectionListener(
    userPromptType,
    newMessagePayload,
    userID,
    {
      endOnCancel,
      cancellationPayload,
    }
  );

  if (!returnVal.success) return returnVal;

  newMessagePayload.components[0] = doubleConfirmRows[1];

  return _basicRejectionListener(
    returnVal.buttonInteraction,
    newMessagePayload,
    userID,
    {
      endOnCancel,
      cancellationPayload,
    }
  );
}

function _respondToEmbedConfirm(
  { success, buttonInteraction },
  confirmationHelper,
  messageArr,
  returnInteraction
) {
  if (!success) {
    confirmationHelper.suffix(messageArr[0]).setColor(0xe11e00);

    if (!returnInteraction && buttonInteraction) {
      buttonInteraction
        .update({
          embeds: [confirmationHelper.embed],
          components: [],
        })
        .catch((err) => {
          logger.error(err);
        });
      return { success: false };
    }
    return { success: false, buttonInteraction };
  }

  confirmationHelper.suffix(messageArr[1]).setColor(0x1ee100);

  return { success: true, buttonInteraction };
}

/**
 * An extension of confirmWithButtons, that takes an embed instead of a payload, and includes embed modifiers to simplify rejection and confirmation
 * @param {Message|CommandInteraction} confirmationPrompt
 * @param {EmbedBuilder|ConfirmationHelper|EmbedData} confirmationHelper
 * @param {Object} options
 * @param {String[]} [options.messageArr =["Process was cancelled", "Process is underway"] ]
 * @param {Snowflake} options.userID
 * @param {Boolean} [options.returnInteraction = false]
 * @returns {Promise<ButtonConfirmationResponse>}
 */
export async function confirmOnEmbed(
  confirmationPrompt,
  confirmationHelper,
  {
    messageArr = ["**Process was cancelled**", "**Process is underway...**"],
    userID,
    returnInteraction = false,
  } = {}
) {
  if (!(confirmationHelper instanceof ConfirmationHelper)) {
    confirmationHelper = new ConfirmationHelper(confirmationHelper, {
      asIs: true,
    });
  }

  const confirmRes = await confirmWithButtons(
    confirmationPrompt,
    {
      embeds: [confirmationHelper.embed],
    },
    {
      endOnCancel: false,
      userID,
    }
  );

  return _respondToEmbedConfirm(
    confirmRes,
    confirmationHelper,
    messageArr,
    returnInteraction
  );
}

/**
 * An extension of doubleConfirmWithButtons, that takes an embed instead of a payload, and includes embed modifiers to simplify rejection and confirmation
 * @param {Message|CommandInteraction} confirmationPrompt
 * @param {EmbedBuilder|ConfirmationHelper|MessageEmbedOptions} confirmationHelper
 * @param {Object} options
 * @param {String[]} [options.messageArr =["Process was cancelled", "Process is underway"] ]
 * @param {Snowflake} options.userID
 * @param {Boolean} [options.returnInteraction = false]
 * @returns {Promise<ButtonConfirmationResponse>}
 */
export async function doubleConfirmOnEmbed(
  confirmationPrompt,
  confirmationHelper,
  {
    messageArr = ["**Process was cancelled**", "**Process is underway...**"],
    userID,
    returnInteraction = false,
  } = {}
) {
  if (!(confirmationHelper instanceof ConfirmationHelper)) {
    confirmationHelper = new ConfirmationHelper(confirmationHelper, {
      asIs: true,
    });
  }

  const confirmRes = await doubleConfirmWithButtons(
    confirmationPrompt,
    {
      embeds: [confirmationHelper.embed],
    },
    {
      endOnCancel: false,
      userID,
    }
  );

  return _respondToEmbedConfirm(
    confirmRes,
    confirmationHelper,
    messageArr,
    returnInteraction
  );
}

/**
 * Wait for a user to type in a message with a specific content
 * @param {Channel} channel
 * @param {Snowflake} userId
 * @param {String} keyword
 * @param {Number} [time=60e3]
 */
export async function verbalAssure(channel, userId, keyword, time = 60e3) {
  const coll = await channel.awaitMessages({
    filter: (msg) => msg.author.id === userId && msg.content === keyword,
    time,
    max: 1,
  });
  return coll.size === 1;
}
