'use strict'

const debug = require('debug')('glorioustunnel:tunnelmanager')

const { RelayServer, TLSRelayServer } = require('glorioustunnel-tcp-relay').Server
// const getAvailablePort = require('get-port')
const { portValidator } = require('port-validator')
// import net
const net = require('net')

const Tunnel = require('./Tunnel')
const generateSecret = () => require('crypto').randomBytes(20).toString('hex')

const settings = {
  minPort: 10000,
  maxPort: 20000
}

const validatePortRange = (port) => {
  if (port < settings.minPort || port > settings.maxPort) {
    throw new Error(`Port must be between ${settings.minPort} and ${settings.maxPort}`)
  }
}

const checkAvailablePort = (options) =>
  new Promise((resolve, reject) => {
    validatePortRange(options.port)
    const server = net.createServer()
    server.unref()
    server.on('error', reject)

    server.listen(options, () => {
      const { port } = server.address()
      server.close(() => {
        resolve(port)
      })
    })
  })

const getRandomAvailablePortInRange = async () => {
  const { minPort, maxPort } = settings

  while (true) {
    const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort
    try {
      await checkAvailablePort({ port })
      return port
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error
      }
    }
  }
}

const getAvailablePort = async (options, hosts) => {
  if (options.port === 0) {
    options.port = await getRandomAvailablePortInRange()
  }
  validatePortRange(options.port)

  if (options.host) {
    return checkAvailablePort(options)
  }

  for (const host of hosts) {
    try {
      await checkAvailablePort({ port: options.port, host }) // eslint-disable-line no-await-in-loop
    } catch (error) {
      if (!['EADDRNOTAVAIL', 'EINVAL'].includes(error.code)) {
        throw error
      }
    }
  }

  return options.port
}

/**
 * Manage tunnels.
 */
class TunnelManager {
  constructor (opts = {}) {
    this.tunnels = new Map() // internetPort -> relayServer map
    this.maxAge = opts.maxAge || 60 * 60 * 24 // 1 day in seconds
    this.removeExpiredTunnelsInterval()
    debug(`created`, opts)
  }

  /**
   * Create a new tunnel.
   *
   * @param  {Number} desiredInternetPort
   * @param  {Number} desiredRelayPort
   * @param  {Object} opts
   * @return {Tunnel}
   */
  async newTunnel (desiredInternetPort = 0, desiredRelayPort = 0, opts = {}) {
    debug(`newTunnel - start`, desiredInternetPort, opts)
    const internetPort = await getAvailablePort(this.sanitizePort(desiredInternetPort))
    const relayPort = await getAvailablePort(this.sanitizePort(desiredRelayPort))
    const relayOptions = { secret: generateSecret() }

    let relay = null
    if (opts.ssl) {
      relayOptions.internetListener = { tlsOptions: opts.tlsOptions }
      relay = new TLSRelayServer({ relayPort, internetPort }, relayOptions)
    } else {
      relay = new RelayServer({ relayPort, internetPort }, relayOptions)
    }
    const tunnel = new Tunnel(internetPort, relay, { secret: relayOptions.secret, ssl: opts.ssl })
    this.tunnels.set(tunnel.internetPort, tunnel)
    debug('newTunnel - end', tunnel, internetPort, relay, this.tunnels.size)
    return tunnel
  }

  sanitizePort (port = 0) {
    const isValid = portValidator(port).validate()
    if (!isValid) { return false }
    if (!Number.isInteger(port)) { return false }
    if (port < 1024 || port > 65535) { return false }
    if (this.tunnels.has(port)) { return false }
    return port
  }

  // very simplistic, we just remove tunnels older than a day
  removeExpiredTunnels (maxAge = 60 * 60 * 24) {
    debug('removeExpiredTunnels - start', { maxAge, size: this.tunnels.size })
    for (const [internetPort, tunnel] of this.tunnels.entries()) {
      const ageInSeconds = ((new Date()).getTime() - tunnel.createdAt.getTime()) / 1000
      const expired = ageInSeconds > maxAge
      debug(` - `, { internetPort, ageInSeconds, expired })
      if (!expired) { continue }
      tunnel.relay.end()
      this.tunnels.delete(internetPort)
      debug(` - deleted`, { internetPort, ageInSeconds, expired })
    }
    debug('removeExpiredTunnels - end', { maxAge, size: this.tunnels.size })
  }

  removeExpiredTunnelsInterval () {
    setInterval(() => {
      this.removeExpiredTunnels(this.maxAge)
    }, 15 * 60 * 1000) // Run every 15min
  }

  remove (internetPort, secret) {
    debug('remove - start', { internetPort, secret })
    const tunnel = this.tunnels.get(internetPort)
    debug('remove - tunnel', { tunnel })
    if (!tunnel) { return false }
    if (tunnel.secret !== secret) { return false }
    tunnel.relay.end()
    this.tunnels.delete(internetPort)
    debug('remove - end', { internetPort, secret })
    return true
  }

  removeAll () {
    debug(`removeAll - start`, this.tunnels.size)
    for (const [internetPort, tunnel] of this.tunnels.entries()) {
      tunnel.relay.end()
      this.tunnels.delete(internetPort)
    }
    debug(`removeAll - end`, this.tunnels.size)
  }
}

module.exports = TunnelManager
