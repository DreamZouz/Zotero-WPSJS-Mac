#!/usr/bin/env python3
"""Local WPS to Zotero Connector bridge (standard library only)."""
import errno
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
import sys
import json
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import re
import time


def command_name(body):
    try:
        payload = json.loads(body)
        name = payload.get('command', '') if isinstance(payload, dict) else ''
        return name if isinstance(name, str) and re.fullmatch(r'[A-Za-z.]{1,80}', name) else '-'
    except (ValueError, UnicodeError):
        return '-'

ZOTERO_PORT = 23119
PROXY_PORT = 21931
HOP_HEADERS = {'connection', 'keep-alive', 'proxy-authenticate',
               'proxy-authorization', 'te', 'trailer', 'transfer-encoding',
               'upgrade', 'content-length', 'host'}


def stop_proxy():
    connection = http.client.HTTPConnection('127.0.0.1', PROXY_PORT, timeout=3)
    try:
        connection.request('POST', '/stopproxy', body=b'')
        connection.getresponse().read()
    except (OSError, http.client.HTTPException):
        pass
    finally:
        connection.close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        # Do not log citation or document contents.
        pass

    def reply(self, status, body=b'', headers=()):
        self.send_response(status)
        for key, value in headers:
            if key.lower() not in HOP_HEADERS and not key.lower().startswith('access-control-'):
                self.send_header(key, value)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers',
                         'Content-Type, Authorization, X-Zotero-Connector-API-Version, Zotero-Allowed-Request')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.reply(204)

    def do_GET(self):
        self.forward()

    def do_POST(self):
        if self.path == '/diagnostic':
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 <= length <= 1024:
                self.reply(400)
                return
            logging.info('WPS step=%s', command_name(self.rfile.read(length)))
            self.reply(200, b'{}', [('Content-Type', 'application/json')])
            return
        if self.path == '/stopproxy':
            self.reply(200, b'Proxy stopping')
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return
        self.forward()

    def forward(self):
        if not self.path.startswith('/connector/'):
            self.reply(404, b'Unknown endpoint')
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0 or self.headers.get('Transfer-Encoding'):
                raise ValueError('Invalid body framing')
        except ValueError:
            self.reply(400, b'Invalid request body length')
            return
        body = self.rfile.read(length)
        started = time.monotonic()
        request_id = str(time.monotonic_ns())
        logging.info('%s request %s command=%s bytes=%s', request_id,
                     self.path.split('?')[0], command_name(body), len(body))
        headers = {key: value for key, value in self.headers.items()
                   if key.lower() not in HOP_HEADERS
                   and key.lower() != 'x-zotero-connector-api-version'}
        # Identify this integration client to Zotero's browser request check.
        headers['X-Zotero-Connector-API-Version'] = '3'
        connection = http.client.HTTPConnection('127.0.0.1', ZOTERO_PORT, timeout=600)
        try:
            connection.request(self.command, self.path, body=body, headers=headers)
            response = connection.getresponse()
            content = response.read()
            logging.info('%s response status=%s command=%s bytes=%s seconds=%.3f',
                         request_id, response.status, command_name(content),
                         len(content), time.monotonic() - started)
            self.reply(response.status, content, response.getheaders())
            logging.info('%s delivered', request_id)
        except (OSError, http.client.HTTPException) as error:
            logging.error('%s failure=%s seconds=%.3f', request_id,
                          type(error).__name__, time.monotonic() - started)
            self.reply(502, b'Cannot communicate with Zotero on 127.0.0.1:23119')
        finally:
            connection.close()


class BridgeServer(ThreadingHTTPServer):
    # socketserver's default listen backlog is 5, which is small enough that the
    # kernel refuses the tail of the add-on's request burst. The refused
    # connection reaches WPS as an XHR error reported as "is Zotero running?",
    # even though Zotero is healthy and answering /connector/ping.
    request_queue_size = 256


def main(argv):
    if len(argv) > 1 and argv[1] == 'kill':
        stop_proxy()
        return
    handler = RotatingFileHandler(Path(__file__).resolve().with_name('proxy-diagnostic.log'),
                                  maxBytes=256000, backupCount=1)
    logging.basicConfig(handlers=[handler], level=logging.INFO,
                        format='%(asctime)s %(message)s')
    try:
        server = BridgeServer(('127.0.0.1', PROXY_PORT), Handler)
    except OSError as error:
        if error.errno == errno.EADDRINUSE:
            return
        raise
    with server:
        logging.info('Bridge started')
        server.serve_forever()


if __name__ == '__main__':
    main(sys.argv)
