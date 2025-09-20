import { ethers } from 'ethers'

export class MetaMaskAdapter {
  constructor(options = {}) {
    this.requiredChainId = (options.requiredChainId || '').toString()
    this.requiredChainName = options.requiredChainName || 'Target Network'
    this.requiredRpcUrl = options.requiredRpcUrl || ''
    this.requiredCurrency = options.requiredCurrency || 'ETH'
    this.provider = null
    this.signer = null
    this.account = ''
    this.connected = false
  }

  get ethereum() {
    return typeof window !== 'undefined' ? window.ethereum : undefined
  }

  async ensureNetwork() {
    const ethereum = this.ethereum
    if (!ethereum || !this.requiredChainId) return { success: true }
    try {
      const current = await ethereum.request({ method: 'eth_chainId' })
      if (current?.toLowerCase() === this.requiredChainId.toLowerCase()) {
        return { success: true }
      }
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.requiredChainId }]
      })
      return { success: true, switched: true }
    } catch (err) {
      if (err?.code === 4902 && this.requiredRpcUrl) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: this.requiredChainId,
              chainName: this.requiredChainName,
              rpcUrls: [this.requiredRpcUrl],
              nativeCurrency: { name: this.requiredCurrency, symbol: this.requiredCurrency, decimals: 18 }
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

  addEventListeners() {
    const ethereum = this.ethereum
    if (!ethereum || ethereum.__aa_added__) return
    ethereum.on?.('accountsChanged', async (accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        this.account = accounts[0]
        if (this.provider) {
          const bal = await this.provider.getBalance(this.account)
          this.balance = ethers.formatEther(bal)
        }
      } else {
        this.disconnect()
      }
    })
    ethereum.on?.('chainChanged', async () => {
      if (this.ethereum) {
        this.provider = new ethers.BrowserProvider(this.ethereum)
        this.signer = await this.provider.getSigner()
      }
    })
    ethereum.on?.('disconnect', () => this.disconnect())
    ethereum.__aa_added__ = true
  }

  async connect() {
    const ethereum = this.ethereum
    if (!ethereum) return { success: false, message: '请安装MetaMask钱包' }

    try {
      // 直接请求账户连接，这会触发 MetaMask 弹窗
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      
      if (!accounts || accounts.length === 0) {
        return { success: false, message: '未获取到账户' }
      }

      // 设置账户
      this.account = accounts[0]

      // 确保网络正确
      const net = await this.ensureNetwork()
      if (!net.success) return net

      // 创建 provider 和 signer
      this.provider = new ethers.BrowserProvider(ethereum)
      this.signer = await this.provider.getSigner()
      
      this.connected = true
      this.addEventListeners()
      
      return { success: true }
    } catch (error) {
      console.error('MetaMask 连接错误:', error)
      
      if (error?.code === -32002) {
        return { success: false, message: '请在 MetaMask 中处理待确认请求' }
      }
      if (error?.code === 4001) {
        return { success: false, message: '用户拒绝了连接请求' }
      }
      
      return { success: false, message: error?.message || '连接失败' }
    }
  }

  async refreshBalance() {
    if (!this.provider || !this.account) return { success: false, message: '未连接' }
    try {
      const bal = await this.provider.getBalance(this.account)
      this.balance = ethers.formatEther(bal)
      return { success: true, balance: this.balance }
    } catch (e) {
      // 处理 MetaMask 扩展的 circuit breaker 报错
      if (typeof e?.message === 'string' && (e.message.includes('circuit breaker') || e.message.includes('could not coalesce error'))) {
        return { success: false, message: '网络繁忙，请稍后重试' }
      }
      return { success: false, message: e?.message || '获取余额失败' }
    }
  }

  disconnect() {
    this.provider = null
    this.signer = null
    this.account = ''
    this.connected = false
  }
}

export default MetaMaskAdapter


