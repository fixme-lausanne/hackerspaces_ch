#!/usr/bin/env bash
port=8000
cd site
python -m http.server $port || python -m SimpleHTTPServer $port
