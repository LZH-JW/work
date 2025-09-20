<template>
  <div class="subscription-manager">
    <h2>订阅管理</h2>
    
    <!-- 铸造订阅按钮 -->
    <div class="action-section">
      <button 
        @click="mintSubscription" 
        :disabled="isProcessing"
        class="btn mint-btn"
      >
        {{ isProcessing && actionType === 'mint' ? '处理中...' : '铸造订阅 NFT' }}
      </button>
      <p class="help-text">费用: 0.001 ETH/分钟</p>
    </div>

    <!-- 续费订阅 -->
    <div class="action-section" v-if="userTokenId">
      <input 
        v-model="tokenIdInput" 
        placeholder="输入 Token ID" 
        class="token-input"
      />
      <button 
        @click="renewSubscription" 
        :disabled="isProcessing"
        class="btn renew-btn"
      >
        {{ isProcessing && actionType === 'renew' ? '续费中...' : '续费订阅' }}
      </button>
    </div>

    <!-- 检查订阅状态 -->
    <div class="action-section">
      <input 
        v-model="checkTokenId" 
        placeholder="输入 Token ID 检查状态" 
        class="token-input"
      />
      <button 
        @click="checkSubscriptionStatus" 
        :disabled="isChecking"
        class="btn check-btn"
      >
        {{ isChecking ? '检查中...' : '检查状态' }}
      </button>
      <p v-if="subscriptionStatus !== null" class="status-text">
        订阅状态: {{ subscriptionStatus ? '有效' : '无效' }}
      </p>
    </div>

    <!-- 提取收益 (仅限合约所有者) -->
    <div class="action-section" v-if="isOwner">
      <button 
        @click="withdrawFunds" 
        :disabled="isProcessing"
        class="btn withdraw-btn"
      >
        {{ isProcessing && actionType === 'withdraw' ? '提取中...' : '提取收益' }}
      </button>
    </div>

    <!-- 交易状态显示 -->
    <div v-if="transactionHash" class="transaction-info">
      <p>交易已发送: {{ transactionHash }}</p>
      <a 
        :href="`https://etherscan.io/tx/${transactionHash}`" 
        target="_blank"
        class="etherscan-link"
      >
        在 Etherscan 上查看
      </a>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { ethers } from 'ethers'

// 状态变量
const blockchainStore = useBlockchainStore()
const isProcessing = ref(false)
const isChecking = ref(false)
const actionType = ref('')
const transactionHash = ref('')
const error = ref('')
const subscriptionStatus = ref(null)
const tokenIdInput = ref('')
const checkTokenId = ref('')
const userTokenId = ref('')
const isOwner = ref(false)

// 铸造订阅
const mintSubscription = async () => {
  try {
    error.value = ''
    isProcessing.value = true
    actionType.value = 'mint'
    
    const tx = await blockchainStore.contracts.nft.mint({
      value: ethers.utils.parseEther("0.001")
    })
    
    transactionHash.value = tx.hash
    await tx.wait()
    
    // 获取铸造的 token ID (需要监听事件或通过其他方式获取)
    console.log('Mint successful:', tx)
  } catch (err) {
    error.value = `铸造失败: ${err.message}`
    console.error(err)
  } finally {
    isProcessing.value = false
    actionType.value = ''
  }
}

// 续费订阅
const renewSubscription = async () => {
  if (!tokenIdInput.value) {
    error.value = '请输入 Token ID'
    return
  }
  
  try {
    error.value = ''
    isProcessing.value = true
    actionType.value = 'renew'
    
    const tx = await blockchainStore.contracts.nft.renew(tokenIdInput.value, {
      value: ethers.utils.parseEther("0.001")
    })
    
    transactionHash.value = tx.hash
    await tx.wait()
    
    console.log('Renew successful:', tx)
  } catch (err) {
    error.value = `续费失败: ${err.message}`
    console.error(err)
  } finally {
    isProcessing.value = false
    actionType.value = ''
  }
}

// 检查订阅状态
const checkSubscriptionStatus = async () => {
  if (!checkTokenId.value) {
    error.value = '请输入 Token ID'
    return
  }
  
  try {
    error.value = ''
    isChecking.value = true
    subscriptionStatus.value = null
    
    const isActive = await blockchainStore.contracts.nft.isActive(checkTokenId.value)
    subscriptionStatus.value = isActive
    
  } catch (err) {
    error.value = `检查状态失败: ${err.message}`
    console.error(err)
  } finally {
    isChecking.value = false
  }
}

// 提取收益
const withdrawFunds = async () => {
  try {
    error.value = ''
    isProcessing.value = true
    actionType.value = 'withdraw'
    
    const tx = await blockchainStore.contracts.nft.withdraw()
    
    transactionHash.value = tx.hash
    await tx.wait()
    
    console.log('Withdraw successful:', tx)
  } catch (err) {
    error.value = `提取失败: ${err.message}`
    console.error(err)
  } finally {
    isProcessing.value = false
    actionType.value = ''
  }
}

// 检查是否为合约所有者 (简化版)
const checkOwnership = async () => {
  try {
    // 这里需要根据实际合约实现来判断所有者
    // 仅作示例展示
    isOwner.value = false
  } catch (err) {
    console.log('无法验证所有者身份')
  }
}

onMounted(() => {
  checkOwnership()
})
</script>

<style scoped>
.subscription-manager {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.action-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mint-btn {
  background-color: #4CAF50;
  color: white;
}

.mint-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.renew-btn {
  background-color: #2196F3;
  color: white;
}

.renew-btn:hover:not(:disabled) {
  background-color: #1976D2;
}

.check-btn {
  background-color: #FF9800;
  color: white;
}

.check-btn:hover:not(:disabled) {
  background-color: #F57C00;
}

.withdraw-btn {
  background-color: #f44336;
  color: white;
}

.withdraw-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.token-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
  width: 200px;
}

.help-text {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.status-text {
  margin-top: 10px;
  font-weight: bold;
}

.transaction-info {
  background-color: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
}

.etherscan-link {
  color: #1976D2;
  text-decoration: none;
}

.etherscan-link:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
}
</style>