import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";

import { confusedReply } from "../randomMethods.js";

function formatLRComponents(row, index, length) {
  const { components } = row;
  if (components.length === 4) {
    components[0].disabled = index === 0;
    components[1].disabled = index === 0;
    components[2].disabled = index === length - 1;
    components[3].disabled = index === length - 1;
  } else {
    components[0].disabled = index === 0;
    components[1].disabled = index === length - 1;
  }
  return row;
}

function pageThru({ customId }, page, length) {
  if (customId === "l") {
    return page - 1;
  }
  if (customId === "r") {
    return page + 1;
  }
  return customId === "el" ? 0 : length - 1;
}

const _pageThruRow = new ActionRowBuilder()
  .setComponents(
    new ButtonBuilder({ emoji: "⏪", customId: "el", style: "SECONDARY" }),
    new ButtonBuilder({ emoji: "⬅️", customId: "l", style: "SECONDARY" }),
    new ButtonBuilder({ emoji: "➡️", customId: "r", style: "SECONDARY" }),
    new ButtonBuilder({ emoji: "⏩", customId: "er", style: "SECONDARY" })
  )
  .toJSON();

/**
 * Pagination handler for an array of embeds
 * @param {CommandInteraction} interaction
 * @param {EmbedBuilder[]} embeds
 */
export async function replyWithPaginatedEmbeds(
  interaction,
  embeds,
  { time, idle, allowExtremes = true }
) {
  let pageNumber = 0;
  const pageThruRow = new ActionRowBuilder({
    components: allowExtremes
      ? _pageThruRow.components
      : _pageThruRow.components.slice(1, 3),
  });

  const messagePayload = {
    content: null,
    embeds: [embeds[0]],
    components: [formatLRComponents(pageThruRow, pageNumber, embeds.length)],
    fetchReply: true,
  };

  const embedMessage = await confusedReply(interaction, messagePayload);

  const buttonCollector = embedMessage.createMessageComponentCollector({
    filter: (int) => int.user.id === interaction.user.id,
    time,
    idle,
    errors: ["time"],
  });

  buttonCollector.on("collect", async (interaction) => {
    pageNumber = pageThru(interaction, pageNumber, embeds.length);
    await interaction.update({
      embeds: [embeds[pageNumber]],
      components: [formatLRComponents(pageThruRow, pageNumber, embeds.length)],
    });
  });
}
