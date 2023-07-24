export default class Conversation {
  constructor(model, client) {
    this.model = model;
    this.client = client;
  }

  get extChannelOne() {
    return this.client.extendedChannels.get(this.model.role1channelid);
  }

  get extChannelTwo() {
    return this.client.extendedChannels.get(this.model.role2channelid);
  }

  get topic() {
    return this.model.topic;
  }

  async initiate() {
    if (this.extChannelOne) {
      this.extChannelOne.conversation = this;
    }
    if (this.extChannelTwo) {
      this.extChannelTwo.conversation = this;
    }
  }
}
