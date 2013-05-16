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
HS_URL = base_url("w/index.php?title={0}&action=edit")
LOCATION_STRING = "coordinate"
SPACE_API = "http://openspace.slopjong.de/directory.json"

def get_etree(url):
    """Return a etree from an url using request
    """
    resp = requests.get(url)
    tree = etree.parse(io.StringIO(resp.text))
    return tree

def get_hackerspaces():
    tree = get_etree(base_url(SWISS_HS))
    links = tree.xpath('//*[@id="mw-content-text"]/table[2]//td//text()')
    hs_names = links[::2]

    hackerspaces = {}
    for name in hs_names:
        hackerspaces[name] = get_hackerspace(name)

        #space api url
        space_url = get_space_api_url(name)
        if space_url:
            hackerspaces[name]['space_url'] = space_url
    return hackerspaces

def get_space_api_url(name):
    req = requests.get(SPACE_API)
    j = json.loads(req.text)
    return j.get(name)
    
def get_hackerspace(name):
    url = HS_URL.format(name)
    tree = get_etree(url)

    text_box = tree.xpath('//*[@id="wpTextbox1"]//text()')
    text = "".join(text_box)

    #select the first string between {{ and }}
    #this use a simple descent parser
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

    #split over | for key value pair
    #and split over = for key value
    ret = {}
    for kv in result.split("|"):
        try:
            key, value = [el.replace('\n', ' ').strip() for el in kv.split("=")]
            if key == LOCATION_STRING:
                value = clean_location(value)
            ret[key] = value
        except ValueError:
            pass
    return ret

def clean_location(location_string):
    """This method will remove all non numeric or commas or dot from a string, then
    split it on the comma and select only the 2 first element. This has the goal to 
    clean any string that is malformed
    """
    return non_numeric.sub('', location_string).split(",")[:2]

if __name__ == '__main__':
    file_path = os.path.join(os.path.dirname(os.path.dirname((os.path.abspath(__file__)))), "site/list")
    with open(file_path, 'w') as f:
        hs = get_hackerspaces()
        print(hs)
        json.dump(hs, f)
