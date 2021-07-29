# less api framework - devops server

## 介绍

`laf-devops-server` 是 less api framework 中负责在线开发和运维应用的服务：

  - 云函数管理
  - 数据访问策略管理
  - 数据库管理：集合与数据管理，备份与恢复
  - 应用状态：启停、指标统计、伸缩

另配有 `laf-devops-client` - LAF 开发运维控制台，提供 Web IDE，在线编写、调试云函数，操作数据库等。


## 安装部署

### 安装依赖

```sh
# 下载代码
git clone https://github.com/Maslow/less-framework.git
cd less-framework/packages/devops-server

# 安装依赖（建议使用 node 14+ 或 npm 7.5+，速度更快）
npm install

# 编译
npm run build
```

### 启动 MongoDb

```sh
docker run -p 27017:27017 --name mongo -d mongo
```

### 配置数据库，并初始化应用

```sh
# 创建配置文件 .env
cp .env.development .env

# 初始化管理员、访问策略、云函数等数据
npm run init
```

### 运行

```sh
#运行
npm start
```


## TODO

- 【已完成】 部署数据访问策略：写入 app db __deployed__rules, app server 应监听该库之变化（watch）
- 【已完成】 部署云函数：写入 app db __deployed__functions, app-server 运行前直接读取即可
- 【已完成】调试云函数：调用 app server 提供的调试接口，由 devops server 转发，或者发调试令牌直接调
- 【已完成】 部署应用触发器（新增、修改），应监听该库之变化

- 【已完成】考虑使用 mongo watch() 替代 less-api accessor 的数据事件，应用于部署监听和云函数事件（可获取变更数据的完整信息）
- 【已完成】数据管理-集合管理：使用 devo ps server dbm entry，可具备完整的 app db 管理能力 
- 【已完成】将 devops 中表名修改，增加前缀， 如: __admins，以适应用户可能用同一数据库，跑 app & devops server；

- 实现远程部署推送：远程推送源管理，推送云函数（及触发器），推送访问规则
- 远程部署请求管理：查询收到的部署请求，可拒绝，可接受

- 考虑以后去除 app server 中的 RBAC admin 相关的代码，转由云函数实现，云函数可初始配置 应用的 $injections getter
- 或将 app server 中的 admin entry 移至内置云函数中实现
