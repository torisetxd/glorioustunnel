'use strict'

const debug = require('debug')('glorioustunnel:tunnelmanager')

const { RelayServer, TLSRelayServer } = require('glorioustunnel-tcp-relay').Server
const net = require('net')

const Tunnel = require('./Tunnel')
const generateSecret = () => require('crypto').randomBytes(20).toString('hex')

/**
 * Manage tunnels.
 */
class TunnelManager {
/**
 * Creates a new instance of the TunnelManager class.
 *
 * @param {Object} [opts={}] - Optional configuration options.
 * @param {number} [opts.maxAge=86400] - The maximum age of tunnels in seconds. Defaults to 1 day.
 * @param {number} [opts.minPort=1024] - The minimum port number for tunnels. Defaults to 1024.
 * @param {number} [opts.maxPort=65535] - The maximum port number for tunnels. Defaults to 65535.
 * @return {void}
 */
  constructor (opts = {}) {
    this.tunnels = new Map() // internetPort -> relayServer map
    this.maxAge = opts.maxAge || 60 * 60 * 24 // 1 day in seconds
    this.settings = {
      minPort: opts.minPort || 1024,
      maxPort: opts.maxPort || 65535
    }
    this.removeExpiredTunnelsInterval()
    debug(`created`, opts)
  }

  /**
   * Asynchronously checks the availability of a port.
   *
   * @param {Object} options - The options for checking the port availability.
   * @return {Promise<boolean>} A Promise that resolves with a boolean indicating port availability.
   */
  async checkAvailablePort (options) {
    return new Promise((resolve, reject) => {
      const server = net.createServer()
      server.unref()

      server.on('error', () => {
        resolve(false)
      })

      server.listen(options, () => {
        server.address()
        server.close((err) => {
          if (err) { reject(err) }
          resolve(true)
        })
      })
    })
  }

  /**
   * Finds an available port within the specified range.
   *
   * @param {Object} options - The options for finding the available port.
   * @param {number} [options.port] - The desired port to start searching from.
   * @param {Array<number>} [options.exclude] - The ports to exclude from the search.
   * @return {Promise<number>} - A promise that resolves with the available port.
   * @throws {Error} - If no available port is found within the specified range.
   */
  async getAvailablePort (options = {}) {
    let port = Math.max(options.port || this.settings.minPort, this.settings.minPort)
    for (; port <= this.settings.maxPort; port++) {
      if (options.exclude && options.exclude.includes(port)) { continue }
      let isValid = await this.checkAvailablePort({port})
      if (isValid) {
        return port
      } else {
        continue
      }
    }
    throw new Error('Could not find an available port')
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
    const internetPort = await this.getAvailablePort({port: desiredInternetPort})
    const relayPort = await this.getAvailablePort({port: desiredRelayPort, exclude: [internetPort]})
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
