# ✨ Glorious Tunnel

This is a fork of [berstend/hypertunnel](https://github.com/berstend/hypertunnel) with some modifications to match our needs and specific port requierements.

## Installation

```bash
# Use directly with no installation (npx is part of npm):
❯❯❯ npx glorioustunnel --port 8080

# Or install globally:
❯❯❯ npm install -g glorioustunnel
```

## Usage

```bash
❯❯❯ glorioustunnel --help

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

## Examples

### Example: Local web server

```bash
# Run a static web server in your current directory:
❯❯❯ npx http-server -p 7777

# Create a glorioustunnel to make that server accessible from the internet:
❯❯❯ npx glorioustunnel -p 7777
```

### Example: Remote SSH login

```bash
# Create a tunnel for the local SSH service running on port 22
❯❯❯ npx glorioustunnel --port 22
```

### Example: Run and expose a local telnet chat server

```bash
❯❯❯ npx netchat server -p 3000
```

In another terminal:

```bash
❯❯❯ npx glorioustunnel -p 3000
```

## Comparison to localtunnel/ngrok

If your use-case is to simply tunnel local HTTP web server traffic, localtunnel/ngrok are suggested. 

**Technical differences:**
glorioustunnel uses a dedicated public port per tunnel, simplifying TCP/IP traffic routing without HTTP header inspection.

## Free server: tunnel.glorious.host

This fork offers a free server (temporarily) similar to localtunnel/ngrok. 
Currently this is for my unreleased host for testing purposes however you may use it while it remains in beta testing.

**Limits:** There are currently no enforced usage limits.

## Status

It's doing what it says on the tin. Certain things could be improved and battle-hardened.

## Contributing

Contributions are welcome.