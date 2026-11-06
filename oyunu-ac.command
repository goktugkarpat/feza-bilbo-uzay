#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
python3 - <<'PY'
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading, webbrowser
root = Path.cwd()
server = ThreadingHTTPServer(('127.0.0.1', 0), SimpleHTTPRequestHandler)
url = 'http://127.0.0.1:%d/' % server.server_port
print('Feza ve Bilbo: Uzay Macerası açılıyor. Oynarken bu pencere açık kalsın.')
threading.Timer(0.7, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
PY
