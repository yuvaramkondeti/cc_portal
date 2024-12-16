<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <div>
    <div v-if='!loading'>
      <div class="alert alert-primary text-right">
        <button class="btn btn-primary" @click='getKafkaState()'>Refresh Broker Details</button>
      </div>
    </div>
    <div v-if='!loading && !detectedUserTaskId' class='alert alert-danger'>
      <strong>User-Task-ID</strong> header is not found in the response from the server. If you are using <a target=_blank href='https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'>CORS</a>, please add necessary configuration to your Cruise Control as described <a target=_blank href='https://github.com/linkedin/cruise-control-ui/wiki/CORS-Method'>in this wiki.</a>
    </div>
    <div v-if='error'>
      <exception :exception='errorData'></exception>
    </div>
    <div v-else-if='async'>
      <div class="alert alert-info text-center" v-if='showAsyncRefreshButton'>
        <button class="btn btn-sm btn-secondary" @click='getProposals()'>⟳ Refresh View Now (Task-Id: {{ taskId }} )</button>
      </div>
      <async-task :asyncData='asyncData'></async-task>
    </div>
    <div v-else-if="!loaded && loading">
      Loading Brokers ...
    </div>
    <div v-else-if='loaded'>
    
      <table class="table table-sm table-bordered">
        <thead class="thead-light">
          <tr>
            <th>Broker</th>
            <th>Host</th>
            <th>Logs</th>
            <th>Select Broker To View Logs(s)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for='(v, bid) in KafkaBrokerState.ReplicaCountByBrokerId' :class='brokerRowColor'>
            <td>{{ bid }}</td>            
            <td :id="bid" class="host_name">{{ hostDetails[bid] }}</td>
            <td>
              <input type="radio" v-model="selectedBrokers" :class="hostDetails[bid]" :value='bid' @change="clearPostResponse()"/>
            </td>
             <td class="split-td">
                <div class="left-part">
                    <button :disabled="selectedBrokers !== bid" class="btn btn-primary" :value='bid' v-model='logType' @click="getLogFilesApi(bid, 'server_logs')">Server Log</button>
                </div>
                <!--<div class="vertical-line"></div>
                <div class="right-part">
                    <button :disabled="selectedBrokers !== bid" class="btn btn-secondary" :value='bid' v-model='logType' @click="getLogFilesApi(selectedBrokers, 'zoo_logs')">Zookeeper Log</button>
                </div>-->
            </td>
          </tr>
        </tbody>
      </table>
    
     
      <!--
        <pre><code v-if='actionURL'>{{ actionURL.replace(/\&/g, "\n\t") }}</code></pre>
        -->

        <div v-if='posted'>
          <div v-if='postResponse'>
            <button class="btn btn-info" @click='clearPostResponse'>Clear Response</button>
            <!--<ul>
                <li v-for="(item, index) in postResponse" :key="index">
                    {{ item }}
                </li>
            </ul>-->
            <label class="log-select-label" for="optionsSelect">Log Type: <b style="color:green">{{logType}}</b>, Broker: <b style='color:brown'>{{selectedBrokers}}</b>.<br/><br/>Select the log file to continue:</label>
            <select v-model="selectedOption" class="log-select">
                <option v-for="(item, index) in postResponse" :key="index" :value="item">
                    {{ item }}
                </option>
            </select>
            <button @click='getLogData(selectedBrokers)' class="btn btn-primary">Get Log Data</button>
                <!-- <exception :exception='postResponse'></exception>-->
          </div>

          <div v-if='postLogResponse'>
              <exception :exception='postLogResponse'></exception>
          </div>
          <div v-if="isLoading" class='alert alert-success' v-else>
            Waiting for Response ...
          </div>
          <!--<div v-if="isLoading">
            Loading...
          </div>-->
        </div>
    </div>
  </div>
</template>

<script>
// Disable this due to https://github.com/linkedin/cruise-control-ui/issues/40
// import xssFilters from 'xss-filters'
import goals from '@/goals'
import BrokerState from '@/components/BrokerState'
// eslint-disable-next-line no-unused-vars
import VueChartjs from 'vue-chartjs'
// eslint-disable-next-line no-unused-vars
import { exec } from 'child_process'
// eslint-disable-next-line no-unused-vars
import axios from 'axios'
// eslint-disable-next-line no-unused-vars
const sortBy = require('lodash.sortby')

export default {
  name: 'AdminBroker',
  props: {
    group: String,
    cluster: String
  },
  components: {
    BrokerState
  },
  data () {
    return {
      sortColumn: 'Replicas', // column on which data needs to be sorted
      loading: false, // true if the data is being fetched now
      loaded: false, // true if data is fetched at-least once
      error: false, // in case server sent non 200 OK Response
      errorData: null, // complete error data
      selectedBrokers: [],
      selectedOption: null,
      isLoading: false,
      // This is the response from the CC
      KafkaBrokerState: {
        OfflineLogDirsByBrokerId: {},
        ReplicaCountByBrokerId: {},
        OutOfSyncCountByBrokerId: {},
        OnlineLogDirsByBrokerId: {},
        LeaderCountByBrokerId: {},
        OfflineReplicaCountByBrokerId: {}
      },
      hostDetails: [],
      allGoals: goals, // goals from configuration
      /*
       * x                              Goals   Disallow-Capacity-Estimation   Skip-Hard-Goal-Check   Use-Ready-Default-Goals   Kafka-Assigner-Mode   Module
       * Goals                          1       1                              1                      0                         0                     Analyzer
       * Disallow-Capacity-Estimation   1       1                              1                      1                         1                     Capacity-Resolver
       * Skip-Hard-Goal-Check           1       1                              1                      1                         0                     Analyzer
       * Use-Ready-Default-Goals        0       1                              1                      1                         0                     Analyzer
       * Kafka-Assigner-Mode            0       1                              0                      0                         1                     Analyzer
       */
      // disable user flags
      disable_goals1: false,
      disable_skip_hard_goal_check: false,
      disable_use_ready_default_goals: false,
      disable_kafka_assigner: false,
      // user flags
      logType: false,
      showURL: false, // show the URL on UI if true
      goals1: [], // non kafka assigner goals
      goals2: [], // kafka assigner goals
      skip_hard_goal_check: false, // Check CC Documentation
      use_ready_default_goals: false, // Check CC Documentation
      disallow_capacity_estimation: false, // Check CC Documentation
      kafka_assigner: false, // Check CC Documentation
      data_from: '', // Check CC Documentation
      excluded_topics: '', // Check CC Documentation
      concurrent_partition_movements_per_broker: null, // Check CC Documentation
      concurrent_leader_movements: null, // Check CC Documentation
      throttle_removed_broker: false, // Check CC Documentation
      throttle_added_broker: false, // Check CC Documentation
      // workflow
      actionName: 'ple', // radio to chose an action on ui
      dryrun: true, // part of URL
      posted: false, // true if a POST method is made
      posturl: null, // POST url
      postResponse: '', // POST response from server
      postLogResponse: null,
      detectedUserTaskId: false // true in case the response has user-task-id,
    }
  },
  created () {
    this.argsChanged()
  },
  computed: {
    taskId () {
      return this.$store.getters.getTaskId(this.url)
    },
    sortedHosts () {
      return (this.hosts, this.sortColumn)
    },
    brokerRowColor () {
      return null
    },
    actionURL () {
      let vm = this
      // dryrun should always be there in URL
      let params = {
        dryrun: vm.dryrun
      }
      if (vm.actionName === 'ple') {
        if (vm.concurrent_leader_movements > 0) {
          params.concurrent_leader_movements = vm.concurrent_leader_movements
        }
        params.goals = 'PreferredLeaderElectionGoal'
        return vm.$helpers.getURL('rebalance', params)
      }
      // console.log(' no url !')
    }
  },
  watch: {
    goals1: function (n, o) {
      this.disable_use_ready_default_goals = n.length > 0
      this.disable_kafka_assigner = n.length > 0
    },
    skip_hard_goal_check: function (n, o) {
      // console.log(n, o)
      if (n) {
        this.disable_kafka_assigner = true
      } else {
        this.disable_kafka_assigner = false
      }
    },
    use_ready_default_goals: function (n, o) {
      if (n) {
        this.goals1 = []
      }
      this.disable_goals1 = n
    },
    kafka_assigner: function (n, o) {
      if (n) {
        this.goals1 = []
        this.disable_goals1 = true
        this.disable_skip_hard_goal_check = true
        this.disable_use_ready_default_goals = true
      } else {
        this.disable_goals1 = false
        this.disable_skip_hard_goal_check = false
        this.disable_use_ready_default_goals = false
      }
    },
    showAdvanced: function (n, o) {
      if (!n) {
        this.goals1 = []
        this.disallow_capacity_estimation = false
        this.skip_hard_goal_check = false
        this.use_ready_default_goals = false
        this.kafka_assigner = false
        this.data_from = ''
        this.excluded_topics = null
        this.concurrent_partition_movements_per_broker = 0
        this.concurrent_leader_movements = 0
      }
    },
    group: function (ogroup, ngroup) {
      this.argsChanged()
    },
    cluster: function (ocluster, ncluster) {
      this.argsChanged()
    },
    selectedBrokers (n, o) {
      if (n.length > 0) {
        this.actionName = 'add'
      } else {
        this.actionName = 'ple'
      }
    }
  },
  methods: {
    clearPostResponse () {
      this.posted = false
      this.postResponse = ''
      this.postLogResponse = ''
    },
    getLogData (selectedBrokers) {
      this.postLogResponse = ''
      // console.log('in getLogData Fun')
      // console.log(selectedBrokers)
      // console.log(this.logType)
      // console.log(this.hostIP)
      // console.log(this.selectedOption)
      this.isLoading = true // Set loading to true before the API call
      if (this.selectedOption && this.logType && this.selectedBrokers && this.hostIP) {
        const vm = this
        const baseUrl = `http://${window.location.hostname}:3000/log-data/${this.logType}/${this.hostIP}/${this.selectedOption}`
        console.log(baseUrl)
        this.$http.get(baseUrl).then(r => {
          console.log(r)
          if (r.status === null || r.status === undefined || r.status === '') {
            vm.error = true
            vm.errorData = 'Could not complete the operation. Please try after some time or contact Administrator'
          } else if (r.status === 200) {
            vm.postLogResponse = r.data.logData
            vm.posted = true
            this.isLoading = false // Set loading to false before the API call
            console.log('after getting logdata')
          }
        }).catch(error => {
          console.log(error)
        })
      }
    },
    getLogFilesApi (selectedBrokers, logType) {
      this.postResponse = ''
      this.postLogResponse = ''
      console.log(this.posted)
      this.posted = true
      this.isLoading = true
      let hostIP
      this.logType = logType
      // console.log(this.logType)
      // console.log(selectedBrokers)
      const element = document.getElementById(selectedBrokers)
      hostIP = element.textContent || element.innerText
      this.hostIP = hostIP
      // console.log(hostIP)
      if (this.logType) {
        const vm = this
        const baseUrl = `http://${window.location.hostname}:3000/log-files/${this.logType}/${hostIP}`
        this.$http.get(baseUrl).then(r => {
          console.log(r)
          if (r.status === null || r.status === undefined || r.status === '') {
            vm.error = true
            vm.errorData = 'Could not complete the operation. Please try after some time or contact Administrator'
          } else if (r.status === 200) {
            vm.postResponse = r.data
            vm.posted = true
            this.isLoading = false
            this.selectedOption = this.postResponse[0]
            console.log('after getting logfiles')
          }
        }).catch(error => {
          console.log(error)
        })
      }
    },
    argsChanged () {
      const newurl = this.$store.getters.getnewurl(this.group, this.cluster)
      this.$store.commit('seturl', newurl)
      this.loaded = false
      this.newurl = newurl
      this.clearPostResponse()
      this.getKafkaState()
    },
    actionBroker () {
      let vm = this
      vm.posted = true
      this.clearPostResponse()
      let params = {
        withCredentials: true
      }
      // check if there is a running user-task-id for this end point in the $store
      // let task = this.$store.getters.getTaskId('proposals')
      let task = this.$store.getters.getTaskId(vm.actionURL)
      if (task) {
        params['headers'] = {
          'User-Task-ID': task
        }
      }
      this.$http.post(vm.actionURL, params).then((r) => {
        // set this so that we know if the server sends user-task-id in the response
        vm.detectedUserTaskId = r.headers.hasOwnProperty('user-task-id')
        // store this task in local cache for future follow-up
        let task = r.headers.hasOwnProperty('user-task-id') ? r.headers['user-task-id'] : null
        vm.$store.commit('setTaskId', {url: vm.actionURL, taskid: task}) // save this task for follow-up calls (null deletes in vuex)
        vm.posted = true
        vm.postResponse = r.data
      }, (e) => {
        vm.posted = true
        vm.postResponse = e && e.response ? e.response.data : e
      })
    },
    getKafkaState () {
      const vm = this
      console.log(this)
      console.log(vm)
      vm.error = false
      vm.async = false
      vm.loading = true
      let params = {
        withCredentials: true
      }
      let url = vm.$helpers.getURL('kafka_cluster_state')
      console.log(url)
      // let hostArr = []
      let brokerArr = []
      vm.$http.get('/kafkacruisecontrol/load?allow_capacity_estimation=true&json=true', params).then((r) => {
        // set this so that we know if the server sends user-task-id in the response
        vm.detectedUserTaskId = r.headers.hasOwnProperty('user-task-id')
        // check the actual response
        vm.async = false
        vm.loading = false
        vm.error = false
        vm.errorData = null
        vm.brokers = r.data.brokers || []
        vm.hosts = r.data.hosts || []
        // console.log(vm.hosts)
        console.log(vm.brokers)
        vm.brokers.forEach(obj => {
          brokerArr[obj.Broker] = obj.Host
        })
        vm.hostDetails = brokerArr
        // console.log(brokerArr)
        console.log(vm.hostDetails)
      })
      this.$http.get(url, {withCredentials: true}).then((r) => {
        // set this so that we know if the server sends user-task-id in the response
        vm.detectedUserTaskId = r.headers.hasOwnProperty('user-task-id')
        // do verify the state
        if (r.data === null || r.data === undefined || r.data === '') {
          vm.error = true
          vm.errorData = 'CruiseControl sent an empty response with 200-OK status code. Please file a bug here https://github.com/linkedin/cruise-control/issues'
        } else if (r.headers['content-type'].match(/text\/plain/) || r.data.progress) {
          vm.async = true
          vm.asyncData = r.data
          vm.showAsyncRefreshButton = true
        } else {
          vm.async = false
          vm.error = false
          vm.errorData = null
          vm.loading = false
          vm.loaded = true
          vm.KafkaBrokerState.ReplicaCountByBrokerId = r.data.KafkaBrokerState.ReplicaCountByBrokerId
          vm.KafkaBrokerState.OutOfSyncCountByBrokerId = r.data.KafkaBrokerState.OutOfSyncCountByBrokerId
          vm.KafkaBrokerState.LeaderCountByBrokerId = r.data.KafkaBrokerState.LeaderCountByBrokerId
          // only >= kafka 2.0 release
          try {
            vm.KafkaBrokerState.OfflineReplicaCountByBrokerId = r.data.KafkaBrokerState.OfflineReplicaCountByBrokerId
            vm.KafkaBrokerState.OfflineLogDirsByBrokerId = r.data.KafkaBrokerState.OfflineLogDirsByBrokerId
            vm.KafkaBrokerState.OnlineLogDirsByBrokerId = r.data.KafkaBrokerState.OnlineLogDirsByBrokerId
            console.log('Found Kafka-2.0 Features.')
          } catch (e) {
            console.log('No kafka 2.0 features found')
          }
        }
      }, (e) => {
        vm.loading = false
        vm.error = true
        vm.errorData = e && e.response && e.response.data ? e.response.data : e
      })
    }
  }
}
</script>
