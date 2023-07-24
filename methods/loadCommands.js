import logger from "../logger.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
const token = process.env["TOKEN"];
logger.info("Token: ", token);
const rest = new REST({ version: "10" }).setToken(token);

export default async function loadCommands(commands, guild) {
  const res = await rest.put(
    Routes.applicationGuildCommands(guild.client.application.id, guild.id),
    {
      body: commands,
    }
  );

  return res;
}
