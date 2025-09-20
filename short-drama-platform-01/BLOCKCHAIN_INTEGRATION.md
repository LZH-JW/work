# 区块链功能集成说明

## 概述

已将 `dapp-frontend-test` 中的区块链交互功能集成到 `short-drama-platform-01` 项目中，并**移除了所有模拟数据**，现在支持真实的 MetaMask 钱包连接和区块链交互：

- ✅ 真实的 MetaMask 钱包连接
- ✅ RevenueShare 合约交互（查询余额、领取 ETH）
- ✅ ContentRegistry 合约交互（版权注册、查询）
- ✅ 完整的合约 ABI 定义
- ✅ 统一的状态管理
- ❌ 已移除所有模拟数据

## 新增功能

### 1. 合约 ABI 更新
- 位置：`src/contracts/index.js`
- 新增：RevenueShare、ContentRegistry、TaskMarket、PaymentEscrow、PlatformPoints 的完整 ABI

### 2. Blockchain Store 扩展
- 位置：`src/stores/blockchain.js`
- 新增方法：
  - `releaseETH(contractAddress, payeeAddress)` - 为受益人领取 ETH
  - `getReleasableAmount(contractAddress, payeeAddress)` - 查询可领取金额
  - `getContractBalance(contractAddress)` - 查询合约余额
  - `registerContent(contractAddress, contentId, author, uri, contentHash)` - 注册版权
  - `getContentRecord(contractAddress, contentId)` - 查询版权记录

### 3. Blockchain.vue 界面增强
- 新增 RevenueShare 合约交互区域
- 实时查询合约余额和可领取金额
- 一键领取功能
- 交易记录和状态跟踪

## 使用方法

### 1. 环境配置
**重要：** 项目已移除所有模拟数据，现在需要真实的 MetaMask 连接。

在项目根目录创建 `.env` 文件：
```env
# 网络配置（推荐使用 sepolia 测试网）
VITE_NETWORK=sepolia

# Mock 模式已禁用
VITE_MOCK_MODE=false

# 从 dapp-contracts 部署后获取实际地址
VITE_CONTRACT_REVENUE_SHARE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CONTRACT_CONTENT_REGISTRY_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# ... 其他合约地址
```

**MetaMask 设置要求：**
- 必须安装 MetaMask 浏览器扩展
- 配置 Sepolia 测试网络或本地网络
- 确保钱包有足够的测试 ETH

### 2. 启动项目
```bash
npm install
npm run dev
```

### 3. 使用 RevenueShare 功能
1. 访问 `/blockchain` 页面
2. 连接 MetaMask 钱包
3. 在"RevenueShare 合约交互"区域：
   - 输入从 `dapp-contracts` 部署的 RevenueShare 合约地址
   - 点击"查询合约余额"查看合约中的 ETH
   - 输入受益人地址
   - 系统会自动显示该地址的可领取金额
   - 点击"为受益人领取 ETH"执行领取操作

## 与 dapp-contracts 的配合使用

### 1. 部署合约
在 `dapp-contracts` 目录：
```bash
npm install
npm run node  # 启动本地链
# 新终端
npm run deploy:templates:localhost  # 部署合约
```

### 2. 获取合约地址
部署完成后，在 `dapp-contracts/deployments/latest.json` 中查看各合约地址，并更新前端的 `.env` 文件。

### 3. 测试流程
1. 向 RevenueShare 合约发送一些 ETH（模拟收入）
2. 在前端输入合约地址，查询余额
3. 输入受益人地址（部署时配置的 payees 之一）
4. 查看可领取金额并执行领取

## 技术特点

- **真实区块链交互**：移除所有模拟数据，仅支持真实的 MetaMask 连接
- **错误处理**：完善的错误提示和状态管理
- **交易跟踪**：自动记录交易哈希，支持区块浏览器查看
- **响应式设计**：自动查询可领取金额，实时更新状态
- **类型安全**：使用 ethers.js v6 的类型化合约交互
- **环境变量控制**：通过 `.env` 文件灵活配置合约地址和网络

## 后续扩展

可继续添加：
- TaskMarket 任务发布和接单功能
- PaymentEscrow 里程碑托管功能
- PlatformPoints 积分管理功能
- 批量操作和高级查询功能

