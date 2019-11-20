import urllib.request
import urllib.parse
import http.client
import ssl
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


	def get_data_from_solr(self, solrrequest, lang = "en", debug = False):
		"""
		Calls solr server via urllib.
		Returns `True` and the json solr result if successful
		else False and the http error code
		"""

		requeststring = solrrequest.getSolrRequestString()
		requeststring = requeststring.replace(' ', '\ ').replace('\ TO\ ', ' TO ').replace('\ AND\ ', ' AND ').replace('\ OR\ ', ' OR ')
		requeststring = urllib.parse.quote_plus(requeststring, safe='&, =, +, *')
		url = config['solr']['url'] + self.solr_core + '/select?' + requeststring

		ssl_context = ssl.create_default_context()
		#### uncomment to use a solr server with invalid certificate
		ssl_context.check_hostname = False
		ssl_context.verify_mode = ssl.CERT_NONE

		ssl_handler = urllib.request.HTTPSHandler(context=ssl_context)
		# added password-handler for HTTPBaseAuth
		auth_handler = urllib.request.HTTPBasicAuthHandler()
		auth_handler.add_password(realm='gbol_solr', uri=config['solr']['url'], user=config['solr']['user'],
								  passwd=config['solr']['passwd'])
		opener = urllib.request.build_opener(ssl_handler, auth_handler)
		urllib.request.install_opener(opener)

		if debug is True:
			log.debug('Solr request: {0}'.format(url))

		try:
			response = urllib.request.urlopen(url)
		except urllib.error.URLError as e:
			return (False, messages['errors']['connection_error'][lang]['err_text'])
		except http.client.RemoteDisconnected as e:
			return (False, messages['errors']['connection_error'][lang]['err_text'])
		if response.code == 200:
			return(True, response.read().decode('utf-8'))
		return (False, response.code)



