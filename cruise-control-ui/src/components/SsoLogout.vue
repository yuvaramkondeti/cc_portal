<template>
  <div>
    <p>Logging out...</p>
  </div>
</template>
<script>
import authService from '@/services/authService'
export default {
  name: 'Logout',
  created () {
    this.logout()
  },
  methods: {
    logout () {
      // Step 1: Clear the session from your app (localStorage/sessionStorage/Vuex)
      const token = localStorage.getItem('gitAccessToken')
      console.log('in logot')
      console.log(token)
      if (token) {
        // Revoke token
        authService.revokeGitHubToken(token)
      }
      this.clearAppSession()
      this.logoutGitHub()
      // Step 2: Redirect the user to the GitHub logout URL (for GitHub)
      // For GitHub (or GitLab), use the appropriate URL for logging out
      // const gitLogoutUrl = 'https://github.com/logout' // GitHub logout URL
      // If using GitLab, you might use 'https://gitlab.com/users/sign_out'

      // Step 3: Redirect to Git logout and then back to your portal's login page
      // After redirecting to Git logout, redirect back to your portal login page
      // window.location.href = gitLogoutUrl
      // Optionally, you can redirect the user to your portal login page after logging out
      // Example:
      // window.location.href = '/login' // Uncomment if you need to manually redirect
      // console.log(localStorage.getItem('gitAccessToken'))
      this.$router.push('/')
      // this.logoutAndRedirect()
    },
    /* logoutAndRedirect () {
      window.location.href = 'https://github.com/logout?return_to=' + encodeURIComponent(window.location.origin)
    }, */
    clearAppSession () {
      // Clear any session data (e.g., authentication tokens) stored in localStorage/sessionStorage
      localStorage.setItem('requiresAuth', 'false')
      // Optionally, clear other authentication data
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('gitAccessToken')
      localStorage.removeItem('user')
      // Redirect to login or home page
      this.$store.dispatch('logout', false)
      sessionStorage.clear()
      localStorage.clear()
      sessionStorage.clear()
    },
    logoutGitHub () {
      const iframe = document.createElement('iframe')
      iframe.src = 'https://github.com/logout'
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      setTimeout(() => document.body.removeChild(iframe), 3000)
    }
  }
}
</script>

<style scoped>
button {
  padding: 10px;
  font-size: 16px;
}
</style>
