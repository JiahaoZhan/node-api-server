const { querySql, queryOne } = require("../utils/index");
const md5 = require("../utils/md5");
const jwt = require("jsonwebtoken");
const boom = require("boom");
const { body, validationResult } = require("express-validator");
const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED,
} = require("../utils/constant");
const { decode } = require("../utils/user-jwt");
const User = require("../models/user");

function login(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { email, password } = req.body;
    User.findOne({ where: { email: email, password: md5(password) } }).then(
      (user) => {
        if (user === null) {
          res.json({
            code: CODE_ERROR,
            msg: "Incorrect email or password",
            data: null,
          });
        } else {
          const token = jwt.sign({ email }, PRIVATE_KEY, {
            expiresIn: JWT_EXPIRED,
          });

          const userData = {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };

          res.json({
            code: CODE_SUCCESS,
            msg: "**Sign in success**",
            data: {
              token,
              userData,
            },
          });
        }
      }
    );
  }
}

function register(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    console.log(msg);
    next(boom.badRequest(msg));
  } else {
    let { email, password } = req.body;
    console.log(email, password);
    User.findOrCreate({
      where: { email: email },
      defaults: {
        email: email,
        password: md5(password),
      },
    }).then(([user, created]) => {
      if (!created) {
        console.log("The user has existed");
        res.json({
          code: CODE_ERROR,
          msg: "Sign up failed",
          resData: {},
        });
      } else {
        const email = user.email;
        const token = jwt.sign({ email }, PRIVATE_KEY, {
          expiresIn: JWT_EXPIRED,
        });

        const userData = {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        res.json({
          code: CODE_SUCCESS,
          msg: "**Sign up succeed**",
          resData: {
            token,
            userData,
          },
        });
      }
    });
  }
}

// 重置密码
function resetPwd(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { username, oldPassword, newPassword } = req.body;
    oldPassword = md5(oldPassword);
    validateUser(username, oldPassword).then((data) => {
      console.log("校验用户名和密码===", data);
      if (data) {
        if (newPassword) {
          newPassword = md5(newPassword);
          const query = `update sys_user set password='${newPassword}' where username='${username}'`;
          querySql(query).then((user) => {
            // console.log('密码重置===', user);
            if (!user || user.length === 0) {
              res.json({
                code: CODE_ERROR,
                msg: "重置密码失败",
                data: null,
              });
            } else {
              res.json({
                code: CODE_SUCCESS,
                msg: "重置密码成功",
                data: null,
              });
            }
          });
        } else {
          res.json({
            code: CODE_ERROR,
            msg: "新密码不能为空",
            data: null,
          });
        }
      } else {
        res.json({
          code: CODE_ERROR,
          msg: "用户名或旧密码错误",
          data: null,
        });
      }
    });
  }
}

// 校验用户名和密码
function validateUser(username, oldPassword) {
  const query = `select id, username from sys_user where username='${username}' and password='${oldPassword}'`;
  return queryOne(query);
}

// 通过用户名查询用户信息
function findUser(username) {
  const query = `select id, username from sys_user where username='${username}'`;
  return queryOne(query);
}

module.exports = {
  login,
  register,
  resetPwd,
};
