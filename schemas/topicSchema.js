import { DataTypes } from "sequelize";

export default {
  name: "Topic",
  schema: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
  },
};
