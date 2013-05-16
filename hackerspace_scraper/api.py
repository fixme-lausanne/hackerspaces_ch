from lxml import etree
import json
import os
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
HS_URL = "http://hackerspaces.org/w/index.php?title={0}&action=edit"
LOCATION_STRING = "coordinate"
SPACE_API = "http://openspace.slopjong.de/directory.json"

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
    hackerspaces = {}
    for name in hs_names:
        hackerspaces[name] = get_hackerspace(name)
        hackerspaces[name]['space_url'] = get_space_api_url(name)
    return hackerspaces

def get_space_api_url(name):
    req = requests.get(SPACE_API)
    j = json.loads(req.text)
    return j.get(name, '')
    
def get_hackerspace(name):
    url = HS_URL.format(name)
    resp = requests.get(url)
    tree = etree.parse(io.StringIO(resp.text))
    text_box = tree.xpath('//*[@id="wpTextbox1"]//text()')
    text = "".join(text_box)
    count = 0
    result = ""
    for char in text:
        if char == '{':
            count += 1
        elif char == '}':
            count -= 1
            if count == 0 and result:
                break
        elif count == 2:
            result += char
    ret = {}
    for kv in result.split("|"):
        try:
            k, v = map(lambda a: a.replace('\n', ' ').strip(), kv.split("="))
            if k == LOCATION_STRING:
                v = clean_location(v)
            ret[k] = v
        except ValueError:
            pass
    return ret

def clean_location(location_string):
    return non_numeric.sub('', location_string).split(",")



@app.route('/list')
def list_hackerspaces():
    return get_hackerspaces()


if __name__ == '__main__':
    file_path = os.path.join(os.path.dirname(os.path.dirname((os.path.abspath(__file__)))), "site/list")
    with open(file_path, 'w') as f:
        hs = list_hackerspaces()
        print(hs)
        json.dump(hs, f)
