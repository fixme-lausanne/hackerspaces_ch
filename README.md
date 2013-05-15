hackerspaces.ch
===============

** A project to squat the hackerspaces.ch domain name. The original goal was to make a list of hackerspaces in switzerland.

Scraper
-------
** A scraper exist that will search in hackerspaces.org for any hackerspaces registered in switzerland. It will then provide a json file in "site/list". The key are the names of the hackerspace and the value a dictionnary containing all the information in the hackerspace. If an information doesn't exist, the key will be absent

Site
----
** The site use the list json to provide a map with one marker per hackerspace.
** to test it, just open the index.html, it should work out of the box.
** The directory structure for the site is as follow
*** libs : javascript library or element needed by them.
*** script : script used directly in the html.
*** icons : png icons used in the map, the content was created at fixme.

** To launch a devloppement version, simply execute the dev.sh script. This will launch a simple http server in the site directory on port 8000.
