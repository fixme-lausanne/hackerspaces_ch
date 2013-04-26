from lxml import etree
import io
import requests
from urllib.parse import urljoin
from functools import partial

BASE_URL = "http://hackerspaces.org"
base_url = partial(urljoin, BASE_URL)
SWISS_HS = "/wiki/switzerland"

def get_hackerspaces():
    print(BASE_URL)
    resp = requests.get(base_url(SWISS_HS))
    tree = etree.parse(io.StringIO(resp.text))
    links = tree.xpath('//div[@id="mw-content-text"]/table/tr/td[@width="50%"]/ul[1]/li/a/@href')
    names = tree.xpath('//div[@id="mw-content-text"]/table/tr/td[@width="50%"]/ul[1]/li/a/text()')
    links = map(base_url, links)
    list(map(get_hackerspace, links))

def get_hackerspace(url):
    resp = requests.get(url)
    tree = etree.parse(io.StringIO(resp.text))
    #parse the content




get_hackerspaces()
