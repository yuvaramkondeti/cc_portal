<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <div>
    <div v-if='error'>
      <exception :exception='errorData'></exception>
    </div>
    <div v-else-if='async'>
      <async-task :asyncData='asyncData'></async-task>
    </div>
    <div class="topic-table-container" v-else-if='loaded'>
     <!-- Search Input -->
        <div class="search-container">
            <input
                type="text"
                v-model="searchQuery"
                placeholder="Search Topics..."
                class="search-input"
            />
        </div>
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <div class="table-wrapper" style="margin-right: 20px; flex: 0 0 40%;">
                    <table class="table table-sm table-bordered">
                        <thead class="thead-light">
                        <tr>
                            <th colspan="2">Topic Name</th>
                            <!--<th>Partition Count</th>
                            <th>Replication Factor</th>-->
                        </tr>
                        </thead>
                        <tbody>
                        <tr :class='brokerRowColor' v-for="(topic, index) in filteredTopics" :key="topic">
                            <td>{{ topic.name }}
                            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                                    <div style="text-align: left; font-size: smaller; color: gray; width:40%">
                                    <span style="font-weight: bold; font-size:11px; left: -15px; top: 0;">•</span>
                                        {{ topic.partitionCount }} Partitions
                                    </div>
                                    <div style="font-size: smaller; color: gray; width:65%;">
                                    <span style="font-weight: bold; font-size:11px; left: -15px; top: 0;">•</span>
                                        {{ topic.replicationFactor }} Replication
                                    </div>
                                </div>
                            </td>            
                            <td>
                                <button @click="viewDetails(topic)" :disabled="isButtonDisabled" class="btn btn-sm btn-primary view">View</button>
                            </td>
                        </tr>
                        <tr v-if="filteredTopics.length === 0">
                            <td colspan="3">No topics found.</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Messages Table Container -->
                    <div class="table-wrapper" style="flex: 0 0 57%;">
                       <div  v-if="isExportVisible" class="export">
                          <span style="cursor: pointer; float:right; padding-right:2%; color: green" @click="exportToCSV"><span class="material-icons">file_download</span>Export to CSV</span>
                       </div>
                        <h4 v-if="topicName">Topic: {{ topicName }}</h4>
                         <table class="table table-sm table-bordered">
                            <thead class="thead-light">
                                <tr>
                                    <th>Partition</th>
                                    <th>Offset</th>
                                    <th>Key</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(message, index) in kafkaMessagesData" :key="index">
                                    <td>{{ message.partition }}</td>
                                    <td>{{ message.offset }}</td>                                    
                                    <td>{{ message.key !== null ? message.key : 'N/A' }}</td>
                                    <td>{{ message.value }}</td>
                                </tr>
                                <tr v-if="!kafkaMessagesData.length">
                                    <td colspan="4">Select a Topic from left to view the messages.</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="isMsgsLoading && !messageReceived" class='alert alert-success'>
                           Loading Messages, please wait ...
                       </div>
                      
                    </div>
                    
            </div>
             <div v-if="isLoading" class='alert alert-success'>
                Loading Topics, please wait ...
            </div>
        </div>

  </div>
</template>


<script>
// eslint-disable-next-line no-unused-vars
// import * as XLSX from 'xlsx'
export default {
  name: 'CreateTopic',
  props: {
    group: String,
    cluster: String
  },
  data () {
    return {
      loading: false, // true if the data is being fetched now
      loaded: true, // true if data is fetched at-least once
      error: false, // in case server sent non 200 OK Response
      errorData: null, // complete error data
      isLoading: false,
      isMsgsLoading: false,
      postResponse: [], // POST response from server
      posted: false, // true if a POST method is made
      searchQuery: '', // for search query
      kafkaMessagesData: [],
      socket: null, // Define socket here
      messageReceived: false,
      topicName: '', // Variable to store the selected topic name
      buffer: '', // Store incoming WebSocket data here
      isButtonDisabled: false,
      isExportVisible: false
    }
  },
  computed: {
    filteredTopics () {
      return this.postResponse.filter(topic =>
        topic.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    },
    parsedMessages () {
      // console.log(this.kafkaMessagesData) // Check if the data is correctly transformed
      return this.kafkaMessagesData.map((data) => {
        try {
          const message = JSON.parse(data) // Parse the JSON string
          return {
            partition: message.partition,
            offset: message.offset,
            key: message.key,
            message: message.message
          }
        } catch (e) {
          console.error('Failed to parse message:', data, e)
          return {
            partition: 'N/A',
            offset: 'N/A',
            key: 'N/A',
            message: 'N/A'
          }
        }
      })
    }
  },
  methods: {
    clearPostResponse () {
      this.posted = false
    },
    argsChanged () {
      const newurl = this.$store.getters.getnewurl(this.group, this.cluster)
      this.$store.commit('seturl', newurl)
      this.loaded = false
    },
    exportToCSV () {
      const headers = ['Partition', 'Offset', 'Key', 'Message']
      const rows = this.kafkaMessagesData.map(message => [
        message.partition,
        message.offset,
        message.key,
        message.value
      ])
      // Combine headers and rows
      const csvContent = this.convertToCSV(headers, rows)
      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      // Create an anchor tag and trigger the download
      const link = document.createElement('a')
      if (link.download !== undefined) {
        // Create a download link for the Blob
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'messages.csv')
        // Append the link to the body (necessary for some browsers)
        document.body.appendChild(link)
        // Trigger the download
        link.click()
        // Clean up the DOM by removing the link
        document.body.removeChild(link)
      }
    },
    convertToCSV (headers, rows) {
      // Combine headers and rows
      const allRows = [headers, ...rows]
      // Convert each row into a CSV string and join with newline characters
      return allRows
        .map(row => row.map(String).join(','))
        .join('\n')
    },
    fetchTopics () {
      // Implement the API call to fetch topics and update the topics array
      const vm = this
      this.isLoading = true
      const baseUrl = `http://${window.location.hostname}:3000/topics`
      this.$http.get(baseUrl).then(r => {
        console.log(r)
        console.log(r.data)
        if (r.status === null || r.status === undefined || r.status === '') {
          vm.error = true
          vm.errorData = 'Could not complete the operation. Please try after some time or contact Administrator'
        } else if (r.status === 200) {
          // vm.postResponse = r.data
          const topicsData = r.data.split('\n').map(topic => topic.trim()).filter(topic => topic)
          vm.postResponse = topicsData.map(data => {
            const regex = /Topic:\s*(\w+)\s*TopicId:\s*\S+\s*PartitionCount:\s*(\d+)\s*ReplicationFactor:\s*(\d+)/
            const match = data.match(regex)
            if (match) {
              return {
                name: match[1],
                messageCount: 10, // Placeholder, adjust as needed
                partitionCount: match[2],
                replicationFactor: match[3]
              }
            }
            return null
          }).filter(topic => topic !== null)
          vm.posted = true
          this.isLoading = false
          this.loaded = true
          console.log('after getting topic names')
        }
      }).catch(error => {
        console.log(error)
        vm.error = true
        vm.errorData = error.message || 'An error occurred.'
      }).finally(() => {
        this.loading = false // Set loading to false after request completes
      })
    },
    viewDetails (topic) {
      try {
        console.log(`in view fun ${topic}`)
        this.isButtonDisabled = true
        this.isExportVisible = true
        const vm = this
        this.topicName = topic.name
        this.isMsgsLoading = true
        // this.messageReceived = false
        // Clear previous messages
        this.kafkaMessagesData = [] // Clear previous messages here
        this.$http.post(`http://${window.location.hostname}:3000/consume`, { topicName: this.topicName })
          .then(response => {
            vm.kafkaMessagesData = response.data // Success response
            console.log('response from server')
            console.log(response)
            vm.isMsgsLoading = false
            this.isButtonDisabled = false
          })
      } catch (error) {
        // Handle errors and display them
        console.error('Error consuming topic:', error)
        this.statusMessage = 'Error consuming messages from the topic.'
        this.isMsgsLoading = false
      }
    }
  },
  mounted () {
    this.fetchTopics()
  }
}
</script>

