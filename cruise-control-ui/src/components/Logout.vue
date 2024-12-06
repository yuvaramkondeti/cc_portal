<template>
  <div>
    <p>Logging out...</p>
  </div>
</template>

<script>
export default {
  name: 'Logout',
  created () {
    this.logout()
  },
  methods: {
    logout () {
      console.log('in logout component')
      // Clear authentication state
      localStorage.setItem('requiresAuth', 'false')
      // Optionally, clear other authentication data
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      // Redirect to login or home page
      this.$store.dispatch('logout', false)
      this.$router.push('/')
    }
  }
}
</script>
