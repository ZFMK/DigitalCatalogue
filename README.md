# DigitalCatalogue
Webportal and Digital Catalogue for the Natural History Collections of ZFMK

Programming: B. Quast

Language: Python

Database: MySQL

URL: https://collections.zfmk.de/

DOI: 10.20363/zfmk-app.digitalcatalogue


## Dependencies

* Solr indexing service (configuration files comming soon)
* Transfer script from DiversityWorkbench to catalogue's MySQL database (comming soon)


## Setup

Setup and activate Python virtual environment
  
    virtualenv --no-site-packages --distribute -p /usr/bin/python3.5 DigitalCatalogue
    cd DigitalCatalogue/
    source bin/activate
    
Clone repository

    git clone https://github.com/bjquast/DigitalCatalogue.git

Run setup.py to install required Python packages

    python setup.py develop

Copy production.ini.org to production.ini

    cp production.ini.org production.ini

Change server, user, and password settings in production.ini

    nano pserve production.ini

Run web-app

    pserve production.ini


The web-app will listen to the port set in production.ini section [server:main]. This is 6544 by default. The web-app can be opened via http://localhost:6544. To set it up for production, a proxy must be set in your web server configuration.
