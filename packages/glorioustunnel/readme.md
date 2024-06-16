# glorioustunnel

A free TCP relay/reverse proxy service to **expose any TCP/IP service** running behind a NAT.

**Please refer to the [main glorioustunnel repo](https://github.com/torisetxd/glorioustunnel#readme) for more details.**

## Installation
```bash
npm install -g glorioustunnel
```

## Usage
```bash
glorioustunnel --help                                                                           
  Usage: glorioustunnel --port 8080 [options]

  Expose any local TCP/IP service on the internet.

  Options:

    -v, --version                output the version number
    -p, --port [port]            local TCP/IP service port to tunnel
    -l, --localhost [localhost]  local server (default: localhost)
    -s, --server [server]        glorioustunnel server to use (default: http://tunnel.glorious.host)
    -t, --token [token]          token required by the server (default: freeTunnel)
    -i, --internet-port [port]   the desired internet port on the public server
    --ssl                        enable SSL termination (https://) on the public server    
    -h, --help                   output usage information
```

## Debug
```bash
DEBUG=glorioustunnel:* glorioustunnel --port 8080

# If you wish to debug the underlying tcp-relay as well:
DEBUG=glorioustunnel:*,relay:* glorioustunnel --port 8080
```
