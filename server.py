from __future__ import annotations

import os
import ssl
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))
DIRECTORY = Path(os.environ.get("DIRECTORY", Path(__file__).resolve().parent)).resolve()
TLS_CERTFILE = os.environ.get("TLS_CERTFILE")
TLS_KEYFILE = os.environ.get("TLS_KEYFILE")
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://127.0.0.1:8000")
BACKEND_API_KEY = os.environ.get("BACKEND_API_KEY", "").strip()

SKIP_PROXY_HEADERS = {
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}


class WebsiteHandler(SimpleHTTPRequestHandler):
    def _proxy_to_backend(self, method: str) -> None:
        if not self.path.startswith("/api/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        target_url = f"{BACKEND_BASE_URL}{self.path}"
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(content_length) if content_length > 0 else None

        headers: dict[str, str] = {}
        content_type = self.headers.get("Content-Type")
        if content_type:
            headers["Content-Type"] = content_type
        accept = self.headers.get("Accept")
        if accept:
            headers["Accept"] = accept
        user_agent = self.headers.get("User-Agent")
        if user_agent:
            headers["User-Agent"] = user_agent
        forwarded_for = self.client_address[0] if self.client_address else ""
        if forwarded_for:
            headers["X-Forwarded-For"] = forwarded_for
        if BACKEND_API_KEY:
            headers["X-API-Key"] = BACKEND_API_KEY

        request = Request(target_url, data=body, method=method, headers=headers)

        try:
            with urlopen(request, timeout=20) as response:
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() in SKIP_PROXY_HEADERS:
                        continue
                    self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())
                return
        except HTTPError as exc:
            payload = exc.read()
            self.send_response(exc.code)
            for key, value in exc.headers.items():
                if key.lower() in SKIP_PROXY_HEADERS:
                    continue
                self.send_header(key, value)
            self.end_headers()
            if payload:
                self.wfile.write(payload)
            return
        except URLError:
            self.send_response(HTTPStatus.BAD_GATEWAY)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                b'{"detail":"Unable to reach CRM backend from website service."}'
            )
            return

    def do_GET(self) -> None:
        if self.path.startswith("/api/"):
            self._proxy_to_backend("GET")
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path.startswith("/api/"):
            self._proxy_to_backend("POST")
            return
        self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)


def main() -> None:
    handler = partial(WebsiteHandler, directory=str(DIRECTORY))
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
