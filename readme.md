# ✨ Glorious Tunnel

This is a customized version of [berstend/hypertunnel](https://github.com/berstend/hypertunnel) with modifications to meet specific port requirements and needs.

## Installation

To use without installing:
```bash
npx glorioustunnel --port 8080
```

To install globally:
```bash
npm install -g glorioustunnel
```

## Usage

To see available options:
```bash
glorioustunnel --help
```

Usage:
```bash
glorioustunnel --port 8080 [options]
```

Expose any local TCP/IP service on the internet with these options:
- `-v, --version`: Show version number
- `-p, --port [port]`: Local TCP/IP service port to tunnel
- `-l, --localhost [localhost]`: Local server (default: "localhost")
- `-s, --server [server]`: Glorious Tunnel server to use
- `-t, --token [token]`: Token required by the server
- `-i, --internet-port [port]`: Desired internet port on the public server
- `--ssl`: Enable SSL termination (https://) on the public server
- `-h, --help`: Show help information

## Examples

### Example: Local Web Server

Run a static web server in your current directory:
```bash
npx http-server -p 7777
```

Create a tunnel to make that server accessible from the internet:
```bash
npx glorioustunnel -p 7777
```

### Example: Remote SSH Login

Create a tunnel for the local SSH service running on port 22:
```bash
npx glorioustunnel --port 22
```

### Example: Local Telnet Chat Server

Run a local telnet chat server:
```bash
npx netchat server -p 3000
```

In another terminal, create a tunnel to make the chat server accessible:
```bash
npx glorioustunnel -p 3000
```

## Comparison to Localtunnel/ngrok

For simple HTTP/TCP server traffic tunneling, consider using localtunnel or ngrok. 

**Technical differences:**
Glorious Tunnel uses a dedicated public port per tunnel, simplifying TCP/IP traffic routing without HTTP header inspection.

## Todo

🟥 -> Not Done  
🟨 -> In Progress  
🟩 -> Done

- Move Default Port Ranges to a setting 🟥
  - Modify the port limits in the package code as needed. This will be fixed soon.

## Free Server?

A free server was offered but was not scalable, so no longer avaliable.

## Status

The tool functions as described. Improvements are possible.

## Contributing

Contributions are welcome.