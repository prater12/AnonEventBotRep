import { DataTypes } from "sequelize";

export default {
  name: "Channel",
  schema: {
    id: {
      type: DataTypes.STRING(30),
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM,
      values: ["chat", "log", "start"],
    },
    guild: {
      type: DataTypes.STRING(30),
      primaryKey: true,
    },
    user: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },
  },
};
