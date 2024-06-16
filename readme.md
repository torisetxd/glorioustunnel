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

  Usage: cli --port 8080 [options]

  Expose any local TCP/IP service on the internet.

  Options:
    -v, --version                output the version number
    -p, --port [port]            local TCP/IP service port to tunnel
    -l, --localhost [localhost]  local server (default: "localhost")
    -s, --server [server]        glorious tunnel server to use
    -t, --token [token]          token required by the server
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

If your use-case is to simply tunnel local HTTP/TCP server traffic, localtunnel/ngrok are suggested. 

**Technical differences:**
glorioustunnel uses a dedicated public port per tunnel, simplifying TCP/IP traffic routing without HTTP header inspection.

## Todo
  
🟥 -> Not Done
🟨 -> Not finished
🟩 -> Done and works.

### Move Default Port Ranges to a setting 🟥
- Make sure to modify the limits for your ports since this was a quick fix (for my case) and you will need to modify the package's code. Will fix soon.

## Free server?

Used to offer a free server till I realized this simply cant scale enough.
Currently this is for my unreleased host for testing purposes.

## Status

It's doing what it says on the tin. Certain things could be improved and battle-hardened.

## Contributing

Contributions are welcome.