<template>
  <div class="blockchain-connector">
    <!-- Logo 在左上角（始终显示） -->
    <div class="logo-corner">
      <div class="logo-icon">
        <LinkOutlined />
      </div>
    </div>

    <!-- 未连接状态 -->
    <div v-if="!connected" class="disconnected-layout">
      
      <div class="disconnect-content">
        <div class="status-indicator offline">
          <div class="indicator-dot"></div>
          <span class="status-text">未连接</span>
        </div>
        
        <a-button 
          type="primary" 
          size="large" 
          @click="requestConnection" 
          :loading="connecting"
          class="connect-button"
        >
          <WalletOutlined />
          连接 MetaMask 钱包
        </a-button>
      </div>
    </div>

    <!-- 已连接状态 -->
    <div v-else class="connected-layout">
      <!-- 第一行：连接状态居中 -->
      <div class="status-row">
        <div class="status-indicator online">
          <div class="indicator-dot"></div>
          <span class="status-text">已连接</span>
        </div>
      </div>

      <!-- 第二行：账户信息和网络信息 -->
      <div class="info-row">
        <!-- 当前账户信息 -->
        <div class="account-section">
          <label class="info-label">当前账户</label>
          <div class="account-display">
            <a-tag 
              color="blue" 
              class="account-tag-full clickable"
              @click="copyAccount"
              title="点击复制地址"
            >
              {{ account }}
            </a-tag>
          </div>
        </div>

        <!-- 网络信息（可切换） -->
        <div class="network-section">
          <label class="info-label">网络</label>
          <a-dropdown placement="bottomCenter">
            <a-button type="default" class="network-tag">
              <GlobalOutlined />
              {{ networkName }}
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu class="network-menu">
                <div class="menu-header">切换网络</div>
                <a-menu-item 
                  v-for="net in availableNetworks" 
                  :key="net.chainIdHex" 
                  @click="onSwitchNetwork(net)"
                >
                  <div class="network-menu-item">
                    <span class="network-name">{{ net.name }}</span>
                    <span class="network-id">({{ net.chainId }})</span>
                  </div>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>

      <!-- 第二行：操作按钮 -->
      <div class="actions-row">
        <!-- 切换账户按钮 -->
        <a-dropdown placement="bottomLeft">
          <a-button 
            :loading="switching"
            class="switch-btn"
            type="default"
          >
            <UserSwitchOutlined />
            切换账户
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu class="account-menu">
              <div class="menu-header">选择账户</div>
              <a-menu-item 
                v-for="acc in availableAccounts" 
                :key="acc.address"
                @click="onAccountChange(acc.address)"
                :class="{ 'active-account': acc.address === account }"
              >
                <div class="account-menu-item">
                  <div class="account-info-left">
                    <span class="account-name">{{ acc.name }}</span>
                    <span class="account-address">{{ formatAddress(acc.address) }}</span>
                  </div>
                  <span class="account-balance">{{ acc.balance }} ETH</span>
                </div>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <!-- 余额查询 -->
        <a-button 
          @click="queryBalance" 
          :loading="loadingBalance"
          class="balance-btn"
          type="default"
        >
          <EyeOutlined />
          查询余额
        </a-button>

        <!-- 常见问题解决方法 -->
        <a-dropdown placement="bottomCenter">
          <a-button 
            class="help-btn"
            type="default"
          >
            <QuestionCircleOutlined />
            常见问题解决方法
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu class="help-menu">
              <div class="help-header">常见问题解决方案</div>
              
              <a-menu-item key="metamask-not-found" @click="handleTroubleshoot('metamask-not-found')">
                <div class="help-item-content">
                  <ExclamationCircleOutlined />
                  <div class="help-text">
                    <span class="help-title">MetaMask 未安装</span>
                    <span class="help-desc">检测和安装 MetaMask 钱包扩展</span>
                  </div>
                </div>
              </a-menu-item>
              
              <a-menu-item key="metamask-locked" @click="handleTroubleshoot('metamask-locked')">
                <div class="help-item-content">
                  <LockOutlined />
                  <div class="help-text">
                    <span class="help-title">MetaMask 已锁定</span>
                    <span class="help-desc">解锁钱包并重新连接</span>
                  </div>
                </div>
              </a-menu-item>
              
              <a-menu-item key="network-mismatch" @click="handleTroubleshoot('network-mismatch')">
                <div class="help-item-content">
                  <GlobalOutlined />
                  <div class="help-text">
                    <span class="help-title">网络不匹配</span>
                    <span class="help-desc">切换到正确的区块链网络</span>
                  </div>
                </div>
              </a-menu-item>
              
              <a-menu-item key="connection-rejected" @click="handleTroubleshoot('connection-rejected')">
                <div class="help-item-content">
                  <CloseCircleOutlined />
                  <div class="help-text">
                    <span class="help-title">连接被拒绝</span>
                    <span class="help-desc">重新授权连接请求</span>
                  </div>
                </div>
              </a-menu-item>
              
            </a-menu>
          </template>
        </a-dropdown>

        <!-- 断开连接 -->
        <a-dropdown placement="bottomRight">
          <a-button danger class="disconnect-btn">
            <DisconnectOutlined />
            断开连接
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu class="disconnect-menu">
              <a-menu-item key="local" @click="disconnectLocal">
                <div class="menu-item-content">
                  <DisconnectOutlined />
                  <div class="menu-text">
                    <span class="menu-title">仅断开前端</span>
                    <span class="menu-desc">快速清理，保持 MetaMask 连接</span>
                  </div>
                </div>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="complete" @click="disconnectComplete">
                <div class="menu-item-content">
                  <LogoutOutlined />
                  <div class="menu-text">
                    <span class="menu-title">彻底断开 MetaMask</span>
                    <span class="menu-desc">尝试撤销权限或引导手动断开</span>
                  </div>
                </div>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 余额弹窗显示 -->
    <a-modal
      v-model:open="showBalanceModal"
      title="账户余额"
      :footer="null"
      width="300px"
      centered
      class="balance-modal"
    >
      <div class="balance-modal-content">
        <a-statistic
          :value="balance"
          suffix="ETH"
          :precision="4"
          class="modal-balance"
        />
        <p class="modal-account">{{ formatAddress(account) }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ethers } from 'ethers'
import { useBlockchainStore } from '@/stores/blockchain'
import {
  WalletOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  UserSwitchOutlined,
  CopyOutlined,
  ReloadOutlined,
  DownOutlined,
  LogoutOutlined,
  LinkOutlined,
  GlobalOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'

// 响应式数据
const connected = ref(false)
const connecting = ref(false)
const switching = ref(false)
const loadingBalance = ref(false)
const showBalance = ref(false)
const showBalanceModal = ref(false)
const account = ref('')
const balance = ref('0')
const networkName = ref('localhost')
const availableAccounts = ref([])
const availableNetworks = ref([
  { name: 'Sepolia', chainId: 11155111, chainIdHex: '0xaa36a7', rpcUrls: ['https://sepolia.infura.io/v3/'], currency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 } },
  { name: 'Chain 1337', chainId: 1337, chainIdHex: '0x539', rpcUrls: ['http://127.0.0.1:8545'], currency: { name: 'ETH', symbol: 'ETH', decimals: 18 } },
  { name: 'Polygon Amoy', chainId: 80002, chainIdHex: '0x13882', rpcUrls: ['https://rpc-amoy.polygon.technology'], currency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } }
])

// 与全局区块链存储同步（用于订阅 NFT 管理等组件）
const blockchain = useBlockchainStore()

// 当本组件账户变化时，同步到全局 store（仅同步地址，不修改连接状态）
watch(account, (newAccount) => {
  if (newAccount) {
    if (blockchain.account !== newAccount) blockchain.account = newAccount
  } else if (blockchain.account) {
    blockchain.account = ''
  }
})

// 当全局 store 账户变化（例如其他连接器触发）时，回填到本组件
watch(() => blockchain.account, (storeAccount) => {
  if (storeAccount !== account.value) {
    account.value = storeAccount || ''
  }
})

// 格式化地址
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// 检查 MetaMask 是否可用
const checkMetaMask = () => {
  if (!window.ethereum) {
    message.error('请安装 MetaMask 钱包扩展')
    return false
  }
  return true
}

// 请求连接 MetaMask
const requestConnection = async () => {
  if (!checkMetaMask()) return
  
  connecting.value = true
  
  try {
    console.log('开始请求 MetaMask 连接...')
    
    // 这个调用会强制弹出 MetaMask 扩展窗口
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    console.log('获取到账户:', accounts)
    
    if (!accounts || accounts.length === 0) {
      throw new Error('未获取到账户')
    }

    // 设置主账户
    account.value = accounts[0]
    
    // 创建 provider
    const provider = new ethers.BrowserProvider(window.ethereum)
    
    // 不自动显示余额，让用户点击查询
    showBalance.value = false
    balance.value = '0'
    
    // 获取所有可用账户的信息
    await loadAllAccounts(provider)
    
    // 获取网络信息
    const network = await provider.getNetwork()
    networkName.value = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name
    
    connected.value = true
    
    message.success('MetaMask 连接成功！')
    console.log('连接成功，主账户:', account.value)
    console.log('可用账户:', availableAccounts.value.length)
    
  } catch (error) {
    console.error('连接失败:', error)
    
    if (error.code === 4001) {
      message.info('用户取消了连接请求')
    } else if (error.code === -32002) {
      message.warning('请在 MetaMask 中处理待确认的请求')
    } else {
      message.error(`连接失败: ${error.message}`)
    }
  } finally {
    connecting.value = false
  }
}

// 加载所有可用账户
const loadAllAccounts = async (provider) => {
  try {
    // 获取所有已连接的账户
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    
    if (!accounts || accounts.length === 0) {
      availableAccounts.value = []
      return
    }
    
    console.log('加载所有账户:', accounts)
    
    // 为每个账户获取余额和名称
    const accountsWithInfo = []
    
    for (let i = 0; i < accounts.length; i++) {
      const address = accounts[i]
      try {
        const bal = await provider.getBalance(address)
        const balanceEth = ethers.formatEther(bal)
        
        accountsWithInfo.push({
          address: address,
          name: `Account ${i + 1} (${formatAddress(address)})`,
          balance: parseFloat(balanceEth).toFixed(4)
        })
      } catch (error) {
        console.error(`获取账户 ${address} 余额失败:`, error)
        accountsWithInfo.push({
          address: address,
          name: `Account ${i + 1} (${formatAddress(address)})`,
          balance: '0.0000'
        })
      }
    }
    
    availableAccounts.value = accountsWithInfo
    console.log('账户信息加载完成:', accountsWithInfo)
    
  } catch (error) {
    console.error('加载账户列表失败:', error)
    availableAccounts.value = []
  }
}

// 账户切换处理
const onAccountChange = async (selectedAddress) => {
  if (!selectedAddress || selectedAddress === account.value) {
    return
  }
  
  switching.value = true
  
  try {
    const oldAccount = account.value
    console.log('切换账户:', { from: oldAccount, to: selectedAddress })
    
    // 更新当前账户
    account.value = selectedAddress
    
    // 如果当前显示余额，则更新余额
    if (showBalance.value) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const bal = await provider.getBalance(selectedAddress)
      balance.value = ethers.formatEther(bal)
    } else {
      // 如果没有显示余额，重置为0
      balance.value = '0'
    }
    
    // 找到对应的账户信息
    const accountInfo = availableAccounts.value.find(acc => acc.address === selectedAddress)
    const accountName = accountInfo ? accountInfo.name : formatAddress(selectedAddress)
    
    message.success(`已切换到: ${accountName}`)
    console.log('账户切换完成:', selectedAddress)
    
  } catch (error) {
    console.error('切换账户失败:', error)
    message.error('切换失败: ' + error.message)
    
    // 恢复到原来的账户
    account.value = oldAccount
  } finally {
    switching.value = false
  }
}

// 复制账户地址
const copyAccount = async () => {
  try {
    if (!account.value) return
    await navigator.clipboard.writeText(account.value)
    message.success('地址已复制')
  } catch (_) {
    message.error('复制失败')
  }
}

// 查询余额（弹窗显示1秒）
const queryBalance = async () => {
  if (!account.value) return
  
  loadingBalance.value = true
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const bal = await provider.getBalance(account.value)
    balance.value = ethers.formatEther(bal)
    
    // 显示弹窗
    showBalanceModal.value = true
    
    // 1秒后自动关闭弹窗
    setTimeout(() => {
      showBalanceModal.value = false
    }, 1000)
    
    message.success('余额已获取')
  } catch (error) {
    message.error('获取余额失败: ' + error.message)
  } finally {
    loadingBalance.value = false
  }
}

// 刷新余额
const refreshBalance = async () => {
  if (!account.value) return
  
  loadingBalance.value = true
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const bal = await provider.getBalance(account.value)
    balance.value = ethers.formatEther(bal)
    
    // 同时更新账户列表中的余额
    await loadAllAccounts(provider)
    
    message.success('余额已刷新')
  } catch (error) {
    message.error('刷新余额失败: ' + error.message)
  } finally {
    loadingBalance.value = false
  }
}

// 切换网络
const onSwitchNetwork = async (net) => {
  try {
    if (!window.ethereum) throw new Error('MetaMask 未检测到')
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: net.chainIdHex }]
    })
    // 成功后更新显示
    const provider = new ethers.BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()
    networkName.value = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name
    message.success(`已切换到 ${net.name}`)
  } catch (err) {
    // 4902: 未添加到 MetaMask
    if (err?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: net.chainIdHex,
            chainName: net.name,
            rpcUrls: net.rpcUrls,
            nativeCurrency: net.currency
          }]
        })
        message.success(`已添加并切换到 ${net.name}`)
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        networkName.value = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name
      } catch (e) {
        message.error(`添加网络失败: ${e.message}`)
      }
    } else if (err?.code === 4001) {
      message.info('已取消切换网络')
    } else {
      message.error(`切换网络失败: ${err?.message || err}`)
    }
  }
}

// 仅断开前端连接
const disconnectLocal = () => {
  // 清理本地状态，但保持 MetaMask 连接
  connected.value = false
  account.value = ''
  balance.value = '0'
  showBalance.value = false
  networkName.value = 'localhost'
  availableAccounts.value = []
  
  message.success('前端已断开连接')
  console.log('本地连接状态已清理，MetaMask 连接保持')
}

// 彻底断开 MetaMask 连接
const disconnectComplete = async () => {
  try {
    console.log('尝试彻底断开 MetaMask 连接...')
    
    // 方法1：尝试撤销网站权限
    try {
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      })
      
      console.log('成功撤销网站权限')
      message.success('已彻底断开 MetaMask 连接')
      
    } catch (revokeError) {
      console.log('自动撤销权限失败:', revokeError.code, revokeError.message)
      
      // 方法2：引导用户手动断开并打开 MetaMask
      message.warning('正在打开 MetaMask，请手动断开网站连接')
      
      try {
        // 打开 MetaMask
        await window.ethereum.request({ method: 'eth_accounts' })
        
        // 提供详细指导
        setTimeout(() => {
          message.info('在 MetaMask 中：右上角三点菜单 → 已连接的网站 → 找到此网站 → 断开连接', 5)
        }, 1000)
        
      } catch (openError) {
        console.log('无法打开 MetaMask:', openError)
        message.error('无法打开 MetaMask，请手动操作')
      }
    }
    
  } catch (error) {
    console.error('断开连接过程出错:', error)
    message.error('操作失败: ' + error.message)
  } finally {
    // 清理本地状态
    connected.value = false
    account.value = ''
    balance.value = '0'
    showBalance.value = false
    networkName.value = 'localhost'
    availableAccounts.value = []
    
    console.log('本地连接状态已清理')
  }
}

// 处理常见问题
const handleTroubleshoot = (type) => {
  switch (type) {
    case 'metamask-not-found':
      message.info('正在检测 MetaMask...')
      if (!window.ethereum) {
        message.error('MetaMask 未安装')
        // 显示详细解决步骤
        setTimeout(() => {
          message.info('解决步骤：1. 访问 MetaMask 官网', 3)
        }, 1000)
        setTimeout(() => {
          message.info('2. 点击 "Download" 下载浏览器扩展', 3)
        }, 2000)
        setTimeout(() => {
          message.info('3. 安装完成后刷新页面', 3)
        }, 3000)
        // 打开官网
        window.open('https://metamask.io/download/', '_blank')
      } else {
        message.success('MetaMask 已安装，请尝试重新连接')
      }
      break
      
    case 'metamask-locked':
      message.info('MetaMask 已锁定，需要解锁')
      // 显示解锁步骤
      setTimeout(() => {
        message.info('解决步骤：1. 点击浏览器工具栏中的 MetaMask 图标', 3)
      }, 1000)
      setTimeout(() => {
        message.info('2. 输入密码解锁钱包', 3)
      }, 2000)
      setTimeout(() => {
        message.info('3. 重新尝试连接', 3)
      }, 3000)
      
      // 尝试触发 MetaMask
      if (window.ethereum) {
        setTimeout(() => {
          window.ethereum.request({ method: 'eth_requestAccounts' })
            .catch(() => {
              message.warning('请手动打开 MetaMask 扩展并解锁')
            })
        }, 4000)
      }
      break
      
    case 'network-mismatch':
      message.info('检查网络设置...')
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_chainId' })
          .then(chainId => {
            const currentChainId = parseInt(chainId, 16)
            message.warning(`当前网络 Chain ID: ${currentChainId}`)
            
            // 显示网络切换步骤
            setTimeout(() => {
              message.info('解决步骤：1. 在 MetaMask 中点击网络下拉菜单', 3)
            }, 1000)
            setTimeout(() => {
              message.info('2. 选择正确的网络（如 Sepolia 测试网）', 3)
            }, 2000)
            setTimeout(() => {
              message.info('3. 如果没有目标网络，请手动添加', 3)
            }, 3000)
          })
          .catch(() => {
            message.error('无法获取网络信息，请检查 MetaMask 连接')
          })
      }
      break
      
    case 'connection-rejected':
      message.info('连接被拒绝，重新尝试授权...')
      // 显示重新连接步骤
      setTimeout(() => {
        message.info('解决步骤：1. 在 MetaMask 弹窗中点击 "连接"', 3)
      }, 1000)
      setTimeout(() => {
        message.info('2. 选择要连接的账户', 3)
      }, 2000)
      setTimeout(() => {
        message.info('3. 确认授权网站访问', 3)
      }, 3000)
      
      // 自动重新尝试连接
      if (window.ethereum) {
        setTimeout(() => {
          requestConnection()
        }, 4000)
      }
      break
      
    default:
      message.info('请选择具体的问题类型')
  }
}

// 检查现有连接
const checkExistingConnection = async () => {
  if (!checkMetaMask()) return
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    
    if (accounts && accounts.length > 0) {
      account.value = accounts[0]
      
      // 创建 provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // 不自动显示余额
      showBalance.value = false
      balance.value = '0'
      
      // 加载所有可用账户
      await loadAllAccounts(provider)
      
      // 获取网络信息
      const network = await provider.getNetwork()
      networkName.value = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name
      
      connected.value = true
      console.log('检测到现有连接:', account.value)
    }
  } catch (error) {
    console.log('检查现有连接失败:', error)
  }
}

// 监听 MetaMask 事件
const setupEventListeners = () => {
  if (!window.ethereum) return

  // 账户变化
  window.ethereum.on('accountsChanged', async (accounts) => {
    console.log('检测到账户变化:', accounts)
    
    if (accounts.length === 0) {
      disconnect()
    } else {
      const newAccount = accounts[0]
      const oldAccount = account.value
      
      // 更新账户
      account.value = newAccount
      
      // 重新获取账户列表，但不自动显示余额
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        
        // 只有在当前显示余额时才更新余额
        if (showBalance.value) {
          const bal = await provider.getBalance(newAccount)
          balance.value = ethers.formatEther(bal)
        }
        
        // 重新加载所有账户信息
        await loadAllAccounts(provider)
        
        if (oldAccount && newAccount.toLowerCase() !== oldAccount.toLowerCase()) {
          const accountInfo = availableAccounts.value.find(acc => acc.address === newAccount)
          const accountName = accountInfo ? accountInfo.name : formatAddress(newAccount)
          message.success(`账户已自动切换: ${formatAddress(oldAccount)} → ${accountName}`)
        }
        
        console.log('账户切换完成:', { from: oldAccount, to: newAccount })
      } catch (error) {
        console.error('更新账户信息失败:', error)
      }
    }
  })

  // 网络变化：在本页内刷新状态而不跳转
  window.ethereum.on('chainChanged', async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      networkName.value = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name
      // 若已显示余额则刷新一次
      if (showBalance.value && account.value) {
        const bal = await provider.getBalance(account.value)
        balance.value = ethers.formatEther(bal)
      }
      // 更新账户列表以确保显示正确余额
      await loadAllAccounts(provider)
      message.success('网络已切换')
    } catch (e) {
      console.error('处理 chainChanged 失败:', e)
    }
  })

  // 断开连接
  window.ethereum.on('disconnect', () => {
    disconnect()
  })
}

// 清理事件监听器
const removeEventListeners = () => {
  if (!window.ethereum) return
  
  window.ethereum.removeAllListeners('accountsChanged')
  window.ethereum.removeAllListeners('chainChanged')
  window.ethereum.removeAllListeners('disconnect')
}

// 生命周期
onMounted(() => {
  setupEventListeners()
  checkExistingConnection()
})

onUnmounted(() => {
  removeEventListeners()
})
</script>

<style scoped>
.blockchain-connector {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  min-height: 120px;
}

.blockchain-connector::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Logo 在左上角 */
.logo-corner {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 6px 24px rgba(79, 172, 254, 0.4);
  position: relative;
}

/* 未连接布局 */
.disconnected-layout {
  position: relative;
  z-index: 1;
  height: 100%;
}

.disconnect-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
  min-height: 80px;
}

/* 已连接布局 */
.connected-layout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 80px; /* 为放大的 logo 留出更多空间 */
}

/* 状态行 - 居中 */
.status-row {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

/* 信息行：账户和网络信息 - 左对齐 */
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  padding: 8px 0;
}

/* 操作按钮行 - 居中 */
.actions-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

/* 账户和网络信息区域 */
.account-section,
.network-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 未连接状态 */
.disconnected-state {
  text-align: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.offline .indicator-dot {
  background: #ff4d4f;
}

.online .indicator-dot {
  background: #52c41a;
}

.status-text {
  color: #ffffff;
  font-weight: 500;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.connect-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.connect-button {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  border-radius: 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 24px rgba(79, 172, 254, 0.4);
  transition: all 0.3s ease;
}

.connect-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(79, 172, 254, 0.6);
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.connect-tip {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0;
}

/* 账户和网络信息 */
.account-info,
.network-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 完整地址显示 - 可点击复制 */
.account-tag-full {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  padding: 8px 16px;
  background: rgba(79, 172, 254, 0.15);
  border: 1px solid rgba(79, 172, 254, 0.4);
  color: #4facfe;
  border-radius: 8px;
  min-width: 360px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.account-tag-full.clickable {
  cursor: pointer;
  user-select: none;
}

.account-tag-full.clickable:hover {
  background: rgba(79, 172, 254, 0.25);
  border-color: rgba(79, 172, 254, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.account-tag {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  padding: 4px 12px;
  background: rgba(79, 172, 254, 0.2);
  border: 1px solid rgba(79, 172, 254, 0.4);
  color: #4facfe;
}

.network-tag {
  background: rgba(82, 196, 26, 0.2);
  border: 1px solid rgba(82, 196, 26, 0.4);
  color: #52c41a;
}

.copy-btn {
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.3s ease;
}

.copy-btn:hover {
  color: #4facfe;
}

/* 操作区域 - 横向排列 */
.actions-section {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

/* 切换账户按钮 */
.switch-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
}

.switch-btn:hover {
  background: rgba(147, 51, 234, 0.2);
  border-color: rgba(147, 51, 234, 0.4);
  color: #9333ea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

/* 账户菜单 */
.account-menu {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 8px;
  min-width: 280px;
}

.menu-header {
  padding: 12px 16px;
  color: #9333ea;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(147, 51, 234, 0.1);
}

.account-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.account-info-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-name {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.account-address {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.account-balance {
  color: #4facfe;
  font-weight: 600;
  font-size: 13px;
}

.active-account {
  background: rgba(147, 51, 234, 0.2) !important;
}

.active-account .account-name {
  color: #9333ea;
}

.balance-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
}

.balance-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  color: #4facfe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.disconnect-btn {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.3);
  color: #ff6b6b;
  transition: all 0.3s ease;
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
}

.disconnect-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.5);
  color: #ff6b6b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

/* 帮助按钮 */
.help-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  height: 32px;
  border-radius: 6px;
  font-weight: 500;
}

.help-btn:hover {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.4);
  color: #ffc107;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

/* 帮助菜单 */
.help-menu {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  min-width: 320px;
}

.help-header {
  padding: 12px 16px;
  color: #ffc107;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 193, 7, 0.1);
}

.help-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.help-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.help-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.help-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

/* 断开连接菜单 */
.disconnect-menu {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.menu-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-title {
  color: #ffffff;
  font-weight: 500;
}

.menu-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

/* 余额弹窗 */
.balance-modal :deep(.ant-modal-content) {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 12px;
}

.balance-modal :deep(.ant-modal-header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.balance-modal :deep(.ant-modal-title) {
  color: #ffffff;
}

.balance-modal-content {
  text-align: center;
  padding: 20px 0;
}

.modal-balance {
  margin-bottom: 16px;
}

.modal-balance :deep(.ant-statistic-content) {
  color: #4facfe;
  font-size: 32px;
  font-weight: 700;
}

.modal-account {
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  margin: 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .blockchain-connector {
    padding: 16px;
  }
  
  .connected-layout {
    padding-left: 0;
    padding-top: 60px;
  }
  
  .logo-corner {
    top: 12px;
    left: 12px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .account-tag-full {
    min-width: auto;
    width: 100%;
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .actions-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .switch-btn,
  .balance-btn,
  .help-btn,
  .disconnect-btn {
    width: 100%;
  }
}

/* 动画效果 */
.status-card {
  transition: all 0.3s ease;
}

.connected-state {
  animation: fadeInUp 0.5s ease;
}

.disconnected-state {
  animation: fadeInDown 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 科技感光效 */
.logo-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #4facfe, #00f2fe, #4facfe);
  border-radius: 14px;
  z-index: -1;
  animation: rotate 3s linear infinite;
  opacity: 0.5;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
