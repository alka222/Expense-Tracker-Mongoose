const Sequelize = require('sequelize');

require('dotenv').config()

const sequelize = new Sequelize (  process.env.DB_NAME ,process.env.SQL_USERNAME , process.env.SQL_PASS ,{
    dialect:'mysql',
    host: process.env.DB_HOST
})

module.exports = sequelize ;