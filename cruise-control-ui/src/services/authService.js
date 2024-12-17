// src/services/authService.js
import axios from 'axios'
// import qs from 'qs'
const CLIENT_ID = process.env.VUE_GIT_CLIENT_ID
const CLIENT_SECRET = process.env.VUE_GIT_CLIENT_SECRET
const REDIRECT_URI = process.env.VUE_GIT_REDIRECT_URI

export default {
  // Step 1: Redirect user to GitHub for authentication
  redirectToGitHubAuth () {
    console.log('in redirect log')
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user`
    window.location.href = authUrl // Redirect to GitHub OAuth URL
  },

  // Step 2: Exchange the code for an access token after GitHub redirects back
  async exchangeCodeForToken (code) {
    /* const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI
    }
    console.log('data:', data)
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      qs.stringify(data),
      { headers: { 'Accept': 'application/json' } }
    )
    return response.data.access_token */
    const response = await axios.post(`http://${window.location.hostname}:3000/api/auth/github/callback`, { code })
    localStorage.setItem('gitAccessToken', response.data.access_token)
    console.log('response in vue', response)
    return response.data.access_token
  },
  // Step 3: Use the access token to get user details from GitHub API
  async getUserDetails (accessToken) {
    try {
      /* const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      console.log(response)
      return response.data */
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      // Find the primary email (it's usually the first in the array)
      const primaryEmail = emailsResponse.data.find(email => email.primary).email
      // Return both the user details and the primary email
      /* return {
         userDetails: response.data,
         email: primaryEmail
       } */
      return primaryEmail
    } catch (error) {
      console.error('Error fetching user details or email from GitHub:', error)
      throw error
    }
  },
  async revokeGitHubToken (token) {
    const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`
    console.log('in revoke')
    console.log(token)
    console.log(credentials)
    const encodedCredentials = btoa(credentials) // Base64 encode the string
    await axios.delete(`https://api.github.com/applications/${CLIENT_ID}/token`, {
      headers: {
        Authorization: `Basic ${encodedCredentials}`
      },
      data: {
        access_token: token
      }
    })
  }
}
