<template>
  <div class="wallet-connector">
    <div class="connector-header">
      <h2>短剧 DApp · 区块链交互</h2>
      <p>连接钱包 · 管理版权 · 收益分配</p>
    </div>

    <div class="connector-actions">
      <a-button 
        v-if="!blockchainStore.connected" 
        type="primary" 
        size="large" 
        @click="connectWallet" 
        :loading="connecting"
        class="connect-btn"
      >
        <WalletOutlined />
        连接 MetaMask
      </a-button>
      
      <div v-else class="connected-info">
        <div class="wallet-status">
          <a-tag color="green" class="status-tag">
            <CheckCircleOutlined />
            已连接
          </a-tag>
          <span class="account-address">{{ formatAddress(blockchainStore.account) }}</span>
          <a-tooltip title="复制地址">
            <a-button type="text" size="small" @click="copyAccount" :disabled="!blockchainStore.account">
              <CopyOutlined />
            </a-button>
          </a-tooltip>
        </div>
        
        <div class="wallet-details">
          <div class="balance-info" v-if="showBalance">
            <span class="balance-label">余额：</span>
            <span class="balance-value">{{ blockchainStore.balance }} ETH</span>
          </div>
          <div class="network-info">
            <span class="network-label">网络：</span>
            <span class="network-value">{{ networkName }}</span>
          </div>
        </div>

        <div class="wallet-actions">
          <a-button v-if="!showBalance" @click="queryBalance" size="small" :loading="loadingBalance">
            <ReloadOutlined />
            查询余额
          </a-button>
          <a-button v-else @click="refreshBalance" size="small" :loading="loadingBalance">
            <ReloadOutlined />
            刷新
          </a-button>
          <a-button @click="disconnectWallet" size="small" danger>
            <DisconnectOutlined />
            断开
          </a-button>
        </div>
      </div>
    </div>

    <div class="connector-footer" v-if="!blockchainStore.connected">
      <a-typography-text type="secondary">
        提示：请在 MetaMask 中切换到与你部署合约一致的网络
      </a-typography-text>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { ethers } from 'ethers'
import {
  WalletOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DisconnectOutlined,
  CopyOutlined
} from '@ant-design/icons-vue'

const blockchainStore = useBlockchainStore()
const connecting = ref(false)
const showBalance = ref(false)
const loadingBalance = ref(false)

const networkName = computed(() => {
  return import.meta.env.VITE_NETWORK || 'localhost'
})

const formatAddress = (address) => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

const connectWallet = async () => {
  connecting.value = true
  
  try {
    if (!window.ethereum) {
      message.error('请安装 MetaMask 钱包')
      return
    }

    // 检查 MetaMask 是否已解锁
    const isUnlocked = await window.ethereum._metamask?.isUnlocked?.() ?? true
    if (!isUnlocked) {
      message.warning('请先解锁 MetaMask 钱包')
      // 尝试触发解锁
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      return
    }

    // 检查当前连接状态
    const currentAccounts = await window.ethereum.request({ method: 'eth_accounts' })
    
    let accounts
    if (!currentAccounts || currentAccounts.length === 0) {
      // 未连接，请求连接权限（这会弹出 MetaMask 确认窗口）
      accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
    } else {
      // 已有连接，但用户点击了连接按钮，重新请求权限确认
      accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
    }

    if (!accounts || accounts.length === 0) {
      message.error('未获取到账户')
      return
    }

    // 设置连接状态
    blockchainStore.account = accounts[0]
    blockchainStore.connected = true
    
    // 创建 provider 和 signer
    const provider = new ethers.BrowserProvider(window.ethereum)
    blockchainStore.provider = provider
    blockchainStore.signer = await provider.getSigner()

    // 获取余额
    const balance = await provider.getBalance(accounts[0])
    blockchainStore.balance = ethers.formatEther(balance)

    // 只有真正成功时才显示成功消息
    message.success('钱包连接成功！')
    
    // 初始化合约
    const initResult = await blockchainStore.initializeContracts()
    if (!initResult.success) {
      message.warning('合约初始化失败，部分功能可能不可用')
    }
    
  } catch (error) {
    console.error('连接错误:', error)
    
    // 根据错误代码提供准确的提示
    if (error?.code === -32002) {
      message.info('请在 MetaMask 中处理连接请求')
    } else if (error?.code === 4001) {
      message.info('用户取消了连接')
    } else if (error?.code === -32603) {
      message.error('MetaMask 内部错误，请重试')
    } else {
      message.error('连接失败：' + (error?.message || '未知错误'))
    }
  } finally {
    connecting.value = false
  }
}

const disconnectWallet = () => {
  blockchainStore.disconnectWallet()
  message.success('钱包已断开连接')
  showBalance.value = false
}

const copyAccount = async () => {
  try {
    if (!blockchainStore.account) return
    await navigator.clipboard.writeText(blockchainStore.account)
    message.success('地址已复制')
  } catch (_) {
    message.error('复制失败')
  }
}

// 当全局连接状态变为未连接时，确保余额默认不显示
watch(() => blockchainStore.connected, (isConnected) => {
  if (!isConnected) {
    showBalance.value = false
  }
})

const queryBalance = async () => {
  loadingBalance.value = true
  try {
    const result = await blockchainStore.refreshBalance()
    if (result.success) {
      showBalance.value = true
      message.success('余额已获取')
    } else {
      message.error(result.message || '获取失败')
    }
  } catch (error) {
    message.error('获取失败：' + error.message)
  } finally {
    loadingBalance.value = false
  }
}

const refreshBalance = async () => {
  loadingBalance.value = true
  try {
    const result = await blockchainStore.refreshBalance()
    if (result.success) {
      message.success('余额已刷新')
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('刷新失败：' + error.message)
  } finally {
    loadingBalance.value = false
  }
}

// 手动打开 MetaMask 的方法
const openMetaMask = () => {
  // 尝试通过扩展 ID 打开 MetaMask
  if (window.ethereum) {
    // 发送一个简单的请求来激活 MetaMask
    window.ethereum.request({ method: 'eth_accounts' })
      .then(() => {
        message.info('请在 MetaMask 扩展中查看连接请求')
      })
      .catch(() => {
        message.error('无法打开 MetaMask，请手动点击浏览器右上角的 MetaMask 图标')
      })
  } else {
    message.error('MetaMask 未安装')
  }
}
</script>

<style scoped>
.wallet-connector {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 32px 24px;
  margin-bottom: 24px;
  text-align: center;
}

.connector-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.connector-header p {
  margin: 0 0 24px;
  opacity: 0.9;
  font-size: 16px;
}

.connect-btn {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.connect-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.connected-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.wallet-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-tag {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 16px;
}

.account-address {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.wallet-details {
  display: flex;
  gap: 24px;
  align-items: center;
}

.balance-info, .network-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-label, .network-label {
  font-size: 12px;
  opacity: 0.8;
}

.balance-value, .network-value {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.wallet-actions {
  display: flex;
  gap: 12px;
}

.wallet-actions .ant-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.wallet-actions .ant-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.wallet-actions .ant-btn.ant-btn-dangerous {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.wallet-actions .ant-btn.ant-btn-dangerous:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

.connector-footer {
  margin-top: 24px;
  opacity: 0.8;
  font-size: 14px;
}

@media (max-width: 768px) {
  .wallet-details {
    flex-direction: column;
    gap: 16px;
  }
  
  .wallet-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .wallet-actions .ant-btn {
    width: 100%;
  }
}
</style>
