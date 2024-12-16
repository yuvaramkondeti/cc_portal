<template>
  <div>
    <p v-if="loading">Loading...</p>
    <p v-else-if="user">Hello, {{ user.login }}!</p>
    <p v-else>Error during login.</p>
  </div>
</template>
<script>
import authService from '@/services/authService'
export default {
  data () {
    return {
      loading: true,
      user: null
    }
  },
  async created () {
    console.log('in created fun')
    // Check the initial state in Vuex after page refresh
    console.log('User in Vuex store:', this.$store.state.user)
    console.log('Git access token in Vuex store:', this.$store.state.gitAccessToken)
    // Check if user is already in localStorage on page load
    /* const storedUser = localStorage.getItem('user')
    if (storedUser) {
      this.user = { login: storedUser }
      this.role = localStorage.getItem('userRole') || 'guest'
      this.loading = false
      return
    } */
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      try {
        // Step 2: Exchange the code for an access token
        console.log('in try', code)
        const accessToken = await authService.exchangeCodeForToken(code)

        console.log('Token', accessToken)
        // Step 3: Use the token to fetch user details
        const user = await authService.getUserDetails(accessToken)
        this.user = user
        // localStorage.setItem('gitAccessToken', accessToken)
        const emails = process.env.VUE_CC_ADMIN_EMAILS.split(',')
        console.log(emails)
        if (emails.includes(this.user)) {
          this.role = 'admin'
        } else {
          this.role = 'developer'
        }
        // this.role = 'admin'
        localStorage.setItem('user', this.user)
        localStorage.setItem('requiresAuth', 'true')
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userRole', this.role)
        localStorage.setItem('gitAccessToken', accessToken)
        // console.log('access token', accessToken)
        localStorage.setItem('gitAccessToken', accessToken)
        this.$store.dispatch('setUser', this.user)
        this.$store.dispatch('setGitAccessToken', accessToken)
        this.$store.dispatch('login', { status: true, role: this.role })
        // this.$store.dispatch('login', authData)
        this.clearUrlParams()
        this.loading = false
        this.$router.replace({path: '/env'})
        // window.location.href = window.location.origin + window.location.pathname
        // this.$router.push({ path: '/' })
      } catch (error) {
        console.error('Error during GitHub login:', error)
        this.loading = false
      }
    } else {
      this.loading = false
    }
  },
  methods: {
    // Method to clear query parameters from the URL
    clearUrlParams () {
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    }
  }
}
</script>
