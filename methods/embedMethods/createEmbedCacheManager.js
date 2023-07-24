function createServerInfoEmbedManager(createEmbed) {
  async function embedReturn(value, ...args) {
    if (!embedReturn.cacheMap.has(value)) {
      let requiredEmbed = await createEmbed(value, ...args);
      embedReturn.cacheMap.set(value, requiredEmbed);
    }
    return embedReturn.cacheMap.get(value);
  }

  embedReturn.cacheMap = new Map();
  return embedReturn;
}

export default createServerInfoEmbedManager;
