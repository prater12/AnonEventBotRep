import { PermissionsBitField } from "discord.js";

/**
 * Denotes application command types:
 * * `ChatInput`
 * * `User`
 * * `Message`
 */
export const ApplicationCommandType = createEnum([
  null,
  "ChatInput",
  "User",
  "Message",
]);

/**
 * Denotes option types:
 * * `Subcommand`
 * * `SubcommandGroup`
 * * `String` (Can have choices)
 * * `Integer` (Can have choices)
 * * `Boolean`
 * * `User`
 * * `Channel`
 * * `Role`
 * * `Mentionable`
 * * `Number`
 */

export const OptionType = createEnum([
  null,
  "Subcommand",
  "SubcommandGroup",
  "String",
  "Integer",
  "Boolean",
  "User",
  "Channel",
  "Role",
  "Mentionable",
  "Number",
]);

/**
 * Denotes the type of application command permission overwrite:
 * * `ROLE` (1)
 * * `USER` (2)
 */

export const ApplicationCommandPermissionsType = createEnum([
  null,
  "ROLE",
  "USER",
]);
/**
 * Denotes the type of message component:
 * * `ACTION_ROW` (1)
 * * `BUTTON` (2)
 * * `SELECT_MENU` (3)
 */

export const MessageComponentType = createEnum([
  null,
  "ACTION_ROW",
  "BUTTON",
  "SELECT_MENU",
]);

function createEnum(keys) {
  const obj = {};
  for (const [index, key] of keys.entries()) {
    if (key === null) continue;
    obj[key] = index;
    obj[index] = key;
  }
  return obj;
}

/**
 * Important user IDs
 */
export const UserIDs = {
  KARUTA: "646937666251915264",
  DEV1: "460818930009636864",
};

/**
 * Contains all the colors used by the bot `(pending completion)`
 * * `LIGHT_BLUE`
 */
export const Colors = {
  LIGHT_BLUE: 0x31d3bf,
  KARUTA_GREY: 0x9b9b9b,
  PALE_BLUE: 0xacdae8,
  SANDY_GOLD: 0xfcb538,
  TOMATO_RED: 0xed4245,
  CRIMSON_RED: 0xe6332f,
  TIDE_GREEN: 0x27d157,
  LIME: 0x1ee100,
  WARNING_YELLOW: 0xeed202,
  JUST_GREEN: 0x00ff00,
  MOJO_RED: 0xc64242,
};

export const CustomSymbols = {
  COOLDOWN_REMOVAL: Symbol("cooldownRemoval"),
};

export const PhoneticAlphabet = [
  "Alchemy",
  "Bizarre",
  "Cryptic",
  "Dazzle",
  "Enigma",
  "Fractal",
  "Galaxy",
  "Hologram",
  "Incognito",
  "Jovial",
  "Kinetic",
  "Labyrinth",
  "Mythical",
  "Nebula",
  "Odyssey",
  "Pandemonium",
  "Quasar",
  "Riddle",
  "Surreal",
  "Tesseract",
  "Uncharted",
  "Velvet",
  "Wunderkind",
  "Xeno",
  "Whimsy",
  "Zephyr",
  "Avalanche",
  "Bonsai",
  "Cascading",
  "Dusky",
  "Eclipse",
  "Firefly",
  "Galactic",
  "Harmonic",
  "Iridescent",
  "Jovian",
  "Kaleidoscopic",
  "Luminarium",
  "Majestic",
  "Nebulous",
  "Oasis",
  "Panorama",
  "Quintessential",
  "Radiant",
  "Stellar",
  "Tranquility",
  "Ultraviolet",
  "Velvetine",
  "Whimsy",
  "Xenial",
  "Yondering",
  "Zestful",
];

export const URLs = { KARUTA_S3: "d2l56h9h5tj8ue.cloudfront.net" };

export const StringifiedPermissionBitfields = {
  STAFF_DEFAULT: new PermissionsBitField([
    PermissionsBitField.Flags.ManageGuild,
    PermissionsBitField.Flags.ManageRoles,
  ])
    .valueOf()
    .toString(),
  DISABLED: "0",
  ADMINISTRATOR: PermissionsBitField.Flags.Administrator.toString(),
};
