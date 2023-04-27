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
    pageSize = pageSize ? pageSize : 1;
    pageNum = pageNum ? pageNum : 1;
    status = status || status == 0 ? status : null;
    console.log("***pagination***", pageSize, pageNum, status);
    // find the current user
    User.findOne({ where: { email: decode(req).email } }).then((user) => {
      // find the tasks associated with the user
      const skipped = (pageNum - 1) * pageSize;
      Task.findAndCountAll({
        where: { UserId: user.id },
        offset: skipped,
        limit: parseInt(pageSize),
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
      const { title, content, gmt_expire, status, important, id } =
        req.body.task;
      Task.findOrCreate({
        where: { title: title },
        defaults: {
          content,
          gmt_expire,
          status,
          important,
          id,
          UserId: user.id,
        },
      }).then(([task, created]) => {
        if (!created) {
          console.log("Tasks cannot have duplicated names");
          res.json({
            code: CODE_ERROR,
            msg: "***Task creation failed***",
            data: {},
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
//   findTask(id, 2).then((task) => {
//     if (task) {
//       findTask(title, 1).then((result) => {
//         if (result) {
//           res.json({
//             code: CODE_ERROR,
//             msg: "任务名称不能重复",
//             data: null,
//           });
//         } else {
//           const query = `update sys_task set title='${title}', content='${content}', gmt_expire='${gmt_expire}' where id='${id}'`;
//           querySql(query).then((data) => {
//             // console.log('编辑任务===', data);
//             if (!data || data.length === 0) {
//               res.json({
//                 code: CODE_ERROR,
//                 msg: "更新数据失败",
//                 data: null,
//               });
//             } else {
//               res.json({
//                 code: CODE_SUCCESS,
//                 msg: "更新数据成功",
//                 data: null,
//               });
//             }
//           });
//         }
//       });
//     } else {
//       res.json({
//         code: CODE_ERROR,
//         msg: "参数错误或数据不存在",
//         data: null,
//       });
//     }
//   });
// }

// 操作任务状态
function updateTaskStatus(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, status } = req.body;
    findTask(id, 2).then((task) => {
      if (task) {
        const query = `update sys_task set status='${status}' where id='${id}'`;
        querySql(query).then((data) => {
          // console.log('操作任务状态===', data);
          if (!data || data.length === 0) {
            res.json({
              code: CODE_ERROR,
              msg: "操作数据失败",
              data: null,
            });
          } else {
            res.json({
              code: CODE_SUCCESS,
              msg: "操作数据成功",
              data: null,
            });
          }
        });
      } else {
        res.json({
          code: CODE_ERROR,
          msg: "参数错误或数据不存在",
          data: null,
        });
      }
    });
  }
}

// 点亮红星标记
function updateMark(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, is_major } = req.body;
    findTask(id, 2).then((task) => {
      if (task) {
        const query = `update sys_task set is_major='${is_major}' where id='${id}'`;
        querySql(query).then((data) => {
          // console.log('点亮红星标记===', data);
          if (!data || data.length === 0) {
            res.json({
              code: CODE_ERROR,
              msg: "操作数据失败",
              data: null,
            });
          } else {
            res.json({
              code: CODE_SUCCESS,
              msg: "操作数据成功",
              data: null,
            });
          }
        });
      } else {
        res.json({
          code: CODE_ERROR,
          msg: "参数错误或数据不存在",
          data: null,
        });
      }
    });
  }
}

// 删除任务
function deleteTask(req, res, next) {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { id, status } = req.body;
    findTask(id, 2).then((task) => {
      if (task) {
        const query = `update sys_task set status='${status}' where id='${id}'`;
        // const query = `delete from sys_task where id='${id}'`;
        querySql(query).then((data) => {
          // console.log('删除任务===', data);
          if (!data || data.length === 0) {
            res.json({
              code: CODE_ERROR,
              msg: "删除数据失败",
              data: null,
            });
          } else {
            res.json({
              code: CODE_SUCCESS,
              msg: "删除数据成功",
              data: null,
            });
          }
        });
      } else {
        res.json({
          code: CODE_ERROR,
          msg: "数据不存在",
          data: null,
        });
      }
    });
  }
}

// 通过任务名称或ID查询数据是否存在
function findTask(param, type) {
  let query = null;
  if (type == 1) {
    // 1:添加类型 2:编辑或删除类型
    query = `select id, title from sys_task where title='${param}'`;
  } else {
    query = `select id, title from sys_task where id='${param}'`;
  }
  return queryOne(query);
}

module.exports = {
  queryTaskList,
  addTask,
  editTask,
  updateTaskStatus,
  updateMark,
  deleteTask,
};
