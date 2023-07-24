import BotUsageError from "../classes/BotUsageError.js";
import { BaseInteraction, Message } from "discord.js";
import { confusedReply } from "./randomMethods.js";
import logger from "../logger.js";

const errorIndicator = (err) => {
  if (err instanceof BotUsageError) return err.messagePayload;
  return {
    content: `There seems to have been an error\`\`\`js\n${err}\`\`\``,
    ephemeral: true,
  };
};

/**
 *
 * @param {BaseInteraction} interaction
 * @param {Error} error
 * @returns
 */

export async function handleInteractionError(interaction, error) {
  if (interaction.isAutocomplete()) return;

  if (error instanceof BotUsageError) {
    if (error.interaction) interaction = error.interaction;
  } else {
    logger.error(error);
  }

  try {
    if (!interaction.deferred && !interaction.replied) {
      if (Date.now() - interaction.createdTimestamp < 3e3)
        await confusedReply(interaction, errorIndicator(error));
    } else if (Date.now() - interaction.createdTimestamp < 15 * 60e3) {
      await confusedReply(interaction, errorIndicator(error));
    }
  } catch (err) {
    logger.error(err);
  }
}

/**
 *
 * @param {Message} message
 * @param {Error} error
 * @returns
 */

export function handleMessageError(message, error) {
  if (!(error instanceof BotUsageError)) logger.error(error);
  message.reply(errorIndicator(error)).catch((err) => logger.error(err));
}
