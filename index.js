import "./config.js";

import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import { Op } from "sequelize";
import * as fs from "fs";
import logger from "./logger.js";
import sequelize from "./sequelize.js";

import ExtendedChannel from "./classes/ExtendedChannel.js";
import Conversation from "./classes/Conversation.js";
import AnonEvent from "./classes/Event.js";

import readyScript from "./events/ready.js";
import loadCommands from "./methods/loadCommands.js";

const token = process.env["TOKEN"];

const LOAD_COMMANDS = true;

// Create a new client instance
const client = new Client({
  presence: {
    status: "online",
    activity: {
      name: `Anek sleep.`,
      type: "WATCHING",
    },
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith("js"));

for (const file of commandFiles) {
  const command = (await import(`./commands/${file}`)).default;
  client.commands.set(command.data.name, command);
}

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

try {
  await sequelize.authenticate();

  logger.info("Connected to SQLite database.");

  client.login(token);

  await new Promise((resolve, reject) => {
    client.once(Events.ClientReady, async (client) => {
      await readyScript.execute(client);
      resolve();
    });
  });

  client
    .on("warn", (msg) => logger.warn(msg))
    .on("debug", (msg) => logger.debug(msg));

  /* for (const guild of client.guilds.cache.values()) {
    await guild.channels.fetch();
  } */

  const channelModels = await sequelize.models.Channel.findAll({
    where: { type: "chat" },
  });

  client.extendedChannels = new Collection();

  for (const model of channelModels) {
    const channel = client.channels.cache.get(model.id);
    if (!channel) continue;

    client.extendedChannels.set(
      channel.id,
      await ExtendedChannel.prepareExtendedChannel({ channel, model })
    );
  }

  const eventModels = await sequelize.models.Event.findAll({
    where: { active: true },
    include: sequelize.models.Conversation,
  });

  console.log(eventModels);

  const conversationModels = [].concat(
    ...eventModels.map((m) => m.Conversations ?? m.conversations)
  );

  client.conversations = new Collection();

  for (const model of conversationModels) {
    const conversation = new Conversation(model, client);
    await conversation.initiate();
    client.conversations.set(model.id, conversation);
  }

  client.events = new Collection();

  for (const model of eventModels) {
    const event = await AnonEvent.create(model, client);
    client.events.set(event.startChannel.user, event);
  }

  if (false) {
    await sequelize.models.Role.create({
      name: "o",
      image:
        "https://www.planetware.com/wpimages/2020/02/france-in-pictures-beautiful-places-to-photograph-eiffel-tower.jpg",
    });
    await sequelize.models.Role.create({
      name: "oooo",
      image:
        "https://www.planetware.com/wpimages/2020/02/france-in-pictures-beautiful-places-to-photograph-eiffel-tower.jpg",
    });
    await sequelize.models.Topic.create({
      name: "ola",
      description: "Hula hula",
    });
  }

  const eventRoleModels = await sequelize.models.Role.findAll({});
  client.eventRoles = new Collection();

  for (const model of eventRoleModels) {
    client.eventRoles.set(model.id, model);
  }

  const eventTopicModels = await sequelize.models.Topic.findAll({});
  client.eventTopics = new Collection();

  for (const model of eventTopicModels) {
    client.eventTopics.set(model.id, model);
  }

  if (LOAD_COMMANDS) {
    await client.guilds.fetch();

    const commandsData = [
      ...client.commands.map((command) => command.data).values(),
    ];

    await Promise.all(
      [...client.guilds.cache.values()].map((guild) =>
        loadCommands(commandsData, guild)
      )
    );
  }

  for (const file of eventFiles) {
    if (file === "ready.js") continue;

    const event = (await import(`./events/${file}`)).default;
    if (event.once) {
      client.once(event.event, (...args) => event.execute(...args));
    } else {
      client.on(event.event, (...args) => event.execute(...args));
    }
  }

  //await sequelize.close();
} catch (err) {
  logger.fatal(err);
  process.exit();
}
