<template>
  <div class="subscription-nft-widget">
    <div class="widget-header">
      <h3>订阅 NFT</h3>
      <div class="fee-info" v-if="feeInfo.success">
        <span>费率: {{ feeInfo.feeEth }} ETH/分钟</span>
      </div>
    </div>

    <!-- 连接钱包提示 -->
    <div v-if="!blockchain.connected" class="connect-prompt">
      <p>请先连接钱包以使用 NFT 功能</p>
      <button @click="handleConnect" :disabled="connecting">
        {{ connecting ? '连接中...' : '连接钱包' }}
      </button>
    </div>

    <!-- 主功能区 -->
    <div v-else class="nft-actions">
      <!-- 铸造 NFT -->
      <div class="action-section">
        <h4>铸造订阅 NFT</h4>
        <div class="mint-form">
          <label>
            订阅时长（分钟）:
            <input 
              type="number" 
              v-model="mintMinutes" 
              min="1" 
              max="10080"
              placeholder="输入分钟数"
            />
          </label>
          <div class="cost-display" v-if="mintCost">
            <span>费用: {{ mintCost }} ETH</span>
          </div>
          <button 
            @click="handleMint" 
            :disabled="minting || !mintMinutes || mintMinutes < 1"
            class="mint-btn"
          >
            {{ minting ? '铸造中...' : '铸造 NFT' }}
          </button>
        </div>
      </div>

      <!-- NFT 管理 -->
      <div class="action-section">
        <h4>管理已有 NFT</h4>
        <div class="manage-form">
          <label>
            Token ID:
            <input 
              type="number" 
              v-model="tokenId" 
              min="1"
              placeholder="输入 Token ID"
            />
          </label>
          
          <div class="nft-info" v-if="tokenId && nftInfo">
            <div v-if="nftInfo.success">
              <p><strong>拥有者:</strong> {{ nftInfo.owner }}</p>
              <p><strong>状态:</strong> 
                <span :class="nftInfo.isActive ? 'active' : 'expired'">
                  {{ nftInfo.isActive ? '有效' : '已过期' }}
                </span>
              </p>
              <p><strong>到期时间:</strong> {{ nftInfo.expiresAtDate }}</p>
            </div>
            <div v-else class="error">{{ nftInfo.message }}</div>
          </div>

          <div class="action-buttons">
            <button @click="handleCheckNFT" :disabled="!tokenId || checking">
              {{ checking ? '查询中...' : '查询 NFT' }}
            </button>
            
            <div class="renew-section" v-if="tokenId">
              <label>
                续费时长（分钟）:
                <input 
                  type="number" 
                  v-model="renewMinutes" 
                  min="1" 
                  max="10080"
                  placeholder="输入分钟数"
                />
              </label>
              <div class="cost-display" v-if="renewCost">
                <span>费用: {{ renewCost }} ETH</span>
              </div>
              <button 
                @click="handleRenew" 
                :disabled="renewing || !renewMinutes || renewMinutes < 1"
                class="renew-btn"
              >
                {{ renewing ? '续费中...' : '续费' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理员功能 -->
      <div class="action-section admin-section" v-if="isAdmin">
        <h4>管理员功能</h4>
        <button @click="handleWithdraw" :disabled="withdrawing" class="withdraw-btn">
          {{ withdrawing ? '提取中...' : '提取收益' }}
        </button>
      </div>
    </div>

    <!-- 交易结果显示 -->
    <div v-if="lastResult" class="result-display" :class="lastResult.success ? 'success' : 'error'">
      <p>{{ lastResult.message }}</p>
      <div v-if="lastResult.success && lastResult.transactionHash" class="tx-hash">
        <small>交易哈希: {{ lastResult.transactionHash }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { ethers } from 'ethers'

const blockchain = useBlockchainStore()

// 响应式数据
const connecting = ref(false)
const minting = ref(false)
const renewing = ref(false)
const checking = ref(false)
const withdrawing = ref(false)

const mintMinutes = ref(60) // 默认1小时
const renewMinutes = ref(60)
const tokenId = ref('')

const feeInfo = ref({})
const nftInfo = ref(null)
const lastResult = ref(null)

// 计算属性
const mintCost = computed(() => {
  if (!mintMinutes.value || !feeInfo.value.success) return null
  const costWei = BigInt(feeInfo.value.feeWei) * BigInt(mintMinutes.value)
  return ethers.formatEther(costWei)
})

const renewCost = computed(() => {
  if (!renewMinutes.value || !feeInfo.value.success) return null
  const costWei = BigInt(feeInfo.value.feeWei) * BigInt(renewMinutes.value)
  return ethers.formatEther(costWei)
})

const isAdmin = computed(() => {
  // 简单判断：如果用户地址与部署者地址相同则为管理员
  // 实际项目中可以通过合约的 feeCollector() 方法获取
  return blockchain.account && blockchain.account.toLowerCase() === '0x你的部署者地址'.toLowerCase()
})

// 监听器
watch(() => blockchain.connected, async (connected) => {
  if (connected) {
    await loadFeeInfo()
  }
})

watch(tokenId, () => {
  nftInfo.value = null
})

// 方法
const handleConnect = async () => {
  connecting.value = true
  try {
    const result = await blockchain.connectWallet()
    if (!result.success) {
      lastResult.value = { success: false, message: result.message }
    } else {
      // 初始化合约
      const initResult = await blockchain.initializeContracts()
      if (!initResult.success) {
        lastResult.value = { success: false, message: `合约初始化失败: ${initResult.message}` }
        return
      }
      await loadFeeInfo()
    }
  } catch (error) {
    lastResult.value = { success: false, message: error.message }
  } finally {
    connecting.value = false
  }
}

const loadFeeInfo = async () => {
  try {
    feeInfo.value = await blockchain.getNFTFeePerMinute()
  } catch (error) {
    console.error('加载费用信息失败:', error)
  }
}

const handleMint = async () => {
  minting.value = true
  lastResult.value = null
  
  try {
    const paymentWei = BigInt(feeInfo.value.feeWei) * BigInt(mintMinutes.value)
    const result = await blockchain.mintSubscriptionNFT(paymentWei.toString())
    
    if (result.success) {
      lastResult.value = {
        success: true,
        message: `NFT 铸造成功！Token ID: ${result.tokenId}`,
        transactionHash: result.transactionHash
      }
      // 自动设置 tokenId 以便查看
      tokenId.value = result.tokenId?.toString() || ''
    } else {
      lastResult.value = { success: false, message: result.message }
    }
  } catch (error) {
    lastResult.value = { success: false, message: error.message }
  } finally {
    minting.value = false
  }
}

const handleCheckNFT = async () => {
  if (!tokenId.value) return
  
  checking.value = true
  try {
    const [ownerResult, activeResult, expiresResult] = await Promise.all([
      blockchain.getNFTOwner(tokenId.value),
      blockchain.isNFTActive(tokenId.value),
      blockchain.getNFTExpiresAt(tokenId.value)
    ])
    
    if (ownerResult.success && activeResult.success && expiresResult.success) {
      nftInfo.value = {
        success: true,
        owner: ownerResult.owner,
        isActive: activeResult.isActive,
        expiresAt: expiresResult.expiresAt,
        expiresAtDate: expiresResult.expiresAtDate.toLocaleString()
      }
    } else {
      nftInfo.value = {
        success: false,
        message: ownerResult.message || activeResult.message || expiresResult.message
      }
    }
  } catch (error) {
    nftInfo.value = { success: false, message: error.message }
  } finally {
    checking.value = false
  }
}

const handleRenew = async () => {
  if (!tokenId.value || !renewMinutes.value) return
  
  renewing.value = true
  lastResult.value = null
  
  try {
    const paymentWei = BigInt(feeInfo.value.feeWei) * BigInt(renewMinutes.value)
    const result = await blockchain.renewSubscriptionNFT(tokenId.value, paymentWei.toString())
    
    if (result.success) {
      lastResult.value = {
        success: true,
        message: `NFT 续费成功！`,
        transactionHash: result.transactionHash
      }
      // 重新查询 NFT 信息
      await handleCheckNFT()
    } else {
      lastResult.value = { success: false, message: result.message }
    }
  } catch (error) {
    lastResult.value = { success: false, message: error.message }
  } finally {
    renewing.value = false
  }
}

const handleWithdraw = async () => {
  withdrawing.value = true
  lastResult.value = null
  
  try {
    const result = await blockchain.withdrawNFTFees()
    
    if (result.success) {
      lastResult.value = {
        success: true,
        message: '收益提取成功！',
        transactionHash: result.transactionHash
      }
    } else {
      lastResult.value = { success: false, message: result.message }
    }
  } catch (error) {
    lastResult.value = { success: false, message: error.message }
  } finally {
    withdrawing.value = false
  }
}

// 生命周期
onMounted(async () => {
  if (blockchain.connected) {
    // 确保合约已初始化
    await blockchain.initializeContracts()
    await loadFeeInfo()
  }
})
</script>

<style scoped>
.subscription-nft-widget {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.widget-header h3 {
  margin: 0;
  color: #333;
}

.fee-info {
  font-size: 14px;
  color: #666;
}

.connect-prompt {
  text-align: center;
  padding: 40px 20px;
}

.connect-prompt button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.connect-prompt button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.action-section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-section h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.mint-form, .manage-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mint-form label, .manage-form label {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mint-form input, .manage-form input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.cost-display {
  font-weight: bold;
  color: #007bff;
}

.mint-btn, .renew-btn {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.mint-btn:disabled, .renew-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.nft-info {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  margin: 10px 0;
}

.nft-info .active {
  color: #28a745;
  font-weight: bold;
}

.nft-info .expired {
  color: #dc3545;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-buttons button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.renew-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.admin-section {
  border-left: 4px solid #ffc107;
}

.withdraw-btn {
  padding: 10px 20px;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.withdraw-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-display {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.result-display.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result-display.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.tx-hash {
  margin-top: 10px;
  word-break: break-all;
  font-family: monospace;
}

.error {
  color: #dc3545;
}
</style>
