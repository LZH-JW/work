import { ethers } from 'ethers'
import abis from '@/contracts'

export class RevenueShareModule {
  constructor(adapter, address) {
    this.adapter = adapter
    this.address = address
  }
  with(address) { return new RevenueShareModule(this.adapter, address || this.address) }

  get readContract() {
    return new ethers.Contract(this.address, abis.revenueShare, this.adapter.provider)
  }
  get writeContract() {
    return new ethers.Contract(this.address, abis.revenueShare, this.adapter.signer)
  }

  async balance() {
    const b = await this.adapter.provider.getBalance(this.address)
    return ethers.formatEther(b)
  }
  async releasable(payee) {
    const v = await this.readContract.releasable(payee)
    return ethers.formatEther(v)
  }
  async releaseETH(payee) {
    const tx = await this.writeContract.releaseETH(payee)
    const rc = await tx.wait()
    return rc?.hash || tx.hash
  }
}

export default RevenueShareModule


