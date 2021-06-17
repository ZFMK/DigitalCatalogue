# DigitalCatalogue
Webportal and Digital Catalogue for the Natural History Collections of ZFMK

Programming: B. Quast

Language: Python

Database: MySQL

URL: https://collections.zfmk.de/

DOI: 10.20363/zfmk-app.digitalcatalogue


## Dependencies

1. Transfer scripts to import specimen and taxa from different DiversityWorkbench databases to catalogue's MySQL database
  
optionally you can import the [GBIF Backbone Taxonomy](https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c) into a [DiversityTaxonNames](https://diversityworkbench.net/Portal/DiversityTaxonNames) instance:

* [gbif2mysql](https://github.com/ZFMK/gbif2mysql)
* [gbif2tnt](https://github.com/ZFMK/gbif2tnt)


otherwise you need to have access to one or more existing DiversityTaxonNames databases

required:
* [tnt_taxa_merger](https://github.com/ZFMK/tnt_taxa_merger). tnt_taxa_mmerger merges several taxonomies stored in DiversityTaxonNames databases into one taxonomy that can be used as backbone in the digital catalogue
* [dwb2catalogue](https://github.com/ZFMK/dwb2catalogue). dwb2catalogue imports specimens from DiversityCollection instances into the catalogues' database and matches them with the taxa contained in  the merged taxonomy.
  
* Solr indexing service (configuration files comming soon)


The [dwb2catalogue](https://github.com/ZFMK/dwb2catalogue) creates the required database for the catalogue. This database must then be copied into the production database of the catalogue's webportal (see README of [dwb2catalogue](https://github.com/ZFMK/dwb2catalogue))


## Installation

Setup and activate Python virtual environment

    python3 -m venv digitalcatalogue_venv
    cd digitalcatalogue_venv


Activate virtual environment:

    source bin/activate

Upgrade pip and setuptools

    python -m pip install -U pip
    pip install --upgrade pip setuptools


Clone repository

    git clone https://github.com/ZFMK/DigitalCatalogue.git

Run setup.py to install required Python packages

    cd DigitalCatalogue
    python setup.py develop

Copy production.ini.org to production.ini

    cp production.ini.org production.ini

Change server, user, and password settings in production.ini

    nano production.ini

Run the catalogue web app

    pserve production.ini


The web app will listen to the port set in production.ini section [server:main]. This is 6544 by default. The web-app can be opened via http://localhost:6544. To set it up for production, a proxy must be set in your web server configuration.
