# glorioustunnel-server

A TCP relay/reverse proxy server to **expose any TCP/IP service** running behind a NAT.

**Please refer to the [main glorioustunnel repo](https://github.com/torisetxd/glorioustunnel#readme) for more details.**

## Installation
```bash
npm install -g glorioustunnel-server
```

## Usage
```bash
glorioustunnel-server --help

  Options:

    -v, --version          output the version number
    -p, --port [port]      web server port (default: 3000)
    -d, --domain [domain]  public web server domain (default: glorioustunnel.lvh.me)
    -t, --token [token]    token required to be sent by clients (default: freeTunnel)
    -h, --help             output usage information
```

## Debug
```bash
DEBUG=glorioustunnel:* glorioustunnel-server

# If you wish to debug the underlying tcp-relay as well:
DEBUG=glorioustunnel:*,relay:* glorioustunnel-server
```
