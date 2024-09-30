// idleMixin.js
import { mapActions } from 'vuex'
export default {
  data () {
    return {
      idleTime: 0,
      // idleLimit: 180000, // 3 minutes in milliseconds
      idleLimit: process.env.VUE_APP_IDLE_TIME,
      idleTimer: null
    }
  },
  methods: {
    ...mapActions(['logout']), // Map Vuex logout action
    resetIdleTimer () {
      this.idleTime = 0
      clearTimeout(this.idleTimer)
      this.startIdleTimer()
    },
    startIdleTimer () {
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout()
      }, this.idleLimit)
    },
    handleIdleTimeout () {
      this.$store.dispatch('logout', false) // Call the Vuex action to log out
      // alert('Your session has been logged out due to inactivity.')
      this.$router.push('/') // Redirect to login page
    },
    setupEventListeners () {
      window.addEventListener('mousemove', this.resetIdleTimer)
      window.addEventListener('keydown', this.resetIdleTimer)
      window.addEventListener('scroll', this.resetIdleTimer)
      window.addEventListener('click', this.resetIdleTimer)
      this.startIdleTimer() // Start the timer when the component is mounted
    }
  },
  mounted () {
    this.setupEventListeners()
  },
  beforeDestroy () {
    clearTimeout(this.idleTimer)
    window.removeEventListener('mousemove', this.resetIdleTimer)
    window.removeEventListener('keydown', this.resetIdleTimer)
    window.removeEventListener('scroll', this.resetIdleTimer)
    window.removeEventListener('click', this.resetIdleTimer)
  }
}
