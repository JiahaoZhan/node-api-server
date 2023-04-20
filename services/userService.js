const { querySql, queryOne } = require('../utils/index')
const jwt = require('jsonwebtoken')
const boom = require('boom')
const { validationResult } = require('express-validator');
const {
    CODE_ERROR,
    CODE_SUCCESS,
    PRIVATE_KEY,
    JWT_EXPIRED
} = require('../utils/constant');
const { decode } = require('../utils/user-jwt')

function queryTaskList(req, res, next) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const [{msg}] = err.errors;
        next(boom.badRequest(msg));
    }
    else {
        let { pageSize, pageNo, status } = req.query; 
        pageSize = pageSize ? pageSize : 1;
        pageNo = pageNo ? pageNo : 1; 
        status = (status || status == 0) ? status : null;
        let query = `select d.id, d.title, d.content, d.status, d.is_major, d.gmt_create, d.gmt_expire from sys_task d`;
        querySql(query)
        .then(data => {
            if (!data || data.length === 0) {
                res.json({
                    code: CODE_ERROR,
                    msg: "No data currently",
                    data: null
                })
            }
            else {
                let total = data.length;
                let n = (pageNo - 1) * pageSize;
                if (status) {
                    let query_1 = `select d.id, d.title, d.content, d.status, d.is_major, d.gmt_create, d.gmt_expire from sys_task d where status='${status}' order by d.gmt_create desc`;
                    querySql(query_1)
                    .then(result_1 => {
                      console.log('分页1===', result_1);
                      if (!result_1 || result_1.length === 0) {
                        res.json({ 
                          code: CODE_SUCCESS, 
                          msg: '暂无数据', 
                          data: null 
                        })
                      } else {
                        let query_2 = query_1 + ` limit ${n} , ${pageSize}`;
                        querySql(query_2)
                        .then(result_2 => {
                          console.log('分页2===', result_2);
                          if (!result_2 || result_2.length === 0) {
                            res.json({ 
                              code: CODE_SUCCESS, 
                              msg: '暂无数据', 
                              data: null 
                            })
                          } else {
                            res.json({ 
                              code: CODE_SUCCESS, 
                              msg: '查询数据成功', 
                              data: {
                                rows: result_2,
                                total: result_1.length,
                                pageNo: parseInt(pageNo),
                                pageSize: parseInt(pageSize),
                              } 
                            })
                          }
                        })
                      }
                    })
                  } else {
                    let query_3 = query + ` order by d.gmt_create desc limit ${n} , ${pageSize}`;
                    querySql(query_3)
                    .then(result_3 => {
                      console.log('分页2===', result_3);
                      if (!result_3 || result_3.length === 0) {
                        res.json({ 
                          code: CODE_SUCCESS, 
                          msg: '暂无数据', 
                          data: null 
                        })
                      } else {
                        res.json({ 
                          code: CODE_SUCCESS, 
                          msg: '查询数据成功', 
                          data: {
                            rows: result_3,
                            total: total,
                            pageNo: parseInt(pageNo),
                            pageSize: parseInt(pageSize),
                          } 
                        })
                      }
                    })
                  }
                }
              })
            }
          }
          
          // 添加任务
          function addTask(req, res, next) {
            const err = validationResult(req);
            if (!err.isEmpty()) {
              const [{ msg }] = err.errors;
              next(boom.badRequest(msg));
            } else {
              let { title, content, gmt_expire } = req.body;
              findTask(title, 1)
              .then(task => {
                if (task) {
                  res.json({ 
                    code: CODE_ERROR, 
                    msg: '任务名称不能重复', 
                    data: null 
                  })
                } else {
                  const query = `insert into sys_task(title, content, status, is_major, gmt_expire) values('${title}', '${content}', 0, 0, '${gmt_expire}')`;
                  querySql(query)
                  .then(data => {
                    // console.log('添加任务===', data);
                    if (!data || data.length === 0) {
                      res.json({ 
                        code: CODE_ERROR, 
                        msg: '添加数据失败', 
                        data: null 
                      })
                    } else {
                      res.json({ 
                        code: CODE_SUCCESS, 
                        msg: '添加数据成功', 
                        data: null 
                      })
                    }
                  })
                }
              })
          
            }
          }
          
          // 编辑任务
          function editTask(req, res, next) {
            const err = validationResult(req);
            if (!err.isEmpty()) {
              const [{ msg }] = err.errors;
              next(boom.badRequest(msg));
            } else {
              let { id, title, content, gmt_expire } = req.body;
              findTask(id, 2)
              .then(task => {
                if (task) {
                  findTask(title, 1)
                  .then(result => {
                    if (result) {
                      res.json({ 
                        code: CODE_ERROR, 
                        msg: '任务名称不能重复', 
                        data: null 
                      })
                    } else {
                      const query = `update sys_task set title='${title}', content='${content}', gmt_expire='${gmt_expire}' where id='${id}'`;
                      querySql(query)
                      .then(data => {
                        // console.log('编辑任务===', data);
                        if (!data || data.length === 0) {
                          res.json({ 
                            code: CODE_ERROR, 
                            msg: '更新数据失败', 
                            data: null 
                          })
                        } else {
                          res.json({ 
                            code: CODE_SUCCESS, 
                            msg: '更新数据成功', 
                            data: null 
                          })
                        }
                      })
                    }
                  })
                } else {
                  res.json({ 
                    code: CODE_ERROR, 
                    msg: '参数错误或数据不存在', 
                    data: null 
                  })
                }
              })
          
            }
          }
          
          // 操作任务状态
          function updateTaskStatus(req, res, next) {
            const err = validationResult(req);
            if (!err.isEmpty()) {
              const [{ msg }] = err.errors;
              next(boom.badRequest(msg));
            } else {
              let { id, status } = req.body;
              findTask(id, 2)
              .then(task => {
                if (task) {
                  const query = `update sys_task set status='${status}' where id='${id}'`;
                  querySql(query)
                  .then(data => {
                    // console.log('操作任务状态===', data);
                    if (!data || data.length === 0) {
                      res.json({ 
                        code: CODE_ERROR, 
                        msg: '操作数据失败', 
                        data: null 
                      })
                    } else {
                      res.json({ 
                        code: CODE_SUCCESS, 
                        msg: '操作数据成功', 
                        data: null 
                      })
                    }
                  })
                } else {
                  res.json({ 
                    code: CODE_ERROR, 
                    msg: '参数错误或数据不存在', 
                    data: null 
                  })
                }
              })
          
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
              findTask(id, 2)
              .then(task => {
                if (task) {
                  const query = `update sys_task set is_major='${is_major}' where id='${id}'`;
                  querySql(query)
                  .then(data => {
                    // console.log('点亮红星标记===', data);
                    if (!data || data.length === 0) {
                      res.json({ 
                        code: CODE_ERROR, 
                        msg: 'fail to update', 
                        data: null 
                      })
                    } else {
                      res.json({ 
                        code: CODE_SUCCESS, 
                        msg: 'success update', 
                        data: null 
                      })
                    }
                  })
                } else {
                  res.json({ 
                    code: CODE_ERROR, 
                    msg: 'data not existing', 
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
              let { id, status } = req.body;
              findTask(id, 2)
              .then(task => {
                if (task) {
                  const query = `update sys_task set status='${status}' where id='${id}'`;
                  // const query = `delete from sys_task where id='${id}'`;
                  querySql(query)
                  .then(data => {
                
                    if (!data || data.length === 0) {
                      res.json({ 
                        code: CODE_ERROR, 
                        msg: 'fail to delete', 
                        data: null 
                      })
                    } else {
                      res.json({ 
                        code: CODE_SUCCESS, 
                        msg: 'delete success', 
                        data: null 
                      })
                    }
                  })
                } else {
                  res.json({ 
                    code: CODE_ERROR, 
                    msg: 'data not exist', 
                    data: null 
                  })
                }
              })
          
            }
          }
          
         
          function findTask(param, type) {
            let query = null;
            if (type == 1) { 
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
            deleteTask
          }