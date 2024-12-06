<template>
  <div class="login">
    <h2>Welcome to Cruise Controller, Please login below to continue !</h2>
    <form @submit.prevent="login">
      <div>
        <label for="username">Username:</label>
        <input v-model="username" type="text" id="username" />
      </div>
      <div>
        <label for="password">Password:</label>
        <input v-model="password" type="password" id="password" />
      </div>
      <button class="btn btn-primary" type="submit">Login</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
// import { ref } from 'vue'
// import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  data () {
    return {
      username: '',
      password: '',
      errorMessage: '',
      // user: process.env.VUE_APP_USERNAME,
      // pwd: process.env.VUE_APP_PASSWORD
      users: {
        admin: {
          user: process.env.VUE_APP_USERNAME,
          pwd: process.env.VUE_APP_PASSWORD,
          role: 'admin'
        },
        user: {
          user: process.env.VUE_APP_DEV_USERNAME,
          pwd: process.env.VUE_APP_DEV_PASSWORD,
          role: 'developer'
        }
      }
    }
  },
  methods: {
    // const router = useRouter()
    login () {
      // console.log('in login function')
      // console.log('inside login func', this.nodeenv)
      const user = Object.values(this.users).find(
        user => user.user === this.username && user.pwd === this.password
      )
      // if (this.username === this.user && this.password === this.pwd) {
      if (user) {
        console.log(user.role)
        localStorage.setItem('requiresAuth', 'true')
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', user.role)
        this.$store.dispatch('login', { status: true, role: user.role })
        this.$router.push({path: '/env'})
      } else {
        this.errorMessage = 'Invalid credentials'
      }
    }
  }
}
</script>


<style scoped>
.login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    max-width: 400px; /* Optional: limits the max width of the login form */
    margin: auto;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    background-color: #fff;
    border-radius: 8px;
}
h2 {
  text-align: center;
}
div {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 0.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.error {
  color: red;
  text-align: center;
}
</style>