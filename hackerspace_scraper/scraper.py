from lxml import etree
from urlparse import urljoin
import io
import json
import os
import re
import requests
import sys


file_path = os.path.join(os.path.dirname(os.path.dirname((os.path.abspath(__file__)))), "site/list")

class Hackerspaces(object):
    LOCATION_KEY = "coordinate"
    LOGO_KEY = "logo"
    BASE_URL = "http://hackerspaces.org"

    @staticmethod
    def absolute_url(path):
        return urljoin(Hackerspaces.BASE_URL, path)

    @staticmethod
    def wiki_page(title):
        return urljoin(Hackerspaces.absolute_url('wiki/'), title)

    @staticmethod
    def country_list(country, offset=0):
        return "http://hackerspaces.org/w/api.php?action=ask&query=[[country::{0}]]\n[[Category:Hackerspace]]&format=json&offset={1!s}".format(country, offset)

    @staticmethod
    def edit_page(title):
        url = Hackerspaces.absolute_url(u"w/index.php?title={0}&action=edit".format(title))
        return url

    @staticmethod
    def url_for_file(filename):
        """Format the url 
        """
        url = Hackerspaces.wiki_page('File') + u":{0}".format(filename)
        tree = Hackerspaces.get_etree(url)
        url = tree.xpath('//a[@class="internal"]/@href')
        if len(url) == 1:
            return url[0]

    #regex matching all the non numeric character including 
    NON_NUMERIC = re.compile('[^,\d.]+')

    #url used to fetch information about the space api
    SPACE_API = "http://spaceapi.net/directory.json"

    def __init__(self, country):
        """docstring for """
        super(Hackerspaces, self).__init__()
        self.country = country
        #load the space api directory


    @staticmethod
    def get_json(url):
        print(url)
        resp = requests.get(url)
        return resp.json()

    @staticmethod
    def get_etree(url, browser_dump=False):
        """Return a etree from an url using request
        """
        resp = requests.get(url)
        if browser_dump:
            with open('dump', 'w') as f:
                f.write(resp.content)
            import webbrowser
            webbrowser.open('dump')
            exit(0)

        tree = etree.parse(io.StringIO(resp.text))
        return tree

    def get_hackerspaces(self):
        offset = 0
        hackerspaces = {}
        while 1:
            hackerspaces_page = Hackerspaces.get_json(Hackerspaces.country_list(self.country, offset=offset))
            print hackerspaces_page
            hackerspaces.update(hackerspaces_page['query']['results'])
            if 'query-continue-offset' in hackerspaces_page.keys():
                offset =  int(hackerspaces_page['query-continue-offset'])
            else:
                print "END"
                break

        import IPython
        IPython.embed()

        hs_names = hackerspaces.keys()

        hackerspaces = {}
        for name in hs_names:
            print name
            hackerspaces[name] = self.get_hackerspace(name)

            #space api url
            space_url = self.get_space_api_url(name)
            if space_url:
                hackerspaces[name]['space_url'] = space_url
        return hackerspaces

    def get_space_api_url(self, name):
        req = requests.get(Hackerspaces.SPACE_API)
        j = json.loads(req.text)
        return j.get(name)

    def get_hackerspace(self, name):
        url = Hackerspaces.edit_page(name)
        tree = self.get_etree(url)
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
                if key == Hackerspaces.LOCATION_KEY:
                    value = Hackerspaces.clean_location(value)
                elif key == Hackerspaces.LOGO_KEY:
                    if value:
                        value = Hackerspaces.absolute_url(Hackerspaces.url_for_file(value))
                if value:
                    ret[key] = value
            except ValueError:
                pass
        return ret

    @staticmethod
    def clean_location(location_string):
        """This method will remove all non numeric or commas or dot from a string, then
        split it on the comma and select only the 2 first element. This has the goal to
        clean any string that is malformed
        """
        return hackerspaces.NON_NUMERIC.sub('', location_string).split(",")[:2]

if __name__ == '__main__':
    if len(sys.argv) == 3:
        hackerspaces = Hackerspaces(sys.argv[1])
    else:
        hackerspaces = Hackerspaces('Germany')
    with open(file_path, 'w') as f:
        hs = hackerspaces.get_hackerspaces()
        print(hs)
        json.dump(hs, f)
