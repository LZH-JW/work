export class ProjectRegistry {
  constructor() {
    this.projects = {}
    this.current = null
  }
  register(id, addresses) {
    this.projects[id] = { ...addresses }
    if (!this.current) this.current = id
  }
  switchTo(id) {
    if (!this.projects[id]) throw new Error('项目未注册')
    this.current = id
    return this.projects[id]
  }
  get addresses() { return this.current ? (this.projects[this.current] || {}) : {} }
}

export default ProjectRegistry


