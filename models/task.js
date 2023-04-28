const Sequelize = require("sequelize");
const sequelize = require("../database/dbConfig");
const User = require("./user");

const Task = sequelize.define("Task", {
  id: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  gmt_expire: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  important: {
    type: Sequelize.BOOLEAN,
    allowNull: false
  }
});

User.hasMany(Task);
Task.belongsTo(User);

module.exports = Task;
