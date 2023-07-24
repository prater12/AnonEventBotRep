import { Sequelize } from "sequelize";
import * as fs from "fs";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "db.sqlite",
});

const schemaFiles = fs
  .readdirSync("./schemas")
  .filter((file) => file.endsWith(".js"));

for (const file of schemaFiles) {
  const model = (await import(`./schemas/${file}`)).default;
  sequelize.define(model.name, model.schema);
}

sequelize.models.Topic.hasOne(sequelize.models.Conversation);
sequelize.models.Role.hasOne(sequelize.models.Conversation, {
  as: "role1",
  foreignKey: "role1id",
});
sequelize.models.Role.hasOne(sequelize.models.Conversation, {
  as: "role2",
  foreignKey: "role2id",
});
sequelize.models.Channel.hasOne(sequelize.models.Conversation, {
  as: "role1channel",
  foreignKey: "role1channelid",
});
sequelize.models.Channel.hasOne(sequelize.models.Conversation, {
  as: "role2channel",
  foreignKey: "role2channelid",
});
sequelize.models.Event.hasMany(sequelize.models.Conversation);
sequelize.models.Conversation.belongsTo(sequelize.models.Event);

sequelize.models.Channel.belongsTo(sequelize.models.Conversation);

//sequelize.sync({ force: true });

export default sequelize;
