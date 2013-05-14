from lxml import etree
import io
import requests
from urllib.parse import urljoin
from functools import partial
import bottle
import functools
from collections import namedtuple
import time
import re

non_numeric = re.compile('[^,\d.]+')

BASE_URL = "http://hackerspaces.org"
base_url = partial(urljoin, BASE_URL)
SWISS_HS = "/wiki/switzerland"

app = bottle.Bottle("hackerspace.ch")

CachedValue = namedtuple('CachedValue', ['time', 'value'])

class Cache(object):
    def __init__(self):
        self.cache = {}

    def cached(self, timeout):
        def decorator(f):
            def get_value(*args, **kwargs):
                try:
                    value = self.cache[f]
                    if time.time() > (value.time + timeout):
                        #too old 
                        raise KeyError
                except KeyError:
                    value = CachedValue(time.time(), f(*args, **kwargs))
                    self.cache[f] = value
                return value.value

            #the new function wrapped
            @functools.wraps(f)
            def decorated_function(*args, **kwargs):
                return get_value(*args, **kwargs)
            return decorated_function
        return decorator

cache = Cache()

@cache.cached(timeout=60*60)
def get_hackerspaces():
    resp = requests.get(base_url(SWISS_HS))
    tree = etree.parse(io.StringIO(resp.text))
    links = tree.xpath('//*[@id="mw-content-text"]/table[2]//td//text()')
    hs_names = links[::2]
    coordinates = links[1::2]
    clean_coordinates = map(lambda a: non_numeric.sub('', a), coordinates)
    return dict(zip(hs_names, clean_coordinates))

@app.route('/list')
def list_hackerspaces():
    return get_hackerspaces()


if __name__ == '__main__':
    app.run()
