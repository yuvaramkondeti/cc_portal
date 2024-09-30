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
      meta: { requiresAuth: false },
      // redirect: '/a/b'
      component: Login
    },
    {
      path: '/env',
      redirect: '/a/b',
      meta: { requiresAuth: true }
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
      meta: { requiresAuth: true },
      component: Summary
    },
    {
      name: 'preferences',
      path: '/preferences',
      meta: { requiresAuth: true },
      component: Preferences
    },
    {
      name: 'configInsights',
      path: '/configInsights',
      meta: { requiresAuth: true },
      component: ConfigInsights
    },
    {
      name: 'page',
      path: '/:group/:cluster',
      meta: { requiresAuth: true },
      component: Page,
      children: [
        {
          name: 'page.state',
          path: 'state',
          component: State,
          meta: { requiresAuth: true },
          redirect: {
            name: 'page.state.executor'
          },
          props: true,
          children: [
            {
              name: 'page.state.monitor',
              path: 'monitor',
              meta: { requiresAuth: true },
              component: Monitor,
              props: true
            },
            {
              name: 'page.state.analyzer',
              path: 'analyzer',
              meta: { requiresAuth: true },
              component: Analyzer,
              props: true
            },
            {
              name: 'page.state.executor',
              path: 'executor',
              meta: { requiresAuth: true },
              component: Executor,
              props: true
            },
            {
              name: 'page.state.anomaly_detector',
              path: 'anomaly_detector',
              meta: { requiresAuth: true },
              component: AnomalyDetector,
              props: true
            }
          ]
        },
        {
          name: 'page.kafkaclusterstate',
          path: 'kafka_cluster_state',
          meta: { requiresAuth: true },
          component: KafkaClusterState,
          props: true
        },
        {
          name: 'page.load',
          path: 'load',
          meta: { requiresAuth: true },
          component: Load,
          props: true
        },
        {
          name: 'page.replicaload',
          path: 'replicaload',
          meta: { requiresAuth: true },
          component: ReplicaLoad,
          props: true
        },
        {
          name: 'page.proposals',
          path: 'proposals',
          meta: { requiresAuth: true },
          component: Proposals,
          props: true
        },
        {
          name: 'page.partitionload',
          path: 'partitionload',
          meta: { requiresAuth: true },
          component: PartitionLoad,
          props: true
        },
        {
          name: 'page.user_tasks',
          path: 'user_tasks',
          meta: { requiresAuth: true },
          component: UserTasks,
          props: true
        },
        {
          name: 'page.admin_state',
          path: 'admin_state',
          meta: { requiresAuth: true },
          component: AdminSampling,
          props: true
        },
        {
          name: 'page.resource_distributions',
          path: 'resource_distributions',
          meta: { requiresAuth: true },
          component: ResourceDistribution,
          props: true
        },
        {
          name: 'page.admin_broker',
          path: 'admin_broker',
          meta: { requiresAuth: true },
          component: AdminBroker,
          props: true
        },
        {
          name: 'page.review',
          path: 'review',
          meta: { requiresAuth: true },
          component: PeerReview,
          props: true
        },
        {
          name: 'page.create_topic',
          path: 'create_topic',
          meta: { requiresAuth: true },
          component: CreateTopic,
          props: true
        },
        {
          name: 'page.view_log',
          path: 'view_log',
          meta: { requiresAuth: true },
          component: ViewLog,
          props: true
        }
      ],
      props: true
    }
  ]
})
router.beforeEach((to, from, next) => {
  // console.log('Route Params:', to.params)
  // console.log('called before each : %s -> %s', to.fullPath, from.fullPath)
  // store.commit('seturl', to)
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('requiresAuth') === 'true'
  if (to.fullPath === '/' && isAuthenticated) {
    next('/env')
  }
  if (requiresAuth && !isAuthenticated) {
    next('/') // Redirect to login if not authenticated
  } else { // if (!to.params.group && !to.params.cluster) {
    next()
  }
})
export default router

