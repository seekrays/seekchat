# 用户登录设计

## 双 token

使用 access_token 和 refresh_token 双 token 机制；

- 登录之后返回两个 token，access_token 的过期时间较短，只有 15min，refresh_token 的过期时间长有 7 天
- 再请求和返回中进行拦截： 如果 401 则请求使用 refresh_token 刷新，并返回新的 acces_token
- 如果 refresh_token 也过期则请求校验重新登录

## 登录

- 支持微信扫码登录
- 支持第三方 gmail 登录（后续增加其他比如 github）

## seekrays 支持模型道理

- 新的机器
