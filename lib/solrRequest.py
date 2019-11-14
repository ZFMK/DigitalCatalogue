"""
set up a dictionary that containes all parameters as keys/values for the solr search request 
"""

import pudb
import json
import re
import time
import datetime
import urllib.request
import urllib.parse
import http.client
import ssl


from gbol.lib.vars import messages, config, redlist
from gbol.lib.viewslib import db_connect, get_language, set_language, get_session_uid


import logging
log = logging.getLogger(__name__)


class SolrRequest():
	def __init__(self, request):
		self.request = request
		self.lang = get_language(request)
		self.uid = get_session_uid(request.session)
		self.params = {
			'wt': 'json',
			'q': '*',
			'facet': 'on',
			'facet.mincount': '1',
			'rows': config['solr']['max_result'],
			'facet.fieldslist': [],
			'facet.limit': config['solr']['facet_max_result'],
			'facet.sort': 'count',
			'fq': [],
			'start': '0',
			'sort': None
		}
		
	def setFacetMinCount(self, mincount = '1'):
		self.params['facet.mincount'] = str(int(mincount))
	
	def setLookupFacets(self, facet = True):
		if facet is True:
			self.params['facet'] = 'on'
		else:
			self.params['facet'] = 'off'
	
	def setSearchTerm(self, term = '*'):
		self.params['q'] = term
	
	def setRows(self, rows = config['solr']['max_result']):
		if int(rows) > int(config['solr']['max_result']):
			rows = config['solr']['max_result']
		self.params['rows'] = str(int(rows))
	
	def setStartRow(self, startrow = 0):
		self.params['start'] = str(startrow)
	
	
	def setFilterDefinitions(self):
		"""
		set the definitions for the filters on the result page
		called by self.setSolrRequestFor_facets_get()
		"""
		self.filter_list = {'tax_kingdom': {'en': 'Kingdom', 'de': 'Reich', 'prio': -20},
					  'tax_phyl_subphyl': {'en': 'Sub-/Pyhulum', 'de': 'Sub-/Phylum', 'prio': -80},
					  'tax_class_order': {'en': 'Class/Order', 'de': 'Klasse/Ordnung', 'prio': -70},
					  'tax_family': {'en': 'Family', 'de': 'Familie', 'prio': -50},
					  'tax_species': {'en': 'Species', 'de': 'Art', 'prio': -40},
					  'redlist_status': {'en': 'Redlist Status', 'de': 'Rote Liste Status', 'prio': -30},
					  'redlist_current_population': {'en': 'Current population', 'de': 'Aktuelle Bestandssituation',
													 'prio': -20},
					  'typestatus_facet': {'en': 'Type material', 'de': 'Typenmaterial', 'prio': -40},
					  'media_types': {'en': 'Media ', 'de': 'Medien', 'prio': -40},
					  'country_facet': {'en': 'Country', 'de': 'Land', 'prio': -100},
					  'collection_facet': {'en': 'Collection', 'de': 'Sammlung', 'prio': -90},
					  # the following are buttons that do not belong to filters Arrgh
					  'save_filter': {'en': 'Save filters', 'de': 'Filter speichern', 'prio': 0},
					  'saved_filters': {'en': 'Saved filters', 'de': 'Gespeicherte Filter', 'prio': 0},
					  'please_chose': {'en': 'Please choose', 'de': 'Bitte wählen', 'prio': 0},
					  'chose_filter': {'en': 'Choose filter', 'de': 'Filter wählen', 'prio': 0},
					  'more': {'en': 'more...', 'de': 'mehr...', 'prio': 0}
					  }


	def getFilterDefinitions(self):
		try:
			return self.filter_list
		except AttributeError:
			self.setFilterDefinitions()
			return self.filter_list
	
	def appendFacetField(self, field):
		self.params['facet.fieldslist'].append(str(field))
	
	def setFacetFields(self, fields = []):
		if isinstance(fields, list) or isinstance(fields, tuple):
			for field in fields:
				self.params['facet.fieldslist'].append(str(field))
		elif isinstance(fields, str):
			self.params['facet.fieldslist'].append(fields)
	
	def getFacetFields(self):
		return self.params['facet.fieldslist']
	
	def setFacetLimit(self, limit = None):
		if limit is None or limit == 'max':
			limit = config['solr']['facet_max_result']
		self.params['facet.limit'] = str(int(limit))
	
	def getFacetLimit(self):
		return int(self.params['facet.limit'])
	
	def setFacetSort(self, sort = 'count'):
		self.params['facet.sort'] = str(sort)
	
	def setSort(self, sort = None, direction='asc'):
		if sort is not None:
			self.params['sort'] = "{0}+{1}".format(sort, direction)
	
	def setFilterQueriesList(self, fqlist = []):
		# fqlist must be a list of lists: [['facetname', 'searchterm'], ['facetname', 'searchterm']]
		if isinstance(fqlist, list):
			if len(fqlist) >= 1:
				if (isinstance(fqlist[0], list)):
					if (len(fqlist[0]) >= 2):
						self.params['fq'] = fqlist
	
	def getFilterQueriesList(self):
		return self.params['fq']
	
	def appendFilterQuery(self, fq = []):
		# fq must be a list with at least two elements: ['facetname', 'searchterm'], 
		# third element might be connector? ['facetname', 'searchterm', " AND "], not yet implemented
		if isinstance(fq, list):
			if len(fq) >= 2:
				self.params['fq'].append(fq)
	
	
	def setIndividuumsMinMax(self):
		# set the min and max values for barcoded and collected individuals
		# called from results page
		self.indnumbers = {}
		for b in ['bi', 'ci']:
			for a in ['min', 'max']:
				_key = '%s_value_%s' % (b, a)
				_val = self.request.POST.get(_key)
				if _val is None:
					self.indnumbers[_key] = 0
				else:
					self.indnumbers[_key] = int(_val)
	
	def getIndividuumsMinMax(self):
		try:
			return self.indnumbers
		except AttributeError:
			self.setIndividuumsMinMax()
			return self.indnumbers
	
	
	def getSolrRequestString(self):
		requestparts = []
		requestparts.append("q=" + self.params['q'])
		requestparts.append("wt=" + self.params['wt'])
		requestparts.append("facet=" + self.params['facet'])
		requestparts.append("rows=" + str(self.params['rows']))
		requestparts.append("start=" + str(self.params['start']))
		if self.params['sort'] is not None:
			requestparts.append("sort=" + str(self.params['sort']))
		
		# facet_fieldsstring becomes '' when self.params['facet.fieldslist'] is empty
		facet_fieldsstring = "&facet.field=".join(self.params['facet.fieldslist'])
		if self.params['facet'] == 'on' and facet_fieldsstring != '':
			requestparts.append('facet.mincount=' + str(self.params['facet.mincount']))
			requestparts.append('facet.limit=' + str(self.params['facet.limit']))
			requestparts.append('facet.sort=' + str(self.params['facet.sort']))
			requestparts.append("facet.field=" + facet_fieldsstring)
		
		filterdict = {}
		if len(self.params['fq']) > 0:
			for filterquery in self.params['fq']:
				try:
					filterdict[filterquery[0]].append(filterquery[1])
				except KeyError:
					filterdict[filterquery[0]] = []
					filterdict[filterquery[0]].append(filterquery[1])
		for key in filterdict:
			# patch the numbers in keys, set either filter name = category_number or replace with the appropriate filter name
			try:
				int(key)
				filtername = None
				if int(key) == 10:
					filtername = "all_taxa"
				elif int(key) == 11:
					filtername = "institute"
				elif int(key) == 99:
					filtername = "id"
				else:
					filtername = 'category_{0}'.format(key)
			except ValueError:
				filtername = key
			
			if len(filterdict[key]) > 1:
				requestparts.append("fq=(" + " OR ".join(['{0}:{1}'.format(filtername, element) for element in filterdict[key]]) + ")")
			else:
				requestparts.append("fq=" + '{0}:{1}'.format(filtername, filterdict[key][0]))
			
		
		requeststring = "&".join(requestparts)

		#print('-------- requeststring')
		#print(requeststring)
		#print('--------')
		
		return requeststring


	def setSearchTermFromQueryParams(self):
		searchterm = self.request.params.get('search_term')
		searchcategory = self.request.params.get('search_category')
		
		if searchterm is not None and searchterm != '':
			if searchcategory is not None and searchcategory != '': # do i need this if? searchcategory should always be set when comming from the results page
				self.appendFilterQuery([searchcategory, searchterm])


	def setFiltersFromQueryParams(self):
		filtersdict = {}
		
		# get the filters that are stored in hidden filters field
		filters = self.request.params.get('filters')
		if filters is not None:
			try:
				filtersdict = json.loads(filters)
			except:
				pass
		
		#pudb.set_trace()
		# use the named parameters from params multidict to set the filters
		filternames = [key for key, item in self.getFilterDefinitions().items() if item['prio'] != 0]
		for filtername in filternames:
			params = self.request.params.getall(filtername)
			if len(params) > 0:
				try:
					filtersdict[filtername].extend(params)
				except KeyError:
					filtersdict[filtername] = []
					filtersdict[filtername].extend(params)
		
		
		indnumbers = self.getIndividuumsMinMax()
		
		# set the single filters as arrays for filterquery
		if len(filtersdict) > 0:
			for field, elements in filtersdict.items():
				# skip the count field
				if field == 'count':
					continue
				# skip if there is nothing in it
				if len(elements) <= 0:
					continue
				# the number of individuals slider
				elif field in ('collected_individuals', 'barcode_individuals'):
					try:
						v = int(elements[0])  # -- selected value from slider
					except ValueError:
						continue
					if field == 'barcode_individuals':
						if v <= 0:
							self.appendFilterQuery([field, 0])
						else:
							self.appendFilterQuery([field, '[* TO {0}]'.format(int(v))])
					elif field == 'collected_individuals':
						self.appendFilterQuery([field, '[{0} TO {1}]'.format(indnumbers['ci_value_min'], v)])
				# redlist stati
				elif field == 'redlist_status':
					for k in redlist['category'][33]['conditions']:
						if elements[0] in redlist['category'][33]['conditions'][k][self.lang]:
							self.appendFilterQuery([field, k])
				elif field == 'redlist_current_population':
					for k in redlist['category'][27]['conditions']:
						if elements[0] in redlist['category'][27]['conditions'][k][self.lang]:
							self.appendFilterQuery([field, k])
				else:
					# wildcards not implemented as it was only used for category 2 (Depositors name / Collectors name which is treated as the same category)
					escapedlist = []
					for e in elements:
						escapedlist.append(re.sub(r'([^a-zA-Z0-9\ _\\])', r'\\\1', e))
					for e in escapedlist:
						try:
							int(field)
							#if field in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
							# numbered categories
							self.appendFilterQuery(['category_{0}'.format(field), e])
						except ValueError:
							#else:
							self.appendFilterQuery(['{0}'.format(field), e])
		
		#print('solrrequest setSolrRequestForResultPage ----------------')
		#print(self.params)
		#print('----------------')
		return


	def setSolrRequestForResultPage(self, page=None, pagesize=None, sort=None, direction=None):
		"""
		set the solrrequest when terms in filters and searchfield should be queried and when the facet should be read
		"""
		self.setLookupFacets(True)
		self.setFiltersFromQueryParams()
		self.setSearchTermFromQueryParams()
		if sort is None:
			sort = 'tax_species'
		if direction is None:
			direction = 'asc'
		self.setSort(sort, direction)
		# set the facet fields for the graphical pies on countries and collections and data completeness
		self.setFacetFields(['country_facet', 'completeness_level'])
		self.setFacetLimit(limit = 11)
		
		if page is not None and pagesize is not None:
			try:
				page = int(page)
				if page < 1:
					page = 1
				pagesize = int(pagesize)
				if pagesize < 1:
					pagesize = 1
			except ValueError:
				page = 1
				pagesize = 1000
			self.setRows(pagesize)
			self.setStartRow(page * pagesize - pagesize)
		
		return self
	
	def setSolrRequestForSpecimenPage(self):
		"""
		set the solrrequest object when getSpecimenGeoInfo was called with source == 'specimensearch'
		"""
		self.setLookupFacets(False)
		
		specimenid = self.request.POST.get('search_term')
		self.appendFilterQuery(["99", specimenid])
		
		print('solrrequest setSolrRequestForSpecimenPage ----------------')
		print(self.params)
		print('----------------')
		return self
	
	def setSolrRequestForTaxonPage(self):
		"""
		set the solrrequest object when getSpecimenGeoInfo was called with source == 'taxasearch'
		"""
		self.setLookupFacets(True)
		
		taxonname = self.request.POST.get('search_term')
		# surround searchstring with " for an exact search
		taxonname = '"' + taxonname + '"'
		self.appendFilterQuery(["10", taxonname])
		self.setFacetFields(['country_facet', 'completeness_level'])
		
		#print('solrrequest setSolrRequestForTaxonPage ----------------')
		#print(self.params)
		#print('----------------')
		return self
	
	def setSolrRequestFor_facet_get_more(self):
		"""
		set the solrrequest object when looking for more facets in a facet_field (to fill the more facets box, called by facet_get_more_view)
		"""
		self.setFiltersFromQueryParams()
		self.setSearchTermFromQueryParams()
		self.setLookupFacets(True)
		self.setRows(0)
		self.setFacetLimit(200)
		
		facet_field = self.request.POST.get('facet_field')
		if facet_field != '' and facet_field is not None:
			self.setFacetFields([facet_field])
		
		#print('solrrequest setSolrRequestFor_facet_get_more ----------------')
		#print(self.params)
		#print('----------------')
		return self

	def setSolrRequestFor_facets_get(self):
		"""
		set the solrrequest object when looking for facets (called by facet_get)
		"""
		self.setFiltersFromQueryParams()
		self.setSearchTermFromQueryParams()
		self.setLookupFacets(True)
		self.setRows(0)
		self.setFacetLimit(self.getFacetLimit() + 2)
		
		filter_list = self.getFilterDefinitions()
		
		if self.uid != 0:
			self.setFacetFields([key for key, item in filter_list.items() if item['prio'] != 0])
		else:
			self.setFacetFields([key for key, item in filter_list.items() if item['prio'] != 0 and item['prio'] not in (-30, -20)])
		
		#print('solrrequest setSolrRequestFor_facet_get ----------------')
		#print(self.params)
		#print('----------------')
		return self

	def setSolrRequestFor_facet_get_stats(self):
		"""
		set the solrrequest object when looking for individuum number slider (called by facet_get_stats)
		"""
		self.setFiltersFromQueryParams()
		self.setSearchTermFromQueryParams()
		self.setFacetSort('index')
		self.setFacetLimit(-1)
		self.setFacetMinCount(1)
		self.setRows(0)
		self.setFacetFields(['barcode_individuals', 'collected_individuals'])
		# instead of adding with ' AND rank:sp.' to existing filterqueries for taxa add it with its own &fq=rank:sp.
		# this appears to be the same as fq:((taxa_order:Annelida OR taxa_class:Heteroptera) AND rank:sp.)
		self.appendFilterQuery(["rank", "sp."])
		
		#print('solrrequest setSolrRequestFor_facet_get_stats ----------------')
		#print(self.params)
		#print('----------------')
		return self
		

