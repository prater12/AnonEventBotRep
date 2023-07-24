import { DataTypes } from "sequelize";

export default {
  name: "Conversation",
  schema: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
};
