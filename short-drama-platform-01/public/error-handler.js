// 立即执行的错误处理脚本
// 在任何其他脚本加载之前设置错误拦截

(function() {
  'use strict';
  
  // 拦截未处理的 Promise 错误
  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = event.reason?.message || event.reason || '';
    if (typeof errorMessage === 'string' && (
        errorMessage.includes('private field') || 
        errorMessage.includes('Cannot read from private field') ||
        errorMessage.includes('Cannot access private field')
    )) {
      console.warn('🛡️ Private field error intercepted:', errorMessage);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // 拦截同步错误
  window.addEventListener('error', function(event) {
    const errorMessage = event.error?.message || event.message || '';
    if (typeof errorMessage === 'string' && (
        errorMessage.includes('private field') || 
        errorMessage.includes('Cannot read from private field') ||
        errorMessage.includes('Cannot access private field')
    )) {
      console.warn('🛡️ Private field error intercepted:', errorMessage);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // 重写 console.error
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('private field') || 
        message.includes('Cannot read from private field') ||
        message.includes('Cannot access private field')) {
      console.warn('🛡️ Console error filtered:', message);
      return;
    }
    originalError.apply(console, args);
  };

  console.log('🛡️ Private field error handler initialized');
})();
