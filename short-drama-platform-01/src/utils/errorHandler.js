// 全局错误处理工具

/**
 * 安全地访问对象属性，避免私有字段错误
 */
export const safeAccess = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : defaultValue
    }, obj)
  } catch (error) {
    console.warn('Safe access failed:', error.message)
    return defaultValue
  }
}

/**
 * 安全地执行异步操作，处理私有字段错误
 */
export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn()
  } catch (error) {
    if (error.message.includes('private field') || error.message.includes('Cannot read from private field')) {
      console.warn('Private field access error handled:', error.message)
      return fallback
    }
    throw error // 重新抛出其他类型的错误
  }
}

/**
 * 安全地调用 ethers.js 方法
 */
export const safeEthersCall = async (fn, fallback = null) => {
  try {
    return await fn()
  } catch (error) {
    if (error.message.includes('private field') || 
        error.message.includes('Cannot read from private field') ||
        error.code === 'PRIVATE_FIELD_ACCESS') {
      console.warn('Ethers private field access handled:', error.message)
      return fallback
    }
    throw error
  }
}

/**
 * 创建安全的 store 访问器
 */
export const createSafeStoreAccess = (store) => {
  return new Proxy(store, {
    get(target, prop) {
      try {
        return target[prop]
      } catch (error) {
        if (error.message.includes('private field')) {
          console.warn(`Safe store access blocked private field: ${prop}`)
          return undefined
        }
        throw error
      }
    }
  })
}

/**
 * 全局错误处理器
 */
export const setupGlobalErrorHandler = () => {
  // 捕获未处理的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || ''
    if (errorMessage.includes('private field') || 
        errorMessage.includes('Cannot read from private field') ||
        errorMessage.includes('Cannot access private field')) {
      console.warn('Global private field error handled:', errorMessage)
      event.preventDefault() // 阻止错误显示在控制台
      return false
    }
  })

  // 捕获同步错误
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.message || event.message || ''
    if (errorMessage.includes('private field') || 
        errorMessage.includes('Cannot read from private field') ||
        errorMessage.includes('Cannot access private field')) {
      console.warn('Global private field error handled:', errorMessage)
      event.preventDefault()
      return false
    }
  })

  // 重写 console.error 来过滤私有字段错误
  const originalConsoleError = console.error
  console.error = function(...args) {
    const message = args.join(' ')
    if (message.includes('private field') || 
        message.includes('Cannot read from private field') ||
        message.includes('Cannot access private field')) {
      console.warn('Console private field error filtered:', message)
      return
    }
    originalConsoleError.apply(console, args)
  }
}
