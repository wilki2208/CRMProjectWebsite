from __future__ import annotations

import os
import ssl
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))
DIRECTORY = Path(os.environ.get("DIRECTORY", Path(__file__).resolve().parent)).resolve()
TLS_CERTFILE = os.environ.get("TLS_CERTFILE")
TLS_KEYFILE = os.environ.get("TLS_KEYFILE")


def main() -> None:
    handler = partial(SimpleHTTPRequestHandler, directory=str(DIRECTORY))
    server = ThreadingHTTPServer((HOST, PORT), handler)

    if TLS_CERTFILE and TLS_KEYFILE:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(TLS_CERTFILE, TLS_KEYFILE)
        server.socket = context.wrap_socket(server.socket, server_side=True)
        scheme = "https"
    else:
        scheme = "http"

    print(f"Serving {DIRECTORY} on {scheme}://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
