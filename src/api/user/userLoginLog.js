import request from '@/utils/request'

// 查询用户登录记录列表
export function listUserLoginLog(query) {
  return request({
    url: '/user/userLoginLog/list',
    method: 'get',
    params: query
  })
}

// 查询用户登录记录详细
export function getUserLoginLog(id) {
  return request({
    url: '/user/userLoginLog/' + id,
    method: 'get'
  })
}

// 删除用户登录记录
export function delUserLoginLog(id) {
  return request({
    url: '/user/userLoginLog/' + id,
    method: 'delete'
  })
}
