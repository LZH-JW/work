import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ethers } from 'ethers'
import abis from '@/contracts'
import MetaMaskAdapter from '@/blockchain/wallets/metamaskAdapter'
import { RevenueShareModule } from '@/blockchain/contracts/revenueShare'
import ProjectRegistry from '@/blockchain/projects/registry'
import KYCPolicy from '@/blockchain/kyc/policy'

const NETWORK = import.meta.env.VITE_NETWORK || 'mock'
const CONTRACT_ADDRESSES = {
  copyright: import.meta.env.VITE_CONTRACT_COPYRIGHT_ADDRESS,
  revenue: import.meta.env.VITE_CONTRACT_REVENUE_ADDRESS,
  nft: import.meta.env.VITE_CONTRACT_NFT_ADDRESS,
  revenueShare: import.meta.env.VITE_CONTRACT_REVENUE_SHARE_ADDRESS,
  contentRegistry: import.meta.env.VITE_CONTRACT_CONTENT_REGISTRY_ADDRESS,
  taskMarket: import.meta.env.VITE_CONTRACT_TASK_MARKET_ADDRESS,
  paymentEscrow: import.meta.env.VITE_CONTRACT_PAYMENT_ESCROW_ADDRESS,
  platformPoints: import.meta.env.VITE_CONTRACT_PLATFORM_POINTS_ADDRESS
}

export const useBlockchainStore = defineStore('blockchain', () => {
  const provider = ref(null)
  const signer = ref(null)
  const account = ref('')
  const balance = ref('0')
  const connected = ref(false)
  const contracts = ref({})
  const adapter = new MetaMaskAdapter({
    requiredChainId: import.meta.env.VITE_REQUIRED_CHAIN_ID,
    requiredChainName: import.meta.env.VITE_REQUIRED_CHAIN_NAME,
    requiredRpcUrl: import.meta.env.VITE_REQUIRED_RPC_URL,
    requiredCurrency: import.meta.env.VITE_REQUIRED_CURRENCY
  })
  const registry = new ProjectRegistry()
  registry.register('default', {
    revenueShare: import.meta.env.VITE_CONTRACT_REVENUE_SHARE_ADDRESS,
    contentRegistry: import.meta.env.VITE_CONTRACT_CONTENT_REGISTRY_ADDRESS,
    taskMarket: import.meta.env.VITE_CONTRACT_TASK_MARKET_ADDRESS,
    paymentEscrow: import.meta.env.VITE_CONTRACT_PAYMENT_ESCROW_ADDRESS,
    platformPoints: import.meta.env.VITE_CONTRACT_PLATFORM_POINTS_ADDRESS
  })
  const kyc = new KYCPolicy({ enabled: import.meta.env.VITE_KYC_ENABLED === 'true', enforcedActions: ['release', 'register'] })
  
  // 目标网络配置（可在 .env 配置）
  const REQUIRED_CHAIN_ID = (import.meta.env.VITE_REQUIRED_CHAIN_ID || '').toString() // 例如 '0xaa36a7'
  const REQUIRED_CHAIN_NAME = import.meta.env.VITE_REQUIRED_CHAIN_NAME || 'Sepolia'
  const REQUIRED_RPC_URL = import.meta.env.VITE_REQUIRED_RPC_URL || ''
  const REQUIRED_CURRENCY = import.meta.env.VITE_REQUIRED_CURRENCY || 'ETH'

  const ensureTargetNetwork = async (ethereum) => {
    if (!REQUIRED_CHAIN_ID) return { success: true }
    try {
      const currentHex = await ethereum.request({ method: 'eth_chainId' })
      if (currentHex?.toLowerCase() === REQUIRED_CHAIN_ID.toLowerCase()) {
        return { success: true }
      }
      // 尝试切换
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: REQUIRED_CHAIN_ID }]
      })
      return { success: true, switched: true }
    } catch (err) {
      // 4902 表示网络未添加到 MetaMask
      if (err?.code === 4902 && REQUIRED_RPC_URL) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: REQUIRED_CHAIN_ID,
              chainName: REQUIRED_CHAIN_NAME,
              rpcUrls: [REQUIRED_RPC_URL],
              nativeCurrency: { name: REQUIRED_CURRENCY, symbol: REQUIRED_CURRENCY, decimals: 18 }
            }]
          })
          return { success: true, added: true }
        } catch (addErr) {
          return { success: false, message: addErr.message }
        }
      }
      return { success: false, message: err.message }
    }
  }

  const addEthereumEventListeners = (ethereum) => {
    if (!ethereum || ethereum.__dapp_listeners_added__) return
    ethereum.on?.('accountsChanged', async (accounts) => {
      if (accounts && accounts.length > 0) {
        account.value = accounts[0]
        if (provider.value) {
          const bal = await provider.value.getBalance(account.value)
          balance.value = ethers.formatEther(bal)
        }
      } else {
        disconnectWallet()
      }
    })
    ethereum.on?.('chainChanged', async () => {
      if (typeof window.ethereum !== 'undefined') {
        provider.value = new ethers.BrowserProvider(window.ethereum)
        signer.value = await provider.value.getSigner()
        if (account.value) {
          const bal = await provider.value.getBalance(account.value)
          balance.value = ethers.formatEther(bal)
        }
      }
    })
    ethereum.on?.('disconnect', () => {
      disconnectWallet()
    })
    ethereum.__dapp_listeners_added__ = true
  }

  const connectWallet = async () => {
    try {
      const result = await adapter.connect()
      if (!result.success) return result
      provider.value = adapter.provider
      signer.value = adapter.signer
      account.value = adapter.account
      const rb = await adapter.refreshBalance()
      if (rb.success) {
        balance.value = rb.balance
      } else {
        // 余额查询失败不阻断连接
        balance.value = '0'
      }
      connected.value = true
      return { success: true, silent: result.silent }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  const disconnectWallet = () => {
    provider.value = null
    signer.value = null
    account.value = ''
    balance.value = '0'
    connected.value = false
    adapter.disconnect()
  }

  const refreshBalance = async () => {
    try {
      if (adapter && adapter.connected) {
        const r = await adapter.refreshBalance()
        if (r.success) {
          balance.value = r.balance
          return { success: true }
        }
      }
      return { success: false, message: '请先连接钱包' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  const registerCopyright = async (dramaId, contentHash, metadata) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      // 这里需要智能合约的ABI和地址
      const contract = contracts.value.copyright
      if (!contract) {
        throw new Error('版权合约未初始化')
      }
      
      const tx = await contract.registerCopyright(dramaId, contentHash, metadata)
      const receipt = await tx.wait()
      
      return { success: true, transactionHash: receipt.transactionHash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  const distributeRevenue = async (dramaId, recipients, amounts) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = contracts.value.revenue
      if (!contract) {
        throw new Error('收益分配合约未初始化')
      }
      
      const tx = await contract.distributeRevenue(dramaId, recipients, amounts)
      const receipt = await tx.wait()
      
      return { success: true, transactionHash: receipt.transactionHash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  const getCopyrightInfo = async (dramaId) => {
    try {
      const contract = contracts.value.copyright
      if (!contract) {
        throw new Error('版权合约未初始化')
      }
      
      const info = await contract.getCopyrightInfo(dramaId)
      return { success: true, data: info }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 作者填写信息
  const setAuthorInfo = async ({ name, account: authorAddr, idHash, contact }) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      const contract = contracts.value.copyright
      if (!contract) throw new Error('版权合约未初始化')
      const tx = await contract.setAuthorInfo(name, authorAddr, idHash, contact)
      const receipt = await tx.wait()
      return { success: true, transactionHash: receipt.transactionHash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 基础设施提供者审核通过
  const approveCopyright = async (dramaId) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      const contract = contracts.value.copyright
      if (!contract) throw new Error('版权合约未初始化')
      const tx = await contract.approve(dramaId)
      const receipt = await tx.wait()
      return { success: true, transactionHash: receipt.transactionHash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // DApp helpers: gas & tx
  const getGasPrice = async () => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      const fee = await provider.value.getFeeData()
      return { success: true, data: { gwei: Number(ethers.formatUnits(fee.gasPrice||0n, 'gwei')) } }
    } catch (e) { return { success: false, message: e.message } }
  }

  const estimateGas = async ({ to, data }) => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      const est = await provider.value.estimateGas({ to, data })
      return { success: true, data: { gas: Number(est) } }
    } catch (e) { return { success: false, message: e.message } }
  }

  const submitTx = async ({ to, data, value = 0 }) => {
    try {
      if (!signer.value) {
        throw new Error('请先连接钱包')
      }
      const tx = await signer.value.sendTransaction({ to, data, value })
      return { success: true, data: { hash: tx.hash } }
    } catch (e) { return { success: false, message: e.message } }
  }

  const getTxStatus = async (hash) => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      const receipt = await provider.value.getTransactionReceipt(hash)
      const status = receipt ? (receipt.status === 1 ? 'CONFIRMED' : 'FAILED') : 'PENDING'
      return { success: true, data: { hash, status, submittedAt: 0 } }
    } catch (e) { return { success: false, message: e.message } }
  }

  const listTx = async ({ page = 1, pageSize = 10 } = {}) => {
    // real: need a backend indexer to list user's recent txs; placeholder
    return { success: true, data: { txs: [], total: 0, page, pageSize } }
  }

  const recordTx = async ({ hash, status = 'PENDING' }) => {
    try {
      // real: backend record
      return { success: true }
    } catch (e) { return { success: false, message: e.message } }
  }

  // ============ SubscriptionNFT 合约交互方法 ============

  // 铸造订阅 NFT
  const mintSubscriptionNFT = async (paymentWei) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const tx = await contract.mint({ value: paymentWei })
      const receipt = await tx.wait()
      
      // 从事件中获取 tokenId
      const mintEvent = receipt.logs.find(log => 
        log.topics[0] === ethers.id('Minted(uint256,address,uint256,uint256,uint256)')
      )
      const tokenId = mintEvent ? parseInt(mintEvent.topics[1], 16) : null
      
      return { 
        success: true, 
        transactionHash: receipt.transactionHash,
        tokenId 
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 续费订阅 NFT
  const renewSubscriptionNFT = async (tokenId, paymentWei) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const tx = await contract.renew(tokenId, { value: paymentWei })
      const receipt = await tx.wait()
      
      return { 
        success: true, 
        transactionHash: receipt.transactionHash 
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 检查 NFT 是否有效
  const isNFTActive = async (tokenId) => {
    try {
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const isActive = await contract.isActive(tokenId)
      return { success: true, isActive }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 获取 NFT 到期时间
  const getNFTExpiresAt = async (tokenId) => {
    try {
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const expiresAt = await contract.expiresAt(tokenId)
      return { 
        success: true, 
        expiresAt: Number(expiresAt),
        expiresAtDate: new Date(Number(expiresAt) * 1000)
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 获取 NFT 拥有者
  const getNFTOwner = async (tokenId) => {
    try {
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const owner = await contract.ownerOf(tokenId)
      return { success: true, owner }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 获取每分钟费用
  const getNFTFeePerMinute = async () => {
    try {
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const feeWei = await contract.feePerMinuteWei()
      return { 
        success: true, 
        feeWei: feeWei.toString(),
        feeEth: ethers.formatEther(feeWei)
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // 提取 NFT 合约收益（仅收费账户）
  const withdrawNFTFees = async () => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = contracts.value.nft
      if (!contract) {
        throw new Error('NFT 合约未初始化')
      }
      
      const tx = await contract.withdraw()
      const receipt = await tx.wait()
      
      return { 
        success: true, 
        transactionHash: receipt.transactionHash 
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  
  // 新增 RevenueShare 合约交互方法
  const releaseETH = async (contractAddress, payeeAddress) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      const k = await kyc.assert('release', { account: account.value })
      if (!k.ok) throw new Error(k.message)
      const module = new RevenueShareModule(adapter, contractAddress)
      const hash = await module.releaseETH(payeeAddress)
      return { success: true, transactionHash: hash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const getReleasableAmount = async (contractAddress, payeeAddress) => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      
      const module = new RevenueShareModule(adapter, contractAddress)
      const amount = await module.releasable(payeeAddress)
      return { success: true, amount }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const getContractBalance = async (contractAddress) => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      
      const module = new RevenueShareModule(adapter, contractAddress)
      const b = await module.balance()
      return { success: true, balance: b }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  // ContentRegistry 合约交互方法
  const registerContent = async (contractAddress, contentId, author, uri, contentHash) => {
    try {
      if (!connected.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = new ethers.Contract(contractAddress, abis.contentRegistry, signer.value)
      const tx = await contract.register(contentId, author, uri, contentHash)
      const receipt = await tx.wait()
      
      return { success: true, transactionHash: receipt.transactionHash }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const getContentRecord = async (contractAddress, contentId) => {
    try {
      if (!provider.value) {
        throw new Error('请先连接钱包')
      }
      
      const contract = new ethers.Contract(contractAddress, abis.contentRegistry, provider.value)
      const record = await contract.records(contentId)
      
      return { 
        success: true, 
        record: {
          author: record.author,
          uri: record.uri,
          contentHash: record.contentHash,
          createdAt: Number(record.createdAt)
        }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const initializeContracts = async (contractAddresses = CONTRACT_ADDRESSES) => {
    try {
      if (!signer.value) {
        throw new Error('请先连接钱包')
      }
      
      console.log('开始初始化合约...')
      console.log('合约地址配置:', contractAddresses)
      console.log('可用 ABIs:', Object.keys(abis))
      
      // 初始化合约实例（需要ABI）
      if (contractAddresses.copyright && abis.copyright) {
        contracts.value.copyright = new ethers.Contract(contractAddresses.copyright, abis.copyright, signer.value)
        console.log('版权合约已初始化:', contractAddresses.copyright)
      }
      
      if (contractAddresses.revenue && abis.revenue) {
        contracts.value.revenue = new ethers.Contract(contractAddresses.revenue, abis.revenue, signer.value)
        console.log('收益合约已初始化:', contractAddresses.revenue)
      }
      
      if (contractAddresses.nft && abis.nft) {
        contracts.value.nft = new ethers.Contract(contractAddresses.nft, abis.nft, signer.value)
        console.log('NFT合约已初始化:', contractAddresses.nft)
      } else {
        console.warn('NFT合约初始化失败:', {
          address: contractAddresses.nft,
          hasAbi: !!abis.nft,
          abiLength: abis.nft?.length || 0
        })
      }
      
      // 新增合约初始化
      if (contractAddresses.revenueShare && abis.revenueShare)
        contracts.value.revenueShare = new ethers.Contract(contractAddresses.revenueShare, abis.revenueShare, signer.value)
      if (contractAddresses.contentRegistry && abis.contentRegistry)
        contracts.value.contentRegistry = new ethers.Contract(contractAddresses.contentRegistry, abis.contentRegistry, signer.value)
      if (contractAddresses.taskMarket && abis.taskMarket)
        contracts.value.taskMarket = new ethers.Contract(contractAddresses.taskMarket, abis.taskMarket, signer.value)
      if (contractAddresses.paymentEscrow && abis.paymentEscrow)
        contracts.value.paymentEscrow = new ethers.Contract(contractAddresses.paymentEscrow, abis.paymentEscrow, signer.value)
      if (contractAddresses.platformPoints && abis.platformPoints)
        contracts.value.platformPoints = new ethers.Contract(contractAddresses.platformPoints, abis.platformPoints, signer.value)
      
      console.log('合约初始化完成，已初始化的合约:', Object.keys(contracts.value))
      return { success: true }
    } catch (error) {
      console.error('合约初始化失败:', error)
      return { success: false, message: error.message }
    }
  }
  
  return {
    provider,
    signer,
    account,
    balance,
    connected,
    contracts,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    registerCopyright,
    distributeRevenue,
    getCopyrightInfo,
    initializeContracts,
    getGasPrice,
    estimateGas,
    submitTx,
    getTxStatus,
    listTx,
    recordTx,
    // 新增的合约交互方法
    releaseETH,
    getReleasableAmount,
    getContractBalance,
    registerContent,
    getContentRecord,
    // 版权合约额外方法
    setAuthorInfo,
    approveCopyright,
    // SubscriptionNFT 合约交互方法
    mintSubscriptionNFT,
    renewSubscriptionNFT,
    isNFTActive,
    getNFTExpiresAt,
    getNFTOwner,
    getNFTFeePerMinute,
    withdrawNFTFees
  }
})
