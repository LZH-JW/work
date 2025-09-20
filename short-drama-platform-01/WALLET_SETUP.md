# 钱包连接设置说明

## 概述

项目中的区块链模拟数据已被删除，现在支持真实的 MetaMask 钱包连接。

## 环境变量配置

在项目根目录创建 `.env` 文件（或复制 `.env.example`），配置以下变量：

```bash
# 应用配置
VITE_APP_TITLE=短剧平台

# 网络配置
VITE_NETWORK=sepolia

# 是否启用 Mock 模式（设为 false 或不设置以禁用）
VITE_MOCK_MODE=false

# 智能合约地址（需要根据实际部署地址修改）
VITE_CONTRACT_COPYRIGHT_ADDRESS=0x...
VITE_CONTRACT_REVENUE_ADDRESS=0x...
VITE_CONTRACT_NFT_ADDRESS=0x...
VITE_CONTRACT_REVENUE_SHARE_ADDRESS=0x...
VITE_CONTRACT_CONTENT_REGISTRY_ADDRESS=0x...
VITE_CONTRACT_TASK_MARKET_ADDRESS=0x...
VITE_CONTRACT_PAYMENT_ESCROW_ADDRESS=0x...
VITE_CONTRACT_PLATFORM_POINTS_ADDRESS=0x...

# API 配置
VITE_API_BASE_URL=http://localhost:8080
```

## MetaMask 设置

1. **安装 MetaMask**
   - 在浏览器中安装 MetaMask 扩展程序
   - 创建或导入钱包

2. **网络配置**
   - 添加 Sepolia 测试网络（如果尚未添加）
   - 网络名称：Sepolia Test Network
   - RPC URL：https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   - 链 ID：11155111
   - 货币符号：ETH
   - 区块浏览器：https://sepolia.etherscan.io

3. **获取测试 ETH**
   - 访问 Sepolia 水龙头获取测试 ETH
   - 推荐：https://sepoliafaucet.com/

## 功能说明

### 已移除的模拟功能
- ❌ 模拟钱包连接
- ❌ 模拟交易哈希生成
- ❌ 模拟版权注册数据
- ❌ 模拟收益分配数据
- ❌ 模拟 Gas 价格和交易状态

### 现在支持的真实功能
- ✅ 真实的 MetaMask 钱包连接
- ✅ 真实的网络信息获取（Gas 价格、区块高度）
- ✅ 真实的智能合约交互（需要配置合约地址）
- ✅ 真实的交易提交和状态查询

## 使用步骤

1. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置正确的合约地址
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **连接钱包**
   - 访问区块链管理页面
   - 点击"连接MetaMask"
   - 在 MetaMask 中确认连接

4. **使用区块链功能**
   - 查看钱包余额和网络信息
   - 与智能合约交互（需要先部署合约）
   - 查看交易历史

## 注意事项

- 确保 MetaMask 已安装并连接到正确的网络
- 智能合约地址需要根据实际部署情况配置
- 在测试网络上操作不会产生真实费用
- 如需使用主网，请谨慎操作并确保理解相关风险

## 故障排除

### 连接失败
- 检查 MetaMask 是否已安装
- 确认网络设置正确
- 查看浏览器控制台错误信息

### 合约交互失败
- 确认合约地址配置正确
- 检查 ABI 定义是否匹配
- 确保钱包有足够的 Gas 费用

### 环境变量不生效
- 确认 `.env` 文件位于项目根目录
- 重启开发服务器
- 检查变量名前缀是否为 `VITE_`
