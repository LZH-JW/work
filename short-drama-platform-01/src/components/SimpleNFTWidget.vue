<template>
  <div class="simple-nft-widget">
    <h3>订阅 NFT 管理</h3>
    
    <!-- 连接状态 -->
    <div class="connection-status">
      <p v-if="!isConnected" class="disconnected">钱包未连接</p>
      <p v-else class="connected">
        已连接: {{ currentAccount.slice(0, 6) }}...{{ currentAccount.slice(-4) }}
      </p>
    </div>

    <!-- 连接钱包按钮 -->
    <button v-if="!isConnected" @click="connectWallet" :disabled="connecting">
      {{ connecting ? '连接中...' : '连接钱包' }}
    </button>

    <!-- NFT 操作区域 -->
    <div v-if="isConnected" class="nft-operations">
      <!-- 铸造 NFT -->
      <div class="operation-card">
        <h4>铸造 NFT</h4>
        <div class="form-group">
          <label>订阅分钟数:</label>
          <input v-model="mintMinutes" type="number" min="1" placeholder="输入分钟数" />
        </div>
        <div class="cost-info" v-if="mintMinutes">
          预计费用: {{ calculateCost(mintMinutes) }} ETH
        </div>
        <button @click="mintNFT" :disabled="!mintMinutes || minting">
          {{ minting ? '铸造中...' : '铸造 NFT' }}
        </button>
      </div>

      <!-- 管理 NFT -->
      <div class="operation-card">
        <h4>管理 NFT</h4>
        <div class="form-group">
          <label>Token ID:</label>
          <input v-model="tokenId" type="number" min="1" placeholder="输入 Token ID" />
        </div>
        <button @click="checkNFT" :disabled="!tokenId || checking">
          {{ checking ? '查询中...' : '查询状态' }}
        </button>
        
        <!-- 调试按钮 -->
        <button @click="checkNextTokenId" style="margin-left: 10px; background: #28a745;">
          查询下一个TokenID
        </button>
        
        <!-- NFT 信息显示 -->
        <div v-if="nftStatus" class="nft-status">
          <p><strong>Token ID:</strong> {{ nftStatus.tokenId }}</p>
          <p><strong>拥有者:</strong> {{ nftStatus.owner.slice(0, 6) }}...{{ nftStatus.owner.slice(-4) }}</p>
          <p><strong>状态:</strong> 
            <span :class="nftStatus.isActive ? 'active' : 'expired'">
              {{ nftStatus.isActive ? '有效' : '已过期' }}
            </span>
          </p>
          <p><strong>到期时间:</strong> {{ nftStatus.expiresAt }}</p>
        </div>

        <!-- 提示：SimpleNFT 不支持续费 -->
        <div v-if="nftStatus && nftStatus.tokenId" class="info-section">
          <p style="color: #666; font-size: 14px; margin-top: 15px;">
            💡 <strong>提示</strong>: 当前 SimpleNFT 合约不支持续费功能。NFT 到期后需要重新铸造。
          </p>
        </div>
      </div>
    </div>

    <!-- 结果显示 -->
    <div v-if="result" class="result" :class="result.success ? 'success' : 'error'">
      {{ result.message }}
      <div v-if="result.txHash" class="tx-hash">
        交易哈希: {{ result.txHash }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleNFTWidget',
  data() {
    return {
      connecting: false,
      minting: false,
      checking: false,
      mintMinutes: 60,
      tokenId: '',
      nftStatus: null,
      result: null,
      feePerMinute: '0.001', // 默认每分钟费用
      walletConnected: false,
      currentAccount: ''
    }
  },
  computed: {
    isConnected() {
      return this.walletConnected && this.currentAccount
    },
    account() {
      return this.currentAccount
    }
  },
  methods: {
    calculateCost(minutes) {
      return (parseFloat(this.feePerMinute) * minutes).toFixed(4)
    },

    async connectWallet() {
      this.connecting = true
      this.result = null
      
      try {
        if (!window.ethereum) {
          throw new Error('请安装 MetaMask')
        }

        // 请求连接账户
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })

        if (accounts.length === 0) {
          throw new Error('未找到账户')
        }

        // 检查网络
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== '0x539') { // 1337 的十六进制
          this.result = {
            success: false,
            message: '请切换到本地网络 (Chain ID: 1337)'
          }
          return
        }

        // 设置连接状态
        this.walletConnected = true
        this.currentAccount = accounts[0]
        
        this.result = {
          success: true,
          message: '钱包连接成功'
        }
        
      } catch (error) {
        this.result = {
          success: false,
          message: error.message || '连接失败'
        }
      } finally {
        this.connecting = false
      }
    },

    async mintNFT() {
      this.minting = true
      this.result = null

      try {
        if (!window.ethereum) {
          throw new Error('MetaMask 未连接')
        }

        // 直接使用 MetaMask 的简化调用
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length === 0) {
          throw new Error('请先连接钱包')
        }

        // 计算支付金额 (wei)
        const ethAmount = parseFloat(this.feePerMinute) * this.mintMinutes
        const weiAmount = '0x' + Math.floor(ethAmount * 1e18).toString(16)

        console.log('铸造参数:', {
          ethAmount,
          weiAmount,
          mintMinutes: this.mintMinutes
        })

        // 直接发送 ETH 到合约地址，触发 mint
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: '0x4c4d9A18479a82f143DF7c4E84864D56D6791E78',
            value: weiAmount,
            data: '0x1249c58b' // mint() 方法签名
          }]
        })

        this.result = {
          success: true,
          message: `NFT 铸造成功！订阅 ${this.mintMinutes} 分钟`,
          txHash
        }

      } catch (error) {
        console.error('铸造错误:', error)
        this.result = {
          success: false,
          message: error.message || '铸造失败'
        }
      } finally {
        this.minting = false
      }
    },

    async checkNFT() {
      this.checking = true
      this.nftStatus = null

      try {
        if (!window.ethereum) {
          throw new Error('MetaMask 未连接')
        }

        const contractAddress = '0x4c4d9A18479a82f143DF7c4E84864D56D6791E78'
        const tokenId = parseInt(this.tokenId)
        
        if (isNaN(tokenId) || tokenId < 1) {
          throw new Error('请输入有效的 Token ID（大于0的整数）')
        }

        console.log('查询 Token ID:', tokenId)

        // 使用简化的方法 - 直接查询到期时间
        // expiresAt(uint256) 的方法签名
        const tokenIdHex = tokenId.toString(16).padStart(64, '0')
        const expiresAtData = '0x76b6b186' + tokenIdHex
        
        console.log('调用数据:', expiresAtData)

        const expiresResult = await window.ethereum.request({
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: expiresAtData
          }, 'latest']
        })

        console.log('到期时间结果:', expiresResult)

        // 如果返回全零，说明 NFT 不存在
        if (!expiresResult || expiresResult === '0x' || expiresResult === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          throw new Error(`Token ID ${tokenId} 不存在`)
        }

        const expiresTimestamp = parseInt(expiresResult, 16)
        console.log('时间戳:', expiresTimestamp)

        if (expiresTimestamp === 0) {
          throw new Error(`Token ID ${tokenId} 不存在或未初始化`)
        }

        const expiresDate = new Date(expiresTimestamp * 1000)
        const currentTime = Math.floor(Date.now() / 1000)
        const isActive = expiresTimestamp > currentTime

        console.log('当前时间戳:', currentTime, '到期时间戳:', expiresTimestamp, '是否有效:', isActive)

        this.nftStatus = {
          isActive,
          expiresAt: expiresDate.toLocaleString(),
          tokenId: tokenId,
          owner: this.currentAccount // 简化：假设当前用户就是拥有者
        }

        // 清除之前的错误信息
        this.result = {
          success: true,
          message: `Token ID ${tokenId} 查询成功`
        }

      } catch (error) {
        console.error('查询错误:', error)
        this.result = {
          success: false,
          message: error.message
        }
        this.nftStatus = null
      } finally {
        this.checking = false
      }
    },


    // 调试方法：查询下一个Token ID
    async checkNextTokenId() {
      try {
        const contractAddress = '0x4c4d9A18479a82f143DF7c4E84864D56D6791E78'
        
        // 查询 _nextTokenId 的值（这是一个私有变量，可能无法直接访问）
        // 我们通过尝试不同的 Token ID 来找到有效的
        
        for (let id = 0; id <= 5; id++) {
          const tokenIdHex = id.toString(16).padStart(64, '0')
          const expiresAtData = '0x76b6b186' + tokenIdHex
          
          try {
            const result = await window.ethereum.request({
              method: 'eth_call',
              params: [{
                to: contractAddress,
                data: expiresAtData
              }, 'latest']
            })
            
            console.log(`Token ID ${id}:`, result)
            
            if (result && result !== '0x' && result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
              const timestamp = parseInt(result, 16)
              if (timestamp > 0) {
                this.result = {
                  success: true,
                  message: `找到有效的 Token ID: ${id} (到期时间戳: ${timestamp})`
                }
                // 自动填充找到的 Token ID
                this.tokenId = id.toString()
                return
              }
            }
          } catch (error) {
            console.log(`Token ID ${id} 查询失败:`, error.message)
          }
        }
        
        this.result = {
          success: false,
          message: '未找到任何有效的 Token ID (0-5)'
        }
        
      } catch (error) {
        this.result = {
          success: false,
          message: '查询失败: ' + error.message
        }
      }
    }
  },

  async mounted() {
    // 检查是否已经连接钱包
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          this.walletConnected = true
          this.currentAccount = accounts[0]
        }
      } catch (error) {
        console.log('检查钱包连接状态失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.simple-nft-widget {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.connection-status {
  margin-bottom: 15px;
}

.connected {
  color: #28a745;
  font-weight: bold;
}

.disconnected {
  color: #dc3545;
}

.operation-card {
  background: #f8f9fa;
  padding: 15px;
  margin: 15px 0;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.operation-card h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
}

.cost-info {
  margin: 10px 0;
  padding: 8px;
  background: #e3f2fd;
  border-radius: 4px;
  font-weight: bold;
  color: #1976d2;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px 0;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.nft-status {
  margin: 15px 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.active {
  color: #28a745;
  font-weight: bold;
}

.expired {
  color: #dc3545;
  font-weight: bold;
}

.renew-section {
  margin-top: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
}

.result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.tx-hash {
  margin-top: 10px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
</style>
