<template>
  <div class="revenue-share-widget">
    <div class="widget-header">
      <h3>RevenueShare 分账合约</h3>
      <p>连接钱包 · 查询余额 · 一键收益领取</p>
    </div>

    <div class="widget-content">
      <!-- 合约地址输入 -->
      <div class="input-group">
        <a-input
          v-model:value="contractAddress"
          placeholder="输入 RevenueShare 合约地址"
          size="large"
          class="contract-input"
        />
        <a-button 
          type="primary" 
          size="large" 
          @click="queryBalance" 
          :loading="loadingBalance"
          class="query-btn"
        >
          查询余额
        </a-button>
      </div>
      
      <!-- 合约余额显示 -->
      <div class="balance-info" v-if="contractBalance">
        <div class="balance-card">
          <div class="balance-label">合约 ETH 余额</div>
          <div class="balance-value">{{ contractBalance }} ETH</div>
        </div>
      </div>

      <!-- 受益人操作 -->
      <div class="input-group">
        <a-input
          v-model:value="payeeAddress"
          placeholder="受益人地址（payee）"
          size="large"
          class="payee-input"
        />
        <a-button 
          type="primary" 
          size="large" 
          @click="releaseETH" 
          :loading="releasing"
          :disabled="!contractAddress || !payeeAddress"
          class="release-btn"
        >
          领取 ETH
        </a-button>
      </div>

      <!-- 可领取金额显示 -->
      <div class="releasable-info" v-if="releasableAmount">
        <a-alert 
          :message="`可领取金额：${releasableAmount} ETH`" 
          type="info" 
          show-icon 
        />
      </div>

      <!-- 交易信息 -->
      <div class="tx-info" v-if="lastTxHash">
        <a-alert type="success" show-icon>
          <template #message>
            <div>交易成功！</div>
            <div class="tx-hash">
              <span>交易哈希：</span>
              <a-button 
                type="link" 
                size="small" 
                @click="viewOnExplorer(lastTxHash)"
                style="padding: 0;"
              >
                {{ formatHash(lastTxHash) }}
              </a-button>
            </div>
          </template>
        </a-alert>
      </div>
    </div>

    <div class="widget-footer">
      <a-typography-text type="secondary">
        提示：请在 MetaMask 中切换到与你部署合约一致的网络
      </a-typography-text>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { ethers } from 'ethers'

const blockchainStore = useBlockchainStore()

// 响应式数据（默认读取环境变量与当前账户）
const contractAddress = ref(import.meta.env.VITE_CONTRACT_REVENUE_SHARE_ADDRESS || '')
const payeeAddress = ref('')
const contractBalance = ref('')
const releasableAmount = ref('')
const lastTxHash = ref('')
const loadingBalance = ref(false)
const releasing = ref(false)

// 格式化哈希显示
const formatHash = (hash) => {
  if (!hash) return ''
  return `${hash.substring(0, 10)}...`
}

const isValidContract = computed(() => {
  const addr = contractAddress.value?.trim()
  return !!addr && ethers.isAddress(addr)
})

// 查询合约余额
const queryBalance = async () => {
  if (!isValidContract.value) {
    message.warning('请输入合约地址')
    contractBalance.value = ''
    return
  }
  
  loadingBalance.value = true
  try {
    const result = await blockchainStore.getContractBalance(contractAddress.value)
    if (result.success) {
      contractBalance.value = result.balance
      message.success('余额查询成功')
    } else {
      message.error(result.message || '查询失败')
    }
  } catch (error) {
    message.error('查询失败：' + error.message)
  } finally {
    loadingBalance.value = false
  }
}

// 查询可领取金额
const queryReleasableAmount = async () => {
  if (!contractAddress.value || !payeeAddress.value) {
    releasableAmount.value = ''
    return
  }
  
  try {
    const result = await blockchainStore.getReleasableAmount(contractAddress.value, payeeAddress.value)
    if (result.success) {
      releasableAmount.value = result.amount
    }
  } catch (error) {
    console.error('查询可领取金额失败:', error)
  }
}

// 领取 ETH
const releaseETH = async () => {
  if (!contractAddress.value || !payeeAddress.value) {
    message.warning('请输入合约地址和受益人地址')
    return
  }
  
  releasing.value = true
  try {
    const result = await blockchainStore.releaseETH(contractAddress.value, payeeAddress.value)
    if (result.success) {
      message.success('ETH 领取成功！')
      lastTxHash.value = result.transactionHash
      // 刷新余额和可领取金额
      await queryBalance()
      await queryReleasableAmount()
    } else {
      message.error(result.message || '领取失败')
    }
  } catch (error) {
    message.error('领取失败：' + error.message)
  } finally {
    releasing.value = false
  }
}

// 在区块浏览器中查看
const viewOnExplorer = (hash) => {
  const network = import.meta.env.VITE_NETWORK || 'localhost'
  if (network === 'sepolia') {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')
  } else {
    message.info('请手动查看交易哈希：' + hash)
  }
}

// 监听地址变化，自动查询可领取金额；当合约地址无效时立刻隐藏余额
watch([contractAddress, payeeAddress], async () => {
  if (!isValidContract.value) {
    contractBalance.value = ''
  }
  await queryReleasableAmount()
}, { immediate: false })

// 当钱包断开连接时，自动清空分账合约地址及相关显示
watch(() => blockchainStore.connected, (isConnected) => {
  if (!isConnected) {
    contractAddress.value = ''
    payeeAddress.value = ''
    contractBalance.value = ''
    releasableAmount.value = ''
    lastTxHash.value = ''
  }
})

// 取消自动填充受益人地址：不再根据钱包地址自动写入输入框
</script>

<style scoped>
.revenue-share-widget {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.widget-header {
  padding: 24px 24px 0;
  text-align: center;
}

.widget-header h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.widget-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.widget-content {
  padding: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.input-group .ant-input {
  flex: 1;
}

.balance-info {
  margin-bottom: 16px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.balance-value {
  font-size: 24px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.releasable-info {
  margin-bottom: 16px;
}

.tx-info {
  margin-bottom: 16px;
}

.tx-hash {
  margin-top: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.widget-footer {
  padding: 16px 24px;
  background: #f8fafc;
  text-align: center;
  border-top: 1px solid #e2e8f0;
}

.query-btn, .release-btn {
  min-width: 100px;
}

.release-btn {
  background: #10b981;
  border-color: #10b981;
}

.release-btn:hover {
  background: #059669;
  border-color: #059669;
}

.release-btn:disabled {
  background: #d1d5db;
  border-color: #d1d5db;
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  
  .input-group .ant-input {
    margin-bottom: 8px;
  }
  
  .query-btn, .release-btn {
    width: 100%;
  }
}
</style>
