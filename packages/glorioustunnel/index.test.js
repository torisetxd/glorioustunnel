'use strict'

const { test } = require('ava')

const glorioustunnelClient = require('.')

test('is an object', async (t) => {
  t.is(typeof glorioustunnelClient, 'object')
})

test('has expected exports', async (t) => {
  t.is(typeof glorioustunnelClient.Client, 'function')
})
