<template>
  <div class="blockchain">
    <!-- Wallet Connection -->
    <MetaMaskConnector />

    <a-row :gutter="24">
      <a-col :span="16">
        <!-- 订阅 NFT 管理 -->
        <SimpleNFTWidget />

        <!-- Copyright Management -->
        <a-card title="版权管理" class="copyright-card">
          <div class="copyright-actions">
            <a-button type="primary" @click="showRegisterModal = true" :disabled="!blockchainStore.connected">
              <SafetyCertificateOutlined />
              注册版权
            </a-button>
            <a-button @click="refreshCopyrights" :loading="loadingCopyrights">
              <ReloadOutlined />
              刷新列表
            </a-button>
          </div>

          <div class="copyrights-list">
            <a-table
              :columns="copyrightColumns"
              :data-source="copyrights"
              :loading="loadingCopyrights"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.isActive ? 'green' : 'red'">
                    {{ record.isActive ? '已确权' : '已撤销' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'hash'">
                  <a-button type="link" @click="viewOnExplorer(record.contentHash)">
                    {{ formatHash(record.contentHash) }}
                  </a-button>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-button-group size="small">
                    <a-button @click="viewCopyright(record)">查看</a-button>
                    <a-button v-if="record.isActive" @click="transferCopyright(record)" type="primary">
                      转让
                    </a-button>
                    <a-button v-if="record.isActive" @click="revokeCopyright(record)" danger>
                      撤销
                    </a-button>
                  </a-button-group>
                </template>
              </template>
            </a-table>
          </div>
        </a-card>

        <!-- Subscription NFT -->
        <a-card title="订阅 NFT" class="subscription-card">
          <div class="subscription-actions">
            <a-button 
              type="primary" 
              @click="mintSubscription" 
              :disabled="!blockchainStore.connected || minting"
              :loading="minting"
            >
              铸造订阅 NFT
            </a-button>
            <a-button 
              @click="renewSubscription" 
              :disabled="!blockchainStore.connected || !tokenId || renewing"
              :loading="renewing"
            >
              续费订阅
            </a-button>
            <a-button 
              @click="checkSubscriptionStatus" 
              :disabled="!blockchainStore.connected || !tokenId || checking"
              :loading="checking"
            >
              检查状态
            </a-button>
            <a-input 
              v-model:value="tokenId" 
              placeholder="Token ID" 
              style="width: 120px; margin-left: 10px;"
            />
          </div>
          
          <div v-if="subscriptionStatus !== null" class="subscription-status">
            <a-alert 
              :type="subscriptionStatus ? 'success' : 'error'" 
              :message="`订阅状态: ${subscriptionStatus ? '有效' : '已过期'}`"
              show-icon
            />
          </div>
          
          <div class="subscription-info" v-if="subscriptionInfo.tokenId">
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

        <!-- Revenue Distribution -->
        <a-card title="收益分配" class="revenue-card">
          <div class="revenue-stats">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-statistic
                  title="总收益"
                  :value="totalRevenue"
                  suffix="ETH"
                  :precision="4"
                />
              </a-col>
              <a-col :span="8">
                <a-statistic
                  title="已分配"
                  :value="distributedRevenue"
                  suffix="ETH"
                  :precision="4"
                />
              </a-col>
              <a-col :span="8">
                <a-statistic
                  title="待提取"
                  :value="pendingWithdrawal"
                  suffix="ETH"
                  :precision="4"
                />
              </a-col>
            </a-row>
          </div>

          <!-- RevenueShare 合约交互 -->
          <RevenueShareWidget />

          <div class="revenue-actions">
            <a-button type="primary" @click="withdrawEarnings" :disabled="pendingWithdrawal === 0" :loading="withdrawing">
              <DollarOutlined />
              提取收益
            </a-button>
            <a-button @click="showDistributeModal = true" :disabled="!blockchainStore.connected">
              <ShareAltOutlined />
              分配收益
            </a-button>
          </div>

          <div class="revenue-history">
            <h4>收益历史</h4>
            <a-table
              :columns="revenueColumns"
              :data-source="revenueHistory"
              :loading="loadingRevenue"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'amount'">
                  {{ record.amount }} ETH
                </template>
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)">
                    {{ record.status }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'hash'">
                  <a-button type="link" @click="viewOnExplorer(record.transactionHash)">
                    {{ formatHash(record.transactionHash) }}
                  </a-button>
                </template>
              </template>
            </a-table>
          </div>
        </a-card>
      </a-col>

      <a-col :span="8">
        <!-- Contract Info -->
        <a-card title="智能合约" class="contract-card">
          <div class="contract-info">
            <div class="contract-item">
              <strong>版权合约:</strong>
              <div class="contract-address">
                {{ formatAddress(contractAddresses.copyright) }}
                <a-button type="text" size="small" @click="copyContract('copyright')">
                  <CopyOutlined />
                </a-button>
              </div>
            </div>
            <div class="contract-item">
              <strong>收益合约:</strong>
              <div class="contract-address">
                {{ formatAddress(contractAddresses.revenue) }}
                <a-button type="text" size="small" @click="copyContract('revenue')">
                  <CopyOutlined />
                </a-button>
              </div>
            </div>
            <div class="contract-item">
              <strong>NFT合约:</strong>
              <div class="contract-address">
                {{ formatAddress(contractAddresses.nft) }}
                <a-button type="text" size="small" @click="copyContract('nft')">
                  <CopyOutlined />
                </a-button>
              </div>
            </div>
          </div>
        </a-card>

        <!-- Network Info -->
        <a-card title="网络信息" class="network-card">
          <div class="network-info">
            <div class="network-item">
              <strong>网络:</strong>
              <span>{{ networkName }}</span>
            </div>
            <div class="network-item">
              <strong>Gas价格:</strong>
              <span>{{ gasPrice }} Gwei</span>
              <a-button size="small" style="margin-left:8px;" @click="fetchGas">刷新</a-button>
            </div>
            <div class="network-item">
              <strong>区块高度:</strong>
              <span>{{ blockNumber }}</span>
            </div>
          </div>
        </a-card>

        <!-- Quick Actions -->
        <a-card title="快速操作" class="actions-card">
          <div class="quick-actions">
            <a-button block @click="addToMetaMask" class="action-btn">
              <PlusOutlined />
              添加代币到MetaMask
            </a-button>
            <a-button block @click="switchNetwork" class="action-btn">
              <SwapOutlined />
              切换到Sepolia网络
            </a-button>
            <a-button block @click="viewOnExplorer(blockchainStore.account)" class="action-btn">
              <LinkOutlined />
              在区块浏览器查看
            </a-button>
          </div>
        </a-card>

        <!-- Tx Center -->
        <a-card title="交易中心" class="tx-card">
          <div style="display:flex; gap:8px; margin-bottom:8px;">
            <a-button type="primary" @click="submitMockTx" :loading="submittingTx">发起交易</a-button>
            <a-button @click="refreshTx" :loading="loadingTx">刷新</a-button>
            <a-switch v-model:checked="autoPoll" />
            <span>自动轮询</span>
            <a-select v-model:value="statusFilter" style="width:140px" allow-clear placeholder="按状态筛选">
              <a-select-option value="PENDING">PENDING</a-select-option>
              <a-select-option value="CONFIRMED">CONFIRMED</a-select-option>
              <a-select-option value="FAILED">FAILED</a-select-option>
            </a-select>
          </div>
          <a-table :columns="txCols" :data-source="filteredTxRows" row-key="hash" size="small" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key==='hash'">
                <a-button type="link" @click="viewOnExplorer(record.hash)">{{ formatHash(record.hash) }}</a-button>
              </template>
              <template v-else-if="column.key==='status'">
                <a-tag :color="getStatusColor(record.status)">{{ record.status }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- Register Copyright Modal -->
    <a-modal
      v-model:open="showRegisterModal"
      title="注册版权"
      @ok="registerCopyright"
      :confirm-loading="registering"
    >
      <a-form layout="vertical">
        <a-form-item label="选择短剧">
          <a-select v-model:value="registerForm.dramaId" placeholder="选择要注册版权的短剧">
            <a-select-option v-for="drama in userDramas" :key="drama.id" :value="drama.id">
              {{ drama.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="内容描述">
          <a-textarea
            v-model:value="registerForm.description"
            placeholder="描述版权内容"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="元数据">
          <a-textarea
            v-model:value="registerForm.metadata"
            placeholder="JSON格式的元数据（可选）"
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Distribute Revenue Modal -->
    <a-modal
      v-model:open="showDistributeModal"
      title="分配收益"
      @ok="distributeRevenue"
      :confirm-loading="distributing"
    >
      <a-form layout="vertical">
        <a-form-item label="选择短剧">
          <a-select v-model:value="distributeForm.dramaId" placeholder="选择短剧">
            <a-select-option v-for="drama in userDramas" :key="drama.id" :value="drama.id">
              {{ drama.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分配金额 (ETH)">
          <a-input-number
            v-model:value="distributeForm.amount"
            :min="0"
            :step="0.001"
            :precision="4"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useBlockchainStore } from '@/stores/blockchain'
import { useDramaStore } from '@/stores/drama'
import { ethers } from 'ethers'
import SubscriptionNFT from '@/components/SubscriptionNFT.vue'
import RevenueShareWidget from '@/components/RevenueShareWidget.vue'
import MetaMaskConnector from '@/components/MetaMaskConnector.vue'
import SimpleNFTWidget from '@/components/SimpleNFTWidget.vue'
import {
  WalletOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShareAltOutlined,
  PlusOutlined,
  SwapOutlined,
  LinkOutlined
} from '@ant-design/icons-vue'

const blockchainStore = useBlockchainStore()
const dramaStore = useDramaStore()

const loadingCopyrights = ref(false)
const loadingRevenue = ref(false)
const registering = ref(false)
const distributing = ref(false)
const withdrawing = ref(false)
const submittingTx = ref(false)
const loadingTx = ref(false)
const autoPoll = ref(false)
const minting = ref(false)
const renewing = ref(false)
const checking = ref(false)

const showRegisterModal = ref(false)
const showDistributeModal = ref(false)

const copyrights = ref([])
const revenueHistory = ref([])
const userDramas = ref([])

const totalRevenue = ref(0)
const distributedRevenue = ref(0)
const pendingWithdrawal = ref(0)
const gasPrice = ref(0)
const blockNumber = ref(0)
const networkName = ref(import.meta.env.VITE_NETWORK || 'localhost')
const txRows = ref([])
const statusFilter = ref()
const tokenId = ref('')
const subscriptionStatus = ref(null)
const subscriptionInfo = reactive({
  tokenId: '',
  expiryTime: '',
  owner: ''
})

const filteredTxRows = computed(() => {
  if (!statusFilter.value) return txRows.value
  return txRows.value.filter(r => r.status === statusFilter.value)
})
const txCols = [
  { title: '哈希', dataIndex: 'hash', key: 'hash' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '时间', dataIndex: 'submittedAt', key: 'submittedAt' }
]

const contractAddresses = reactive({
  copyright: import.meta.env.VITE_CONTRACT_COPYRIGHT_ADDRESS || '未配置',
  revenue: import.meta.env.VITE_CONTRACT_REVENUE_ADDRESS || '未配置',
  nft: import.meta.env.VITE_CONTRACT_NFT_ADDRESS || '未配置'
})

const registerForm = reactive({
  dramaId: null,
  description: '',
  metadata: ''
})

const distributeForm = reactive({
  dramaId: null,
  amount: 0
})

const copyrightColumns = [
  { title: '短剧标题', dataIndex: 'title', key: 'title' },
  { title: '内容哈希', dataIndex: 'contentHash', key: 'hash' },
  { title: '注册时间', dataIndex: 'timestamp', key: 'timestamp' },
  { title: '状态', dataIndex: 'isActive', key: 'status' },
  { title: '操作', key: 'actions' }
]

const revenueColumns = [
  { title: '短剧', dataIndex: 'dramaTitle', key: 'drama' },
  { title: '金额', dataIndex: 'amount', key: 'amount' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '交易哈希', dataIndex: 'transactionHash', key: 'hash' },
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp' }
]

const formatAddress = (address) => {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

const formatHash = (hash) => {
  if (!hash) return ''
  return `${hash.substring(0, 10)}...`
}

const getStatusColor = (status) => {
  const colors = {
    'PENDING': 'orange',
    'CONFIRMED': 'green',
    'FAILED': 'red'
  }
  return colors[status] || 'default'
}

const copyContract = (type) => {
  navigator.clipboard.writeText(contractAddresses[type])
  message.success('合约地址已复制')
}

const refreshCopyrights = async () => {
  loadingCopyrights.value = true
  try {
    // 这里应该从区块链上读取真实的版权数据
    // 暂时清空列表，等待真实数据实现
    copyrights.value = []
    message.success('版权列表已刷新')
  } catch (error) {
    message.error('刷新失败')
  } finally {
    loadingCopyrights.value = false
  }
}

const registerCopyright = async () => {
  if (!registerForm.dramaId) {
    message.warning('请选择短剧')
    return
  }
  
  registering.value = true
  try {
    const result = await blockchainStore.registerCopyright(
      registerForm.dramaId,
      'mock-content-hash',
      registerForm.metadata
    )
    
    if (result.success) {
      message.success('版权注册成功')
      showRegisterModal.value = false
      refreshCopyrights()
      if (result.transactionHash) await blockchainStore.recordTx({ hash: result.transactionHash })
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('注册失败')
  } finally {
    registering.value = false
  }
}

const distributeRevenue = async () => {
  if (!distributeForm.dramaId || !distributeForm.amount) {
    message.warning('请填写完整信息')
    return
  }
  
  distributing.value = true
  try {
    const result = await blockchainStore.distributeRevenue(
      distributeForm.dramaId,
      ['0x1234567890123456789012345678901234567890'],
      [distributeForm.amount]
    )
    
    if (result.success) {
      message.success('收益分配成功')
      showDistributeModal.value = false
      loadRevenueData()
      // 记录交易到交易中心
      if (result.transactionHash) await blockchainStore.recordTx({ hash: result.transactionHash })
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('分配失败')
  } finally {
    distributing.value = false
  }
}

const withdrawEarnings = async () => {
  withdrawing.value = true
  try {
    // 这里应该调用真实的提取收益合约方法
    // 暂时显示未实现提示
    message.warning('提取收益功能需要配置智能合约地址')
  } catch (error) {
    message.error('提取失败')
  } finally {
    withdrawing.value = false
  }
}

const viewCopyright = (copyright) => {
  // Show copyright details modal
  message.info('查看版权详情')
}

const transferCopyright = (copyright) => {
  // Show transfer modal
  message.info('转让版权')
}

const revokeCopyright = (copyright) => {
  // Show revoke confirmation
  message.info('撤销版权')
}

const viewOnExplorer = (hash) => {
  window.open(`https://sepolia.etherscan.io/address/${hash}`, '_blank')
}

const addToMetaMask = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: contractAddresses.nft,
          symbol: 'DRAMA',
          decimals: 18
        }
      }
    })
    message.success('代币已添加到MetaMask')
  } catch (error) {
    message.error('添加失败')
  }
}

const switchNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }] // Sepolia testnet
    })
    message.success('网络切换成功')
  } catch (error) {
    message.error('网络切换失败')
  }
}

const loadBlockchainData = async () => {
  // 初始化合约（读 env），Mock 下为占位
  await blockchainStore.initializeContracts()
  await Promise.all([
    refreshCopyrights(),
    loadRevenueData(),
    loadNetworkInfo()
  ])
}

const loadRevenueData = async () => {
  loadingRevenue.value = true
  try {
    // 这里应该从区块链上读取真实的收益数据
    // 暂时清空数据，等待真实数据实现
    revenueHistory.value = []
    totalRevenue.value = 0
    distributedRevenue.value = 0
    pendingWithdrawal.value = 0
  } catch (error) {
    message.error('加载收益数据失败')
  } finally {
    loadingRevenue.value = false
  }
}

const loadNetworkInfo = async () => {
  try {
    const g = await blockchainStore.getGasPrice()
    if (g.success) gasPrice.value = g.data.gwei
    
    // 获取当前区块高度
    if (blockchainStore.provider) {
      blockNumber.value = await blockchainStore.provider.getBlockNumber()
    }
  } catch (error) {
    console.error('加载网络信息失败:', error)
  }
}

const fetchGas = async () => {
  const g = await blockchainStore.getGasPrice()
  if (g.success) gasPrice.value = g.data.gwei
}


const refreshTx = async () => {
  loadingTx.value = true
  try {
    const resp = await blockchainStore.listTx({ page: 1, pageSize: 50 })
    if (resp.success) {
      txRows.value = (resp.data.txs || []).map(t => ({
        hash: t.hash,
        status: t.status,
        submittedAt: t.submittedAt ? new Date(t.submittedAt).toLocaleString() : '-'
      }))
    }
  } finally {
    loadingTx.value = false
  }
}

const submitMockTx = async () => {
  submittingTx.value = true
  try {
    const to = contractAddresses.revenue
    const data = '0x'
    const s = await blockchainStore.submitTx({ to, data, value: 0 })
    if (s.success) {
      message.success(`已提交交易：${s.data.hash.slice(0,10)}...`)
      await refreshTx()
    } else {
      message.error(s.message || '提交失败')
    }
  } finally {
    submittingTx.value = false
  }
}

const mintSubscription = async () => {
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
      tokenId.value = newTokenId
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

const renewSubscription = async () => {
  if (!tokenId.value) {
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
    const tx = await blockchainStore.contracts.nft.renew(tokenId.value, {
      value: ethers.utils.parseEther("0.001")
    })
    
    message.info('续费交易已提交，等待确认...')
    await tx.wait()
    
    message.success('订阅续费成功!')
    
    // 更新订阅信息
    await fetchSubscriptionInfo(tokenId.value)
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

const checkSubscriptionStatus = async () => {
  if (!tokenId.value) {
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
    const isActive = await blockchainStore.contracts.nft.isActive(tokenId.value)
    subscriptionStatus.value = isActive
    message.success(`订阅状态检查完成: ${isActive ? '有效' : '已过期'}`)
  } catch (error) {
    console.error('Check status error:', error)
    message.error(`状态检查失败: ${error.message || '未知错误'}`)
  } finally {
    checking.value = false
  }
}

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

watch(autoPoll, (val)=>{
  if (val) {
    autoPollTimer = setInterval(async ()=>{
      const pending = txRows.value.filter(r => r.status === 'PENDING')
      for (const r of pending) {
        const st = await blockchainStore.getTxStatus(r.hash)
        if (st.success) r.status = st.data.status
      }
    }, 1500)
  } else {
    if (autoPollTimer) { clearInterval(autoPollTimer); autoPollTimer = null }
  }
})


onMounted(async () => {
  // Load user dramas - 这里应该从实际的用户数据中加载
  // 暂时使用空数组，等待真实数据实现
  userDramas.value = []
  
  if (blockchainStore.connected) {
    await loadBlockchainData()
  }
})
</script>

<style scoped>
.blockchain {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.copyright-card, .revenue-card {
  margin-bottom: 24px;
}

.contract-address {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.copyright-actions, .revenue-actions {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.copyrights-list, .revenue-history {
  margin-top: 16px;
}

.revenue-stats {
  margin-bottom: 24px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.contract-card, .network-card, .actions-card {
  margin-bottom: 24px;
}

.contract-info, .network-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contract-item, .network-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
}

</style>
