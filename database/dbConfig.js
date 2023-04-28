const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('heroku_8b0e70c41dd5b65', 'b53afc7fb548c0', '47dd204f', 
{ 
dialect: 'mysql', 
host: "us-cdbr-east-06.cleardb.net"
});
// const sequelize = new Sequelize('nodeapidb', 'root', 'root', 
// { 
// dialect: 'mysql', 
// host: "127.0.0.1"
// });
mysql://b53afc7fb548c0:47dd204f@us-cdbr-east-06.cleardb.net/heroku_8b0e70c41dd5b65?reconnect=true
module.exports = sequelize