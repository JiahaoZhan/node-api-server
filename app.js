const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const router = require("./routes");
const sequelize = require("./database/dbConfig");
const app = express();

app.use(bodyParser.json()); // 解析json数据格式
app.use(bodyParser.urlencoded({ extended: true })); // 解析form表单提交的数据application/x-www-form-urlencoded
app.use(cors());

app.use("/", router);

sequelize.sync().then((result) => {
  app.listen(process.env.PORT || 8088, () => {
    console.log("server started");
  });
});
