// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.
import Vue from 'vue'
import Router from 'vue-router'
import Page from '@/components/Page'
import Load from '@/components/Load'
import ReplicaLoad from '@/components/ReplicaLoad'
import Proposals from '@/components/Proposals'
import State from '@/components/State'
import Monitor from '@/components/Monitor'
import Executor from '@/components/Executor'
import Analyzer from '@/components/Analyzer'
import AnomalyDetector from '@/components/AnomalyDetector'
import PartitionLoad from '@/components/PartitionLoad'
import KafkaClusterState from '@/components/KafkaClusterState'
import Preferences from '@/components/Preferences'
import AdminBroker from '@/components/AdminBroker'
import AdminSampling from '@/components/AdminSampling'
import UserTasks from '@/components/UserTasks'
import ConfigInsights from '@/components/ConfigInsights'
import ResourceDistribution from '@/components/ResourceDistribution'
import PeerReview from '@/components/PeerReview'
// import store from '@/store'
import Summary from '@/components/Summary'
import Login from '@/components/Login'
import Logout from '@/components/Logout'
import CreateTopic from '@/components/CreateTopic'
import ViewLog from '@/components/ViewLog'

// import childprocess from 'child_process'

Vue.use(Router)
console.log('Router configuration file loaded')
// export default new Router({
const router = new Router({
  linkActiveClass: '',
  linkExactActiveClass: 'active',
  routes: [
    {
      name: 'main',
      path: '/',
      meta: { requiresAuth: false, role: ['admin', 'developer'] },
      // redirect: '/a/b'
      component: Login
    },
    {
      path: '/env',
      redirect: '/a/b',
      meta: { requiresAuth: true, role: ['admin', 'developer'] }
    },
    /* {
      path: '/',
      name: 'Login',
      component: Login
    }, */
    {
      path: '/logout',
      name: 'Logout',
      component: Logout
    },
    {
      name: 'summary',
      path: '/summary',
      meta: { requiresAuth: true, role: ['admin', 'developer'] },
      component: Summary
    },
    {
      name: 'preferences',
      path: '/preferences',
      meta: { requiresAuth: true, role: ['admin', 'developer'] },
      component: Preferences
    },
    {
      name: 'configInsights',
      path: '/configInsights',
      meta: { requiresAuth: true, role: ['admin'] },
      component: ConfigInsights
    },
    {
      name: 'page',
      path: '/:group/:cluster',
      meta: { requiresAuth: true, role: ['admin', 'developer'] },
      component: Page,
      children: [
        {
          name: 'page.state',
          path: 'state',
          component: State,
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          redirect: {
            name: 'page.state.executor'
          },
          props: true,
          children: [
            {
              name: 'page.state.monitor',
              path: 'monitor',
              meta: { requiresAuth: true, role: ['admin', 'developer'] },
              component: Monitor,
              props: true
            },
            {
              name: 'page.state.analyzer',
              path: 'analyzer',
              meta: { requiresAuth: true, role: ['admin', 'developer'] },
              component: Analyzer,
              props: true
            },
            {
              name: 'page.state.executor',
              path: 'executor',
              meta: { requiresAuth: true, role: ['admin', 'developer'] },
              component: Executor,
              props: true
            },
            {
              name: 'page.state.anomaly_detector',
              path: 'anomaly_detector',
              meta: { requiresAuth: true, role: ['admin', 'developer'] },
              component: AnomalyDetector,
              props: true
            }
          ]
        },
        {
          name: 'page.kafkaclusterstate',
          path: 'kafka_cluster_state',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: KafkaClusterState,
          props: true
        },
        {
          name: 'page.load',
          path: 'load',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: Load,
          props: true
        },
        {
          name: 'page.replicaload',
          path: 'replicaload',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: ReplicaLoad,
          props: true
        },
        {
          name: 'page.proposals',
          path: 'proposals',
          meta: { requiresAuth: true, role: ['admin'] },
          component: Proposals,
          props: true
        },
        {
          name: 'page.partitionload',
          path: 'partitionload',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: PartitionLoad,
          props: true
        },
        {
          name: 'page.user_tasks',
          path: 'user_tasks',
          meta: { requiresAuth: true, role: ['admin'] },
          component: UserTasks,
          props: true
        },
        {
          name: 'page.admin_state',
          path: 'admin_state',
          meta: { requiresAuth: true, role: ['admin'] },
          component: AdminSampling,
          props: true
        },
        {
          name: 'page.resource_distributions',
          path: 'resource_distributions',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: ResourceDistribution,
          props: true
        },
        {
          name: 'page.admin_broker',
          path: 'admin_broker',
          meta: { requiresAuth: true, role: ['admin'] },
          component: AdminBroker,
          props: true
        },
        {
          name: 'page.review',
          path: 'review',
          meta: { requiresAuth: true, role: ['admin'] },
          component: PeerReview,
          props: true
        },
        {
          name: 'page.create_topic',
          path: 'create_topic',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: CreateTopic,
          props: true
        },
        {
          name: 'page.view_log',
          path: 'view_log',
          meta: { requiresAuth: true, role: ['admin', 'developer'] },
          component: ViewLog,
          props: true
        }
      ],
      props: true
    }
  ]
})
router.beforeEach((to, from, next) => {
  // console.log('Route Params:', to)
  // console.log('Route Params:', from)
  // console.log('called before each : %s -> %s', to.fullPath, from.fullPath)
  // store.commit('seturl', to)
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('requiresAuth') === 'true'
  const userRole = localStorage.getItem('userRole')
  console.log('in beforeeach', userRole)
  if (to.fullPath === '/' && isAuthenticated) {
    console.log('in if1')
    next('/env')
    return
  }
  if (requiresAuth && !isAuthenticated) {
    console.log('in if2')
    next('/') // Redirect to login if not authenticated
    return
  } else { // if (!to.params.group && !to.params.cluster) {
    console.log('in else')
    if (to.meta.role && isAuthenticated) {
      // Check if the user's role is allowed for this route
      console.log(to.meta.role)
      if (!to.meta.role.includes(userRole)) {
        next({ name: 'page.kafkaclusterstate' })// Redirect to kafka_cluster_state page
        return
      }
    }
    next()
  }
})
export default router

