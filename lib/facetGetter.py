"""
get the available facets as dictionary
"""

import pudb
import json
import re
import time
import datetime


from gbol.lib.solrRequest import SolrRequest
from gbol.lib.runSolr import RunSolr


class FacetHandler():
	
	def __init__(self, request):
		self.request = request
		self.solrrequest = SolrRequest(self.request)
		self.filters = SolrRequest.getFilterDefinitions()
		
		# get the solr names of the filters
		# do not use the definitions for button names that have prio value 0
		self.filternames = [key for key in self.filters if self.filters[key]['prio'] != 0]
		
	
	def setFacetsForm(self):
		pass
	
	
	
	
	
	
	def getFacetDict(self, request):
		#self.solrrequest.
		
		pass
	
	
	
	
	





