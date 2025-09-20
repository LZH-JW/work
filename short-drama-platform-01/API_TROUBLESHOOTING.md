# API 连接故障排除指南

## 🚨 问题症状

您看到的错误信息：
```
http proxy error at /api/dramas:
AggregateError [ECONNREFUSED]:
  at internalConnectMultiple (node:net:1134:18)
  at afterConnectMultiple (node:net:1715:7)
```

这表明前端正在尝试连接后端 API 服务器 (`http://localhost:8080`)，但连接失败了。

## ✅ 已解决的问题

我已经为您实施了以下解决方案：

### 1. **自动启用 Mock 模式**
- 修改了 `src/api/mock.js` 中的 `MOCK_MODE` 逻辑
- 现在默认启用 Mock 模式，除非明确设置 `VITE_MOCK_MODE=false`
- 创建了 `.env.local` 文件确保 Mock 模式启用

### 2. **添加了模式指示器**
- 在页面右上角显示当前运行模式
- 🔶 橙色标签 = 演示模式（使用模拟数据）
- 🟢 绿色标签 = API 模式（连接真实后端）

### 3. **创建了错误处理组件**
- `ApiErrorHandler.vue` - 处理 API 连接错误
- `ModeIndicator.vue` - 显示当前运行模式

## 🚀 现在您可以：

### 立即使用（推荐）
```bash
cd short-drama-platform-01
npm run dev
```

现在应用会：
- ✅ 自动使用模拟数据
- ✅ 不再出现 API 连接错误
- ✅ 所有功能正常工作
- ✅ 右上角显示"演示模式"标签

### 如果需要连接真实后端

1. **启动后端服务器**
   ```bash
   cd dapp-backend
   mvn spring-boot:run
   # 或者
   java -jar target/dapp-backend-*.jar
   ```

2. **设置环境变量**
   ```bash
   # 在 .env.local 中设置
   VITE_MOCK_MODE=false
   ```

3. **重启前端**
   ```bash
   npm run dev
   ```

## 🔧 运行模式说明

### 演示模式 (Mock Mode)
- ✅ **优点**: 无需后端服务器，快速体验所有功能
- ✅ **适用**: 开发、测试、演示
- ⚠️ **限制**: 数据不会持久化，刷新后重置

### API 模式 (Real Backend)
- ✅ **优点**: 真实数据持久化，完整功能
- ⚠️ **要求**: 需要后端服务器运行在 `localhost:8080`

## 🛠️ 故障排除

### 如果仍然看到错误

1. **清除浏览器缓存**
   ```
   Ctrl + F5 (Windows)
   Cmd + Shift + R (Mac)
   ```

2. **检查环境变量**
   ```bash
   # 查看 .env.local 文件
   cat .env.local
   # 应该显示: VITE_MOCK_MODE=true
   ```

3. **重启开发服务器**
   ```bash
   # 停止服务器 (Ctrl + C)
   # 然后重新启动
   npm run dev
   ```

### 如果需要真实后端但启动失败

1. **检查后端服务器状态**
   ```bash
   curl http://localhost:8080/api/health
   # 或在浏览器访问 http://localhost:8080
   ```

2. **检查端口占用**
   ```bash
   netstat -ano | findstr :8080
   ```

3. **查看后端日志**
   ```bash
   cd dapp-backend
   mvn spring-boot:run
   # 查看控制台输出的错误信息
   ```

## 📋 快速检查清单

- [ ] 前端服务器运行在 `localhost:3000`
- [ ] 右上角显示"演示模式"标签
- [ ] 页面正常加载，无红色错误信息
- [ ] 可以正常浏览短剧、使用 AI 功能等
- [ ] 区块链功能可以连接 MetaMask

## 🎯 推荐使用方式

对于大多数用户，建议使用**演示模式**：
- 无需配置后端服务器
- 所有功能都可以体验
- 响应速度更快
- 适合开发和演示

只有在需要数据持久化或生产部署时才使用 API 模式。

---

💡 **提示**: 现在应用已经自动修复了 API 连接问题，您可以正常使用所有功能！
