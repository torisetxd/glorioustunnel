'use strict'

const debug = require('debug')('glorioustunnel:server')

const path = require('path')
const http = require('http')
const https = require('https')
const Koa = require('koa')
const Router = require('koa-router')
const Greenlock = require('greenlock-koa')
const bodyParser = require('koa-bodyparser')

const TunnelManager = require('./TunnelManager')

const app = new Koa()
const router = new Router()

class Server {
  /**
   * Constructs a new instance of the Server class.
   *
   * @param {Object} opts - An optional object containing configuration options.
   * @param {string} opts.landingPage - The URL of the landing page. Defaults to 'https://github.com/torisetxd/glorioustunnel'.
   * @param {number} opts.serverPort - The port number to use for the server. Defaults to 3000.
   * @param {string} opts.serverDomain - The domain to use for the server. Defaults to '127.0.0.1'.
   * @param {string} opts.serverToken - The token to use for authentication. Defaults to 'SecureToken'.
   * @param {Object} opts.managerSettings - An object containing the minimum and maximum port numbers and maximum age for the tunnel manager. Defaults to { minPort: 1024, maxPort: 65535, maxAge: 86400 }.
   */
  constructor (opts = {}) {
    this.landingPage = opts.landingPage || 'https://github.com/torisetxd/glorioustunnel'
    this.serverPort = parseInt(opts.serverPort) || 3000
    this.serverDomain = opts.serverDomain || '127.0.0.1'
    this.serverToken = opts.serverToken || 'SecureToken'
    this.tunnelManagerSettings = opts.managerSettings || {
      minPort: 1024,
      maxPort: 65535,
      maxAge: 86400
    }

    this.manager = new TunnelManager(this.tunnelManagerSettings)
    this._ssl = {
      enabled: (process.env.SSL_ENABLED === 'true') || false,
      port: parseInt(process.env.SSL_PORT) || 443,
      debug: (process.env.SSL_DEBUG === 'true') || false,
      email: process.env.SSL_EMAIL,
      acme: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      dir: process.env.SSL_DIR || require('os').homedir() + '/acme'
    }
    if (process.env.SSL_PRODUCTION === 'true') {
      this._ssl.acme = 'https://acme-v02.api.letsencrypt.org/directory'
    }
    this._greenlock = this._createGreenlock()
    this._server = null
    this._secureServer = null
    debug('created', opts)
  }

  /**
   * Generates a banner message to be displayed when the server token is the default token.
   *
   * @param {Object} body - The request body object.
   * @return {string} The banner message to be displayed.
   */
  generateBannerMessage (body) {
    if (this.serverToken !== 'SecureToken') { return }
    return `
  You're using the default token. Change it for security reasons.
  Contributions welcome: ${this.landingPage}
    `
  }

  /**
   * Creates and starts the server.
   *
   * @return {Promise<Server>} A promise that resolves to the created server instance.
   */
  async create () {
    // error handler
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        ctx.status = err.status || 500
        ctx.body = {
          success: false,
          message: err.message
        }
        ctx.app.emit('error', err, ctx)
      }
    })

    router.all('/', ctx => {
      ctx.redirect(this.landingPage)
      ctx.status = 302
    })

    router.get('/status', async (ctx, next) => {
      debug('/status')
      ctx.body = {
        tunnels: this.manager.tunnels.size,
        mem: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      }
    })

    router.get('/status/versions', async (ctx, next) => {
      debug('/status/versions')
      ctx.body = [require('glorioustunnel-tcp-relay/package.json')]
    })

    router.get('/status/:internetPort', async (ctx, next) => {
      debug('/status', ctx.params.internetPort)
      const tunnel = this.manager.tunnels.get(parseInt(ctx.params.internetPort))
      if (!tunnel) { return ctx.throw(400, 'Tunnel not found') }
      const relay = tunnel.relay
      ctx.body = {
        internetPort: relay.internetPort,
        relayPort: relay.relayPort,
        createdAt: tunnel.createdAt
      }
    })

    // curl -d '{"internetPort":"2666", "relayPort":"2333", "serverToken": "glorioustunnel-freeTunnel"}' -H "Content-Type: application/json" -X POST http://localhost:3000/create
    router.post('/create', async (ctx, next) => {
      debug('/create', ctx.request.body)
      const body = ctx.request.body
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const opts = { }
        if (body.ssl) {
          debug('SSL requested')
          opts.ssl = true
          opts.tlsOptions = await this._getTlsOptions()
        }
        if (body.ssl && !this._ssl.enabled) {
          debug('Warning, client requested SSL but only self-signed certs available.')
        }
        const tunnel = await this.manager.newTunnel(parseInt(body.internetPort) || 0, parseInt(body.relayPort) || 0, opts)
        ctx.body = {
          success: !!tunnel.relay, // wtf???
          createdAt: tunnel.createdAt,
          relayPort: tunnel.relay.relayPort,
          internetPort: tunnel.relay.internetPort,
          secret: tunnel.secret,
          uri: `${this.serverDomain}:${tunnel.relay.internetPort}`,
          expiresIn: this.manager.maxAge
        }
        if (tunnel.ssl) {
          ctx.body.uri = `https://${this.serverDomain}:${tunnel.relay.internetPort}`
          ctx.body.ssl = true
        }
        ctx.body.serverBanner = this.generateBannerMessage(ctx.body)
        debug('/create - response', ctx.body)
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel creation failed`)
      }
    })

    router.post('/delete', async (ctx, next) => {
      debug('/delete', ctx.request.body)
      const body = ctx.request.body
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const success = this.manager.remove(parseInt(body.internetPort) || 0, body.secret)
        ctx.body = {
          success: !!success,
          message: success
        }
        debug('/delete - response', ctx.body)
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel deletion failed`)
      }
    })

    app.use(bodyParser())
    app.use(router.routes())
    app.use(router.allowedMethods())

    app.use(async function pageNotFound (ctx) {
      ctx.throw(404, `Not found`)
    })

    app.on('error', err => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(err)
      }
    })

    await new Promise(resolve => {
      this._server = http.createServer(
        this._greenlock.tlsOptions,
        this._greenlock.middleware(app.callback())
      ).listen(this.serverPort, () => {
        console.log('Server listening on port', this.serverPort)
        return resolve()
      })
    })
    await new Promise(resolve => {
      if (!this._ssl.enabled) { return resolve() }
      this._secureServer = https.createServer(
        this._greenlock.tlsOptions,
        this._greenlock.middleware(app.callback())
      ).listen(this._ssl.port, () => {
        console.log('Secure server listening on port', this._ssl.port)
        return resolve()
      })
    })
    return this
  }

  async _getTlsOptions () {
    if (!this._ssl.enabled) {
      debug('Note: Using self-signed certs.')
      const certfolder = path.join(__dirname, 'self-signed-certs')
      return {
        key: path.join(certfolder, 'server-key.pem'),
        cert: path.join(certfolder, 'server-crt.pem'),
        ca: path.join(certfolder, 'ca-crt.pem')
      }
    }
    const configDir = this._ssl.dir
    const hostname = this.serverDomain
    const makePathAbsolute = (p) => p.replace(':configDir', configDir).replace(':hostname', hostname)
    const tlsOptions = {
      key: makePathAbsolute(this._greenlock.privkeyPath),
      cert: makePathAbsolute(this._greenlock.certPath),
      ca: makePathAbsolute(this._greenlock.fullchainPath)
    }
    return tlsOptions
  }

  _createGreenlock () {
    return Greenlock.create({
      version: 'draft-11', // Let's Encrypt v2
      server: this._ssl.acme,
      email: this._ssl.email,
      agreeTos: true,
      approveDomains: [ this.serverDomain ],
      communityMember: false,
      configDir: this._ssl.dir,
      debug: this._ssl.debug
    })
  }

  /**
   * Closes the server by removing all tunnels and stopping the server.
   *
   * @return {void} This function does not return anything.
   */
  close () {
    this.manager.removeAll()
    this._server.close()
    debug('closed')
  }
}

module.exports = Server
