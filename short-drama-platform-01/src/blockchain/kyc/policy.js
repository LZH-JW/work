export class KYCPolicy {
  constructor(options = {}) {
    this.enabled = !!options.enabled
    this.region = options.region || 'GLOBAL'
    this.enforcedActions = new Set(options.enforcedActions || []) // e.g., ['release', 'register', 'transfer']
    this.checker = options.checker || (async () => true)
  }

  setEnabled(v) { this.enabled = !!v }
  setRegion(r) { this.region = r }
  enforceFor(action) { this.enforcedActions.add(action) }
  remove(action) { this.enforcedActions.delete(action) }

  async assert(action, context = {}) {
    if (!this.enabled) return { ok: true }
    if (!this.enforcedActions.has(action)) return { ok: true }
    const passed = await this.checker({ action, region: this.region, ...context })
    return passed ? { ok: true } : { ok: false, message: 'KYC/AML 未通过，无法执行该操作' }
  }
}

export default KYCPolicy


