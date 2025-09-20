// 聚合导出的 ABI 索引，供 `import abis from '@/contracts'` 使用
// 兼容 Vite：可直接导入 JSON 文件

// 已有的版权合约 ABI（由 Remix/Artifacts 生成）
import CopyrightAgreementV1 from '@/blockchain/contracts/artifacts/CopyrightAgreementV1.json'
// 订阅 NFT 合约 ABI
import SubscriptionNFT from '@/blockchain/contracts/artifacts/SubscriptionNFT.json'

// 可选：收益分配 RevenueShare（若未部署则不会被使用）
// 提供最小 ABI 以便前端交互模块正常构造合约实例
const RevenueShareABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'releasable',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'releaseETH',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

// SimpleNFT 的 ABI
const SimpleNFTABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256"}
    ],
    "name": "Minted",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "expiresAt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeCollector",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feePerMinuteWei",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "isActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mint",
    "outputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// 其他模块的 ABI 先占位（没有就保持 undefined，不会初始化对应合约）
const abis = {
  copyright: CopyrightAgreementV1?.abi || [],
  revenue: undefined,
  nft: SimpleNFTABI,
  revenueShare: RevenueShareABI,
  contentRegistry: undefined,
  taskMarket: undefined,
  paymentEscrow: undefined,
  platformPoints: undefined
}

export default abis


