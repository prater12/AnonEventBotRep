import { DataTypes } from "sequelize";

export default {
  name: "Event",
  schema: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild: {
      type: DataTypes.STRING(30),
    },
    size: {
      type: DataTypes.INTEGER,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
};
