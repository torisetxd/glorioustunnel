'use strict'

const { Server } = require('glorioustunnel-server')

async function startServer () {
  // Here you would connect to http://example.com:3000 with the token 'SecureToken'
  const server = new Server({
    serverPort: 3000, // Port to run the server on
    serverDomain: 'example.com', // Your domain
    serverToken: 'SecureToken', // Your secret token for authentication
    managerSettings: {
      minPort: 1024,
      maxPort: 65535,
      maxAge: 86400
    }
  })

  await server.create()
}

startServer().catch(console.error)
