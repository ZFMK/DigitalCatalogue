#import urllib.request
import urllib.parse
#import http.client
import ssl

import requests
import json

import pudb

from .vars import taxon_ids, messages, config, states, redlist
from .viewslib import db_connect, get_language, set_language, get_session_uid


# from .getImageUrls import getImageUrls

import logging
log = logging.getLogger(__name__)


class RunSolr():
	def __init__(self, uid=0):
		self.uid = uid
		self.set_active_core(uid)
		self.requeststring = None
		self.urlpath = '/select'



	def set_active_core(self, uid=0):
		""" return actve core """
		if uid > 0:
			sql = """SELECT corename FROM solr_core WHERE active=1 AND public=0"""
		else:
			sql = """SELECT corename FROM solr_core WHERE active=1 AND public=1"""

		(conn, cur) = db_connect()
		cur.execute(sql)
		row = cur.fetchone()
		self.solr_core = row[0]
		cur.close()
		conn.close()



	def setUrlPath(self, path):
		self.urlpath = path
		if self.urlpath[0] != '/':
			self.urlpath = '/' + self.urlpath
		
	def setRequeststring(self, requeststring):
		self.requeststring  = requeststring


	def get_data_from_solr(self, solrrequest = None, lang = "en", debug = False):
		"""
		Calls solr server via urllib.
		Returns `True` and the json solr result if successful
		else False and the http error code
		"""

		if self.requeststring is not None:
			requeststring = self.requeststring
		elif solrrequest is not None:
			requeststring = solrrequest.getSolrRequestString()
		else:
			return (False, {})
		
		requeststring = requeststring.replace(' ', '\ ').replace('\ TO\ ', ' TO ').replace('\ AND\ ', ' AND ').replace('\ OR\ ', ' OR ')
		requeststring = urllib.parse.quote_plus(requeststring, safe='&, =, +, *')
		url = config['solr']['url'] + self.solr_core + self.urlpath + '?' + requeststring


		if debug is True:
			log.debug('Solr request: {0}'.format(url))
		
		try:
			response = requests.get(url, auth=(config['solr']['user'], config['solr']['passwd']), verify = False)
			return (True, response.text)
		except:
			return (False, messages['errors']['connection_error'][lang]['err_text'])




