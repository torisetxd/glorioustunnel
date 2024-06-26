'use strict'

const CONFIG = {
  projectName: 'glorioustunnel',
  serviceName: 'glorioustunnel-service',
  deployUser: 'deploy',
  hosts: {
    vagrant: '192.168.33.10',
    remote: 'tunnel.glorious.host'
  }
}

module.exports = {
  apps: [
    {
      name: CONFIG.serviceName,
      script: 'app.js',
      instances: 1,
      autorestart: true
    }
  ],

  deploy: {
    remote: {
      key: `~/.ssh/${CONFIG.projectName}`,
      user: CONFIG.deployUser,
      host: CONFIG.hosts.remote,
      ref: 'origin/master',
      repo: 'https://github.com/torisetxd/glorioustunnel.git',
      path: `/home/${CONFIG.deployUser}/${CONFIG.serviceName}`,
      'post-deploy': 'cd deploy/service && npm install glorioustunnel-server@latest; authbind --deep pm2 startOrRestart ecosystem.config.js',
      env: {
        NODE_ENV: 'production',
        DEBUG: false,
        SERVER_PORT: 80,
        SERVER_DOMAIN: `tunnel.glorious.host`,
        SERVER_TOKEN: 'freeTunnel',
        SSL_ENABLED: true,
        SSL_DEBUG: false,
        SSL_PORT: 443,
        SSL_EMAIL: 'mail@tunnel.glorious.host',
        SSL_PRODUCTION: true
      }
    },

    vagrant: {
      key: `~/.ssh/${CONFIG.projectName}`,
      ssh_options: 'StrictHostKeyChecking=no',
      user: CONFIG.deployUser,
      host: CONFIG.hosts.vagrant,
      ref: 'origin/master',
      repo: 'https://github.com/torisetxd/glorioustunnel.git',
      path: `/home/${CONFIG.deployUser}/${CONFIG.serviceName}`,
      'post-deploy': 'cd deploy/service && npm install glorioustunnel-server@latest && authbind --deep pm2 startOrRestart ecosystem.config.js',
      env: {
        NODE_ENV: 'development',
        DEBUG: 'glorioustunnel:*',
        SERVER_PORT: 80,
        SERVER_DOMAIN: `${CONFIG.hosts.vagrant}.xip.io`,
        SERVER_TOKEN: 'freeTunnel'
      }
    }
  }
}
