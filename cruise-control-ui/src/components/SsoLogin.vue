<template>
  <div class="parant-div-login">
    <div class="login-container">
        <h2>Welcome to Cruise Controller, Please login below to continue!</h2>
      <button @click="loginWithGitHub" class="github-login-button">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/1024px-Octicons-mark-github.svg.png" alt="GitHub Logo" class="github-icon">
          Login with GitHub
        </button> 
        <div class="login-text">
          <ul>
            <h3>Here’s What Awaits You</h3>
            <li><strong>Seamless Navigation:</strong> All tools designed to be at your fingertips.</li>
            <li><strong>Real-Time Insights:</strong> Make data-driven decisions with confidence.</li>
            <li><strong>Secure Environment:</strong> Your data is our priority—experience peace of mind.</li>
          </ul>
        </div>
     </div>
  </div>
</template>
<script>
import authService from '@/services/authService'
export default {
  methods: {
    loginWithGitHub () {
      authService.redirectToGitHubAuth()
    }
  }
}
</script>
