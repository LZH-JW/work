<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h2>注册</h2>
          <p>加入短剧平台，开启AI创作之旅</p>
        </div>
        
        <a-form
          :model="registerForm"
          :rules="rules"
          @finish="handleRegister"
          layout="vertical"
        >
          <a-form-item label="用户名" name="username">
            <a-input
              v-model:value="registerForm.username"
              placeholder="请输入用户名"
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="邮箱" name="email">
            <a-input
              v-model:value="registerForm.email"
              placeholder="请输入邮箱"
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="密码" name="password">
            <a-input-password
              v-model:value="registerForm.password"
              placeholder="请输入密码"
              size="large"
            />
          </a-form-item>
          
          <a-form-item label="确认密码" name="confirmPassword">
            <a-input-password
              v-model:value="registerForm.confirmPassword"
              placeholder="请再次输入密码"
              size="large"
            />
          </a-form-item>
          
          <a-form-item name="agreement">
            <a-checkbox v-model:checked="registerForm.agreement">
              我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
            </a-checkbox>
          </a-form-item>
          
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              block
              :loading="loading"
            >
              注册
            </a-button>
          </a-form-item>
        </a-form>
        
        <div class="register-footer">
          <p>已有账户？ <router-link to="/login">立即登录</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3位' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (rule, value) => {
        if (value !== registerForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }
    }
  ],
  agreement: [
    {
      validator: (rule, value) => {
        if (!value) {
          return Promise.reject('请同意用户协议')
        }
        return Promise.resolve()
      }
    }
  ]
}

const handleRegister = async () => {
  loading.value = true
  try {
    const result = await userStore.register(registerForm)
    if (result.success) {
      message.success('注册成功，请登录')
      router.push('/login')
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 400px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.register-header p {
  color: #666;
  font-size: 16px;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.register-footer a {
  color: #1890ff;
  text-decoration: none;
}

.register-footer a:hover {
  text-decoration: underline;
}
</style>
