import sequelize from "../sequelize.js";
import Conversation from "../classes/Conversation.js";

export default async function makeConversations(event, client) {
  const guildId = event.model.guild;
  const eventId = event.model.id;
  const count = event.count;

  const topics = shuffleArray([...client.eventTopics.values()]);
  let topicIndex = topics.length - 1;

  const roles = client.eventRoles;

  const channels = client.extendedChannels.filter(
    (ch) => ch.guildId === guildId && ch.userId
  );

  const modelData = [];

  console.log(topics, roles, channels.size);

  while (channels.size) {
    const twoRoles = roles.randomKey(2);
    const twoChannels = channels.randomKey(2);

    channels.delete(twoChannels[0]);
    channels.delete(twoChannels[1]);

    modelData.push({
      eventId: eventId,
      role1id: twoRoles[0],
      role2id: twoRoles[1],
      topicId: topics[topicIndex--].id,
      role1channelid: twoChannels[0],
      role2channelid: twoChannels[1],
    });

    if (topicIndex < 0) {
      shuffleArray(topics);
      topicIndex = topics.length - 1;
    }
  }

  console.log(modelData);

  await sequelize.models.Conversation.bulkCreate(modelData);
  const models = await sequelize.models.Conversation.findAll({
    where: { eventId },
  });

  for (const model of models) {
    const conversation = new Conversation(model, client);
    await conversation.initiate();
    client.conversations.set(model.id, conversation);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
