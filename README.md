<h1 align="center" style="margin: 30px 0; font-weight: bold;">共享充电宝管理系统</h1>
<h4 align="center">基于 Vue 3、Element Plus 和 Vite 构建的共享充电宝后台管理前端</h4>

## 项目简介

`share-ui` 是共享充电宝微服务平台的管理端，基于 RuoYi-Cloud-Vue3 二次开发。系统通过统一网关与后端服务交互，提供站点、机柜、充电宝、计费规则、订单、用户及经营统计等业务管理能力，并保留若依框架的系统权限和运维工具。

- 前后端分离，开发环境通过 Vite 代理访问后端网关。
- 使用 Vue Router 动态路由和权限指令实现菜单、按钮级访问控制。
- 使用 ECharts 展示订单、用户和区域统计数据。
- 集成腾讯地图，支持站点位置展示和经纬度选择。

## 技术栈

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Vue | 3.3.9 | 前端基础框架 |
| Vite | 5.0.4 | 开发服务器与构建工具 |
| Element Plus | 2.4.3 | UI 组件库 |
| Vue Router | 4.2.5 | 路由管理 |
| Pinia | 2.1.7 | 状态管理 |
| Axios | 0.27.2 | HTTP 请求与拦截器 |
| ECharts | 5.x | 统计图表 |
| Sass | 1.69.5 | CSS 预处理器 |

## 功能模块

| 模块 | 主要功能 |
| --- | --- |
| 设备管理 | 站点、机柜、机柜类型、槽位及充电宝档案维护，支持站点关联柜机和地图选点 |
| 站点地图 | 基于腾讯地图展示站点位置及分布 |
| 计费规则 | 费用规则配置与维护，为站点和订单计费提供规则依据 |
| 订单管理 | 按订单号、状态、创建时间查询，查看订单、账单及用户信息，支持数据导出 |
| 用户管理 | C 端用户信息查询与管理 |
| 数据统计 | 订单、用户、区域等经营数据统计与图表展示 |
| 系统管理 | 用户、部门、岗位、角色、菜单、字典、参数、通知公告、操作日志和登录日志 |
| 运维工具 | 在线用户、定时任务、代码生成和表单构建等若依内置能力 |

## 项目结构

```text
share-ui
├── public                  # 静态资源
├── src
│   ├── api                 # 后端接口封装
│   ├── assets              # 样式、图片等资源
│   ├── components          # 公共组件
│   ├── directive           # 权限等自定义指令
│   ├── layout              # 页面布局
│   ├── plugins             # 插件与缓存封装
│   ├── router              # 静态路由与动态路由
│   ├── store               # Pinia 状态管理
│   ├── utils               # 请求、鉴权及通用工具
│   ├── views               # 业务与系统页面
│   │   ├── device          # 站点、机柜、充电宝等设备管理
│   │   ├── map             # 站点地图
│   │   ├── order           # 订单管理
│   │   ├── rule            # 计费规则
│   │   ├── statistics      # 统计图表
│   │   ├── system          # 系统管理
│   │   └── user            # C 端用户管理
│   ├── App.vue
│   ├── main.js
│   ├── permission.js       # 路由守卫与权限校验
│   └── settings.js         # 系统界面设置
├── vite                    # Vite 插件配置
├── .env.development        # 开发环境变量
├── .env.staging            # 测试环境变量
├── .env.production         # 生产环境变量
├── vite.config.js          # Vite 与开发代理配置
└── package.json            # 依赖与脚本
```

## 环境要求

- Node.js 18 或更高版本。
- npm 9 或更高版本，也可使用 Yarn；同一环境建议固定一种包管理器。
- 配套后端工程 `share-parent`，本地默认网关地址为 `http://localhost:18080`。
- 使用站点地图和地图选点功能时，需要可用的腾讯地图 JavaScript API Key。

后端所需的数据库、缓存、消息队列及微服务启动方式，请参阅后端工程文档。

## 快速开始

```bash
# 进入项目目录
cd share-ui

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

默认访问地址为 `http://localhost:80`，实际地址以启动日志为准。如需修改端口，可调整 `vite.config.js` 中的 `server.port`。

### 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发环境 |
| `npm run build:stage` | 构建测试环境，读取 `.env.staging` |
| `npm run build:prod` | 构建生产环境，读取 `.env.production` |
| `npm run preview` | 本地预览构建结果，不用于生产部署 |

## 环境配置

| 环境 | 配置文件 | 页面标题 | 接口前缀 |
| --- | --- | --- | --- |
| 开发 | `.env.development` | 共享充电宝管理系统 | `/dev-api` |
| 测试 | `.env.staging` | 共享充电宝管理系统 | `/stage-api` |
| 生产 | `.env.production` | 共享充电宝管理系统 | `/prod-api` |

常用环境变量：

| 变量 | 说明 |
| --- | --- |
| `VITE_APP_TITLE` | 浏览器页面标题 |
| `VITE_APP_ENV` | 当前运行环境标识 |
| `VITE_APP_BASE_API` | Axios 请求的统一接口前缀 |
| `VITE_BUILD_COMPRESS` | 构建压缩方式，当前测试、生产环境配置为 `gzip` |

### 开发环境代理

开发环境下，前端请求 `/dev-api/*`，由 Vite 移除 `/dev-api` 前缀后转发至 `http://localhost:18080/*`。例如：

```text
/dev-api/system/user/list  ->  http://localhost:18080/system/user/list
```

如果后端网关不在本机或端口不同，请修改 `vite.config.js` 中 `server.proxy['/dev-api'].target`，修改后重启开发服务。

测试和生产环境的 `/stage-api`、`/prod-api` 前缀需要由 Nginx 等反向代理转发到后端网关。

## 登录与权限

- 登录成功后，前端在请求头中携带 `Authorization: Bearer <token>`。
- 菜单和动态路由由后端根据当前用户权限返回，新增业务页面后需同步配置后端菜单数据。
- 按钮权限可使用 `v-hasPermi`，角色权限可使用 `v-hasRole`。
- 使用项目默认初始化数据时，后台账号为 `admin / admin123`，首次登录后请及时修改密码。

## 地图配置

腾讯地图脚本在 `index.html` 中引入。部署到自己的环境前，请将脚本地址中的 `key` 参数替换为已申请且配置好域名白名单的 Key：

```html
<script src="https://map.qq.com/api/gljs?v=1.exp&key=你的腾讯地图Key"></script>
```

地图无法加载时，请检查 Key 是否有效、当前域名是否已加入白名单，以及浏览器是否可以访问腾讯地图服务。

## 构建与部署

```bash
# 测试环境
npm run build:stage

# 生产环境
npm run build:prod
```

构建产物输出到 `dist` 目录。项目使用 HTML5 History 路由，部署时需配置未知路径回退到 `index.html`。生产环境 Nginx 配置可参考：

```nginx
server {
    listen 80;
    server_name your-domain.example.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /prod-api/ {
        proxy_pass http://127.0.0.1:18080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

其中 `root`、域名和网关地址应按实际部署环境调整；如果构建时启用了 gzip，还需在 Nginx 中相应启用 gzip 静态文件支持。

## 常见问题

1. **提示“后端接口连接异常”**：确认网关及认证、系统、业务服务已启动，并检查开发代理或 Nginx 转发配置。
2. **登录后菜单缺失或按钮不可见**：检查用户角色、菜单权限和按钮权限标识是否已在后端配置。
3. **刷新页面返回 404**：确认 Web 服务器已配置 History 路由回退。
4. **统计图表没有数据**：确认统计服务和对应业务服务已启动，并检查查询时间、区域等筛选条件。

## 致谢

本项目基于 [RuoYi-Cloud-Vue3](https://github.com/yangzongzhuan/RuoYi-Cloud-Vue3) 扩展开发，感谢若依团队。项目遵循 [MIT License](./LICENSE)。
