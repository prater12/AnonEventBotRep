import { EmbedBuilder } from "discord.js";

/**
 *
 * @param {String[]} array
 * @param {EmbedBuilder} baseEmbed
 * @param {Object} options
 * @param {Number} options.elemPerPage
 * @param {String} options.emptyPlaceholder
 * @param {Boolean} options.pageFooter
 * @returns {EmbedBuilder[]}
 */

function paginateEmbeds(
  array,
  { description = "", ...baseEmb },
  {
    elemPerPage = 10,
    emptyPlaceholder = "There doesn't seem to be anything here.",
    pageFooter = true,
  }
) {
  let out = [];

  if (array.length === 0) {
    out.push(
      new EmbedBuilder(baseEmb).setDescription(description + emptyPlaceholder)
    );
    return out;
  }

  for (
    let pageNumber = 0;
    pageNumber < Math.ceil(array.length / elemPerPage);
    pageNumber++
  ) {
    const outEmbed = new EmbedBuilder(baseEmb).setDescription(
      description +
        array
          .slice(pageNumber * elemPerPage, (pageNumber + 1) * elemPerPage)
          .join("\n")
    );

    if (pageFooter) {
      const pageText = `Showing ${pageNumber * elemPerPage + 1} - ${
        (pageNumber + 1) * elemPerPage > array.length
          ? array.length
          : (pageNumber + 1) * elemPerPage
      } of ${array.length}`;

      outEmbed.setFooter({
        text: baseEmb.footer
          ? baseEmb.footer.text + ` | ${pageText}`
          : pageText,
      });
    }

    out.push(outEmbed);
  }
  return out;
}

export default paginateEmbeds;
