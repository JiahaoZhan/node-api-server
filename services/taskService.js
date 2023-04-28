const { querySql, queryOne } = require("../utils/index");
const jwt = require("jsonwebtoken");
const boom = require("boom");
const { validationResult } = require("express-validator");
const moment = require("moment");
const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED,
} = require("../utils/constant");
const { decode } = require("../utils/user-jwt");
const Task = require("../models/task");
const User = require("../models/user");

function queryTaskList(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { pageSize, pageNum, status } = req.query;
    // default values for pagination
    // pageSize = pageSize ? pageSize : 1;
    // pageNum = pageNum ? pageNum : 1;
    status = status || status == 0 ? status : null;
    // console.log("***pagination***", pageSize, pageNum, status);
    // find the current user
    User.findOne({ where: { email: decode(req).email } }).then((user) => {
      // find the tasks associated with the user
      // const skipped = (pageNum - 1) * pageSize;
      Task.findAndCountAll({
        where: { UserId: user.id },
        // offset: skipped,
        // limit: parseInt(pageSize),
      }).then(({ count, rows }) => {
        // console.log("tasks", tasks);
        // console.log("tasks", tasks[0].dataValues.gmt_expire);
        // if no task is found
        if (count === 0) {
          res.json({
            code: CODE_ERROR,
            msg: "Current user does not have any tasks",
            data: null,
          });
        } else {
          // if status filter is defined
          if (status) {
          }
          // if there is no filter (all task)
          else {
            // To DO: later can implement a filter for different sorting filter
            // right now sort by deafult by time
            rows.sort((a, b) => {
              return moment(a.dataValues.updatedAt).isBefore(
                moment(b.dataValues.updatedAt)
              )
                ? 1
                : -1;
            });

            res.json({
              code: CODE_SUCCESS,
              msg: "Query task successful",
              data: {
                rows: rows,
                total: count,
                pageNo: parseInt(pageNum),
                pageSize: parseInt(pageSize),
              },
            });
          }
        }
      });
    });
  }
}

function addTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    const email = decode(req).email;
    User.findOne({ where: { email: email } }).then((user) => {
      const { title, content, gmt_expire, important, id } =
        req.body.task;
      Task.findOrCreate({
        where: { title: title },
        defaults: {
          content,
          gmt_expire,
          status: "To do",
          important,
          id,
          UserId: user.id,
        },
      }).then(([task, created]) => {
        console.log(task)
        if (!created) {
          console.log("Tasks cannot have duplicated names");
          res.json({
            code: CODE_ERROR,
            msg: "***Task creation failed***",
            data: null,
          });
        } else {
          res.json({
            code: CODE_SUCCESS,
            msg: "***Task creation succeed***",
            data: task,
          });
        }
      });
    });
  }
}

function editTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { task } = req.body;
    Task.update(
      { ...task },
      {
        where: {
          id: task.id,
        },
      }
    ).then((result) => {
      // result = [x] or [x, y]
      // [x] if you're not using Postgres
      // [x, y] if you are using Postgres
      /* element x is always the number of affected rows,
       * while the second element y is the actual affected rows
       * (only supported in postgres with options.returning set to true.)
       */
      // failed update
      if (result[0] === 0) {
        res.json({
          code: CODE_ERROR,
          msg: "Fail to update the task",
          data: null,
        });
      }
      // successful update
      else {
        res.json({
          code: CODE_SUCCESS,
          msg: "Update task successfully",
          data: {
            ...task,
          },
        });
      }
    });
  }
}

function updateTaskStatus(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, status, index } = req.body;
    const newStatus = status === "To do" ? "Finished" : "To do"
    Task.update(
      { status: newStatus },
      {
        where: {
          id
        },
      }
    ).then(result => {
      if (result !== 0) {
        res.json({
          code: CODE_SUCCESS,
          msg: "Update status successful",
          data: {
            index,
            status: newStatus
          }
        })
      }
      else {
        res.json({
          code: CODE_ERROR,
          msg: "Fail to update mark",
          data: null
        })
      }
    })
  }
}

function updateMark(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, index, important } = req.body;
    Task.update(
      { important: !important },
      {
        where: {
          id
        },
      }
    ).then(result => {
      if (result !== 0) {
        res.json({
          code: CODE_SUCCESS,
          msg: "Update mark successful",
          data: {
            index,
            important: !important
          }
        })
      }
      else {
        res.json({
          code: CODE_ERROR,
          msg: "Fail to update mark",
          data: null
        })
      }
    })
  }
}

function deleteTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id } = req.body;
    Task.destroy({
      where: {
        id: id
      }
    }).then(result=> {
      if (result !== 0) {
        res.json({
          code: CODE_SUCCESS,
          msg: "***Task delete succeed***",
          data: {
            id
          }
        })
      }
      else {
        res.json({
          code: CODE_ERROR,
          msg: "***Task delete failed***",
          data: null
        })
      }
    })
  }}

// function findTask(param, type) {
//   let query = null;
//   if (type == 1) {
//     query = `select id, title from sys_task where title='${param}'`;
//   } else {
//     query = `select id, title from sys_task where id='${param}'`;
//   }
//   return queryOne(query);
// }

module.exports = {
  queryTaskList,
  addTask,
  editTask,
  updateTaskStatus,
  updateMark,
  deleteTask,
};
