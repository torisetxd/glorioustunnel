'use strict'

const { test } = require('ava')

const glorioustunnelServer = require('.')

test('is an object', async (t) => {
  t.is(typeof glorioustunnelServer, 'object')
})

test('has expected exports', async (t) => {
  t.is(typeof glorioustunnelServer.Server, 'function')
  t.is(typeof glorioustunnelServer.Tunnel, 'function')
  t.is(typeof glorioustunnelServer.TunnelManager, 'function')
})
