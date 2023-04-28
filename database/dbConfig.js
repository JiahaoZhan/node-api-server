const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('heroku_f7469a0c6b39995', 'b53afc7fb548c0', '47dd204f', 
{ 
dialect: 'mysql', 
host: "us-cdbr-east-06.cleardb.net"
});

module.exports = sequelize