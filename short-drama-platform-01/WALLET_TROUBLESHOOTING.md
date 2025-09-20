# 钱包连接故障排除指南

## 🚨 连接不上？快速解决方案

### 1. 检查 MetaMask 是否已安装

**问题症状**: 点击"连接 MetaMask"没有反应，或提示"请安装MetaMask钱包"

**解决方案**:
```bash
# 1. 访问 MetaMask 官网
https://metamask.io/download/

# 2. 选择你的浏览器类型下载扩展
# 3. 安装完成后重启浏览器
# 4. 刷新页面重试
```

### 2. MetaMask 已锁定

**问题症状**: MetaMask 已安装但连接失败

**解决方案**:
1. 点击浏览器工具栏中的 MetaMask 图标 🦊
2. 输入密码解锁钱包
3. 返回页面重新点击"连接 MetaMask"

### 3. 网络配置问题

**问题症状**: 连接成功但显示错误的网络

**解决方案**:
```javascript
// 推荐网络配置
Sepolia 测试网:
- 网络名称: Sepolia Test Network  
- RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
- 链 ID: 11155111
- 货币符号: ETH
- 区块浏览器: https://sepolia.etherscan.io

本地开发网络:
- 网络名称: Localhost 8545
- RPC URL: http://localhost:8545
- 链 ID: 31337
- 货币符号: ETH
```

### 4. 用户拒绝连接

**问题症状**: MetaMask 弹窗出现但点击了"取消"

**解决方案**:
1. 重新点击"连接 MetaMask"
2. 在 MetaMask 弹窗中点击"连接"
3. 选择要连接的账户
4. 点击"下一步" → "连接"

## 🔧 高级故障排除

### 使用内置诊断工具

项目中已集成钱包连接诊断工具，当连接失败时会自动显示：

1. **基础环境检测**: 检查 MetaMask 安装状态
2. **网络信息**: 显示当前链 ID 和网络名称  
3. **账户状态**: 显示可用账户数量
4. **错误信息**: 显示具体的错误原因
5. **解决方案**: 提供针对性的修复建议

### 浏览器控制台调试

打开浏览器开发者工具 (F12)，查看控制台错误信息：

```javascript
// 常见错误及解决方案

1. "ethereum is not defined"
   → MetaMask 未安装或未启用

2. "User rejected the request"  
   → 用户在 MetaMask 中点击了取消

3. "Invalid chain id"
   → 网络配置不正确

4. "MetaMask is locked"
   → 需要解锁 MetaMask 钱包

5. "Failed to fetch"
   → 网络连接问题或 RPC 节点不可用
```

### 清除缓存和重置

如果问题持续存在：

```bash
# 1. 清除浏览器缓存
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)

# 2. 重置 MetaMask 连接
MetaMask → 设置 → 高级 → 重置账户

# 3. 重新导入钱包（如有必要）
```

## 📱 移动端连接

如果在移动设备上使用：

1. **使用 MetaMask 移动应用内置浏览器**
2. **或者使用支持 WalletConnect 的钱包**
3. **确保移动端网络连接稳定**

## ⚡ 快速检查清单

在联系技术支持前，请确认：

- [ ] MetaMask 已安装并解锁
- [ ] 选择了正确的网络
- [ ] 账户中有足够的 ETH 支付 Gas 费
- [ ] 浏览器允许弹窗（未被拦截）
- [ ] 没有其他钱包扩展冲突
- [ ] 网络连接正常

## 🆘 仍然无法解决？

### 环境信息收集

请提供以下信息以便诊断：

```javascript
// 在浏览器控制台运行以下代码
console.log('浏览器:', navigator.userAgent);
console.log('MetaMask 安装:', typeof window.ethereum !== 'undefined');
console.log('当前网络:', window.ethereum?.chainId);
console.log('账户状态:', window.ethereum?.selectedAddress);
```

### 联系支持

如果以上方案都无法解决问题，请：

1. 截图错误信息
2. 记录操作步骤
3. 提供环境信息
4. 描述预期行为 vs 实际行为

## 🎯 预防措施

为避免连接问题：

1. **定期更新 MetaMask** 到最新版本
2. **使用稳定的网络连接**
3. **保持浏览器更新**
4. **避免同时安装多个钱包扩展**
5. **定期备份钱包助记词**

---

💡 **提示**: 大部分连接问题都是由于 MetaMask 未解锁或网络配置不正确导致的。使用页面上的诊断工具可以快速定位问题！
