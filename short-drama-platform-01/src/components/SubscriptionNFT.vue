<template>
  <a-card title="订阅 NFT" class="subscription-card">
    <div class="subscription-actions">
      <a-button 
        type="primary" 
        @click="handleMint" 
        :disabled="!blockchainStore.connected || minting"
        :loading="minting"
      >
        铸造订阅 NFT
      </a-button>
      
      <a-button 
        @click="handleRenew" 
        :disabled="!blockchainStore.connected || !tokenIdInput || renewing"
        :loading="renewing"
      >
        续费订阅
      </a-button>
      
      <a-button 
        @click="handleCheckStatus" 
        :disabled="!blockchainStore.connected || !tokenIdInput || checking"
        :loading="checking"
      >
        检查状态
      </a-button>
      
      <a-input 
        v-model:value="tokenIdInput" 
        placeholder="Token ID" 
        style="width: 120px; margin-left: 10px;"
      />
    </div>
    
    <div v-if="subscriptionStatus !== null" class="subscription-status" style="margin-top: 16px;">
      <a-alert 
        :type="subscriptionStatus ? 'success' : 'error'" 
        :message="`订阅状态: ${subscriptionStatus ? '有效' : '已过期'}`"
        show-icon
      />
    </div>
    
    <div class="subscription-info" v-if="subscriptionInfo.tokenId" style="margin-top: 16px;">
      <a-descriptions title="订阅详情" :column="1" size="small">
        <a-descriptions-item label="Token ID">
          {{ subscriptionInfo.tokenId }}
        </a-descriptions-item>
        <a-descriptions-item label="到期时间">
          {{ subscriptionInfo.expiryTime }}
        </a-descriptions-item>
        <a-descriptions-item label="所有者">
          {{ formatAddress(subscriptionInfo.owner) }}
        </a-descriptions-item>
      </a-descriptions>
    </div>
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { ethers } from 'ethers'

const blockchainStore = useBlockchainStore()

// 状态变量
const minting = ref(false)
const renewing = ref(false)
const checking = ref(false)
const tokenIdInput = ref('')
const subscriptionStatus = ref(null)

const subscriptionInfo = reactive({
  tokenId: '',
  expiryTime: '',
  owner: ''
})

// 格式化地址显示
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

// 铸造订阅 NFT
const handleMint = async () => {
  if (!blockchainStore.contracts.nft) {
    message.error('NFT 合约未初始化')
    return
  }

  minting.value = true
  try {
    // 调用合约的 mint 方法，支付 0.001 ETH
    const tx = await blockchainStore.contracts.nft.mint({
      value: ethers.utils.parseEther("0.001")
    })
    
    message.info('交易已提交，等待确认...')
    const receipt = await tx.wait()
    
    // 获取新铸造的 token ID
    const transferEvent = receipt.events?.find(e => e.event === "Transfer")
    if (transferEvent) {
      const newTokenId = transferEvent.args.tokenId.toString()
      tokenIdInput.value = newTokenId
      message.success(`订阅 NFT 铸造成功! Token ID: ${newTokenId}`)
      
      // 获取订阅信息
      await fetchSubscriptionInfo(newTokenId)
    }
  } catch (error) {
    console.error('Mint error:', error)
    if (error.code === 'INSUFFICIENT_FUNDS') {
      message.error('余额不足，请确保钱包中有足够的 ETH')
    } else if (error.code === 'ACTION_REJECTED') {
      message.error('用户拒绝了交易')
    } else {
      message.error(`铸造失败: ${error.message || '未知错误'}`)
    }
  } finally {
    minting.value = false
  }
}

// 续费订阅
const handleRenew = async () => {
  if (!tokenIdInput.value) {
    message.warning('请输入 Token ID')
    return
  }

  if (!blockchainStore.contracts.nft) {
    message.error('NFT 合约未初始化')
    return
  }

  renewing.value = true
  try {
    // 调用合约的 renew 方法，支付 0.001 ETH
    const tx = await blockchainStore.contracts.nft.renew(tokenIdInput.value, {
      value: ethers.utils.parseEther("0.001")
    })
    
    message.info('续费交易已提交，等待确认...')
    await tx.wait()
    
    message.success('订阅续费成功!')
    
    // 更新订阅信息
    await fetchSubscriptionInfo(tokenIdInput.value)
  } catch (error) {
    console.error('Renew error:', error)
    if (error.code === 'INSUFFICIENT_FUNDS') {
      message.error('余额不足，请确保钱包中有足够的 ETH')
    } else if (error.code === 'ACTION_REJECTED') {
      message.error('用户拒绝了交易')
    } else {
      message.error(`续费失败: ${error.message || '未知错误'}`)
    }
  } finally {
    renewing.value = false
  }
}

// 检查订阅状态
const handleCheckStatus = async () => {
  if (!tokenIdInput.value) {
    message.warning('请输入 Token ID')
    return
  }

  if (!blockchainStore.contracts.nft) {
    message.error('NFT 合约未初始化')
    return
  }

  checking.value = true
  subscriptionStatus.value = null
  try {
    // 调用合约的 isActive 方法
    const isActive = await blockchainStore.contracts.nft.isActive(tokenIdInput.value)
    subscriptionStatus.value = isActive
    message.success(`订阅状态检查完成: ${isActive ? '有效' : '已过期'}`)
  } catch (error) {
    console.error('Check status error:', error)
    message.error(`状态检查失败: ${error.message || '未知错误'}`)
  } finally {
    checking.value = false
  }
}

// 获取订阅信息
const fetchSubscriptionInfo = async (id) => {
  if (!blockchainStore.contracts.nft) return

  try {
    // 获取订阅信息（假设合约有相关方法）
    // 注意：这里根据实际合约方法进行调整
    const expiryTime = await blockchainStore.contracts.nft.getExpiryTime 
      ? await blockchainStore.contracts.nft.getExpiryTime(id)
      : null
      
    const owner = await blockchainStore.contracts.nft.ownerOf 
      ? await blockchainStore.contracts.nft.ownerOf(id)
      : null
    
    subscriptionInfo.tokenId = id
    
    if (expiryTime) {
      subscriptionInfo.expiryTime = new Date(expiryTime.toNumber() * 1000).toLocaleString()
    } else {
      subscriptionInfo.expiryTime = '未知'
    }
    
    if (owner) {
      subscriptionInfo.owner = owner
    } else {
      subscriptionInfo.owner = '未知'
    }
  } catch (error) {
    console.error('获取订阅信息失败:', error)
    // 清空信息
    subscriptionInfo.tokenId = id
    subscriptionInfo.expiryTime = '获取失败'
    subscriptionInfo.owner = '获取失败'
  }
}
</script>

<style scoped>
.subscription-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.subscription-status {
  margin-top: 16px;
}

.subscription-info {
  margin-top: 16px;
}
</style>