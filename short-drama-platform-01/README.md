# Drama Platform 前端（Vue 3 + Vite + Ant Design Vue）

## 项目概述
本前端是“AI + 区块链短剧平台”的用户端，定位为类似红果短剧的分集短剧平台：覆盖首页/短视频流、短剧详情（分集试看与付费/会员）、创作发布、AI 助手、区块链确权与分账、创作者看板等。已移除交互式剧情模块，聚焦分集播放与商业化闭环；支持全站 Mock，无后端即可完整演示。

## 技术栈
- 框架：Vue 3、Vite
- UI：Ant Design Vue、@ant-design/icons-vue（已启用 reset.css）
- 状态管理：Pinia
- 路由：Vue Router 4（登录保护 via `meta.requiresAuth`）
- 网络：Axios（结合代理与鉴权 Header）
- 链上：ethers（浏览器 Provider）

## 目录结构（关键）
- `src/views/`
  - `Home.vue`：首页与热门短剧（筛选/排序/无限加载）
  - `ShortFeed.vue`：短视频信息流（纵向滑动、自动播放、收藏/点赞/分享、缓冲进度）
  - `DramaDetail.vue`：短剧详情、分集试看与付费、评论互动、倍速/试看/会员/整季
  - `CreateDrama.vue`：创作表单，AI 一键生成剧本/角色/场景，支持分集配置与整季价格
  - `AIAssistant.vue`：AI 对话与生成工作台，结果评分/复制/应用
  - `Blockchain.vue`：钱包连接、版权注册、收益分配与记录、合约与网络信息
  - `Dashboard.vue`：创作者看板与 KPI（Mock 趋势图、最近活动、我的短剧）
  - `Login.vue` / `Register.vue` / `Me.vue`：鉴权与个人页
- `src/components/`
  - `AIChat.vue`：通用聊天组件
  - `DramaCard.vue`：短剧卡片
- `src/stores/`
  - `user.js`：鉴权与本地持久化（兼容后端/Mock 响应结构）
  - `drama.js`：短剧列表/详情/CRUD（支持 Mock）
  - `ai.js`：AI 生成、对话与建议（支持 Mock）
  - `blockchain.js`：钱包连接、版权注册、分账等（支持 Mock）
  - `video.js`：短视频收藏与观看历史本地持久化
- `src/api/mock.js`：Mock 能力与示例数据；`MOCK_MODE` 一键切换
- `vite.config.js`：别名 `@ -> src`；代理 `/api -> http://localhost:8080`（不重写）

## 路由与鉴权
`src/router/index.js` 为受保护路由设置了 `meta.requiresAuth`，在守卫中基于 `useUserStore().isAuthenticated` 自动跳转到 `/login`。

## 功能清单（与源码一致）
- 鉴权：登录/注册、本地存储 `token`/`user`，Axios 注入 `Authorization`
- 首页：筛选/搜索/排序，IntersectionObserver 无限加载
- 短视频流：自动激活播放、静音切换、进度/缓冲条、收藏/点赞、容错重试
- 短剧详情：
  - 分集播放：试看倒计时环、倍速、购买单集/整季、会员解锁；本地交易记录与 NFT 示例
  - 评论/点赞/收藏/分享：在 Mock/降级模式下可用
- 创作：表单校验、封面上传前校验、AI 生成剧本/角色/场景、分集配置与整季定价
- AI 助手：对话、多生成入口、结果查看/复制/评分
- 区块链：钱包连接、版权注册、收益分配、交易/版权列表、网络与合约信息
- 看板：统计卡片、KPI、趋势条形可视化、我的短剧卡片列表

## Mock 模式与测试账号
- 开关：`src/api/mock.js` 中 `export const MOCK_MODE = true`
- 登录测试账号：
  - 账号：`admin@drama.com`
  - 密码：`123456`
- 已接入 Mock 的模块：用户、短剧 CRUD、交互剧情、AI 生成/对话/建议、区块链（连接/确权/分账）、短视频流、连载付费、会员、KPI
- 切换为真实后端：设为 `false`，确保后端可用且代理正确（见下）

## 本地运行
- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 访问地址：`http://localhost:3000`

## 连接 Sepolia 测试网（可选，切换为真实链交互）
1. 创建 `.env.local` 并写入：
```
VITE_NETWORK=sepolia
VITE_CONTRACT_COPYRIGHT_ADDRESS=0xYourCopyrightContract
VITE_CONTRACT_REVENUE_ADDRESS=0xYourRevenueContract
VITE_CONTRACT_NFT_ADDRESS=0xYourNftContract
VITE_MOCK_MODE=false
```
2. 在 MetaMask 选择网络为 Sepolia（ChainId 11155111），从 Faucet 领取测试 ETH。
3. 进入“区块链”页面时将自动根据上述变量初始化合约实例。
（未配置真实合约时可继续使用 Mock：`VITE_MOCK_MODE=true`）

## 代理与后端联调
- 代理：`vite.config.js` 已设置 `/api` 代理到 `http://localhost:8080` 且不重写前缀
- 后端默认 `server.servlet.context-path: /api`，因此无需 `rewrite`
- 主要接口（当 `MOCK_MODE=false`）：
  - 鉴权：`POST /api/auth/login`，`POST /api/auth/register`
  - 短剧：`GET /api/dramas`，`GET /api/dramas/{id}`，`POST /api/dramas`，`PUT /api/dramas/{id}`，`DELETE /api/dramas/{id}`
  - （若接入后端）交互剧情相关接口已不再使用
  - AI：`POST /api/ai/generate-script`、`/generate-character`、`/generate-scene`、`/chat`、`/suggestions`

## 常见问题
- 无法登录：确认使用 Mock 账号或已切换 `MOCK_MODE=false` 并启动后端
- 跨域/404：检查代理是否覆盖 `/api`，后端是否配置 context-path `/api`
- 钱包相关：浏览器需安装 MetaMask；Mock 模式下不依赖钱包
- 视频无法播放：网络波动已内置最多 3 次重试

## 开发提示
- 组件与样式：已采用 Ant Design Vue reset.css；新增组件请保持命名与风格一致
- 状态持久化：用户、收藏、购买记录等通过 localStorage 简单持久
- 代码组织：业务逻辑集中在 Pinia Store；组件尽量保持展示与交互职责

## 后续可扩展
- 将评论/关注等本地降级操作统一封装进 `mockAPI`
- 接入真实支付与链上合约 ABI，替换当前演示调用
- 引入 E2E（Playwright）覆盖登录/创作/交互剧情/购买流程

— 完 —
