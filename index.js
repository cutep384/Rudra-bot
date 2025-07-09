const { Sequelize } = require("sequelize");

// 👉 Use nested config safely
const DATABASE = global.config.DATABASE?.sqlite || global.config.DATABASE;

if (!DATABASE || !DATABASE.storage) {
  throw new Error("❌ DATABASE configuration missing in config.json!");
}

// 👇 Setup SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DATABASE.storage,
  logging: false // Optional: remove or change as needed
});

module.exports = { Sequelize, sequelize };
