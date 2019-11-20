from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
from pyramid.httpexceptions import HTTPFound, HTTPNotFound, HTTPSeeOther
import pymysql
import re
import os
import time
from collections import OrderedDict
import ast
import urllib.request
import urllib.parse
import http.client
import ssl
from html import unescape
import datetime
import locale
import json

import pudb

from .lib.vars import taxon_ids, messages, config, states, redlist, solr_sort_options
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid
from .lib.filterSaver import insertFilter, deleteFilter, getFilters
from .lib.exportResultTable import ResultTable
from .lib.sqlDataQuery import DataQuery
from .lib.solrRequest import SolrRequest
from .lib.runSolr import RunSolr

# FIXME: remove the import from .viewsFacets in any way
from .viewsFacets import facets_get, facet_get_stats


import logging

log = logging.getLogger(__name__)



@view_config(route_name='collection')
def collection_view(request):
	"""
	Load the specimen list for a specific collection. Use the path variable to set the facet filter to the according collection
	"""
	session = request.session
	set_language(request)
	lang = get_language(request)
	uid = get_session_uid(session)
	facet_numbers = ""
	show_header = config['show_header']
	(conn, cur) = db_connect()

	last_updated = getLastUpdated()
	
	
	collectionname = request.matchdict['collectionname']
	if collectionname is not None:
		# get the available collection facets
		solrrequest = SolrRequest(request)
		solrrequest.setSolrRequestFor_facets_get()
		solrrunner = RunSolr(uid)
		(cont, ret) = solrrunner.get_data_from_solr(solrrequest, lang, debug = True)

		if cont:
			collection_facets = json.loads(ret)['facet_counts']['facet_fields']['collection_facet']

			for facet in collection_facets[::2]:
				if facet.lower().startswith(collectionname.lower()):
					return(HTTPFound(location='{0}/?collection_facet={1}'.format(request.application_url, facet.replace(' ', '+'))))
		
	return HTTPNotFound()
		
	




@view_config(route_name='specimenlist')
def specimenlist_view(request):
	"""
	Load the master html-template for the list of collection specimens, the open layers map and the search and facets fields
	"""

	session = request.session
	set_language(request)
	lang = get_language(request)
	uid = get_session_uid(session)
	facet_numbers = ""
	show_header = config['show_header']

	last_updated = getLastUpdated()
	(searchcategory, searchterm) = getSearchQueryFromRequest(request)
	search_categories = searchCategories(uid, lang, searchcategory=searchcategory)
	sortoptions = getSortByOptions(lang)

	message = session.pop_flash()

	# pudb.set_trace()
	# get the stored facet searches

	(cont, facets) = facets_get(request, uid, lang)
	if not cont:
		message.append(facets)
		facets = ""
	'''
	else:
		(cont, facet_numbers) = facet_get_stats(request, uid, lang, True)
	if not cont:
		message.append(facet_numbers)
		facet_numbers = ""
	'''


	# pudb.set_trace()
	filterlist = getFilterListFromRequest(request, lang)
	hiddenfilterstring = getHiddenFilterString(filterlist)



	ret = {
		   'show_header': show_header,
		   'lan': lang,
		   'last_updated': last_updated,
		   #'filterlist': filterlist,
		   #'savebutton_class': 'hidden',
		   'search_categories': search_categories,
		   'facets': facets,
		   #'individuals_slider': facet_numbers,
		   'filter_available': len(facets) > 0, # and len(facet_numbers) > 0,
		   'sortoptions': sortoptions,
		   'hiddenfilterstring': hiddenfilterstring,
		   'appliedfilters': filterlist,
		   'searchterm': searchterm 
		}

	if len(message) > 1:
		ret['message'] = message[0]
	result = render('templates/%s/collectionlist.pt' % lang, ret, request=request)
	response = Response(result)
	return response

@view_config(route_name='csvExport')
def csvExport_view(request):
	session = request.session
	uid = get_session_uid(session)
	if uid == 215:
		pass
		#pudb.set_trace()

	specimen_ids = request.POST.get('specimen_ids')

	filename = ResultTable(request, specimen_ids = specimen_ids).writeCSVFile()
	return Response('{{"success": true, "filename": "{}"}}'.format(filename))

def getLastUpdated():
	(conn, cur) = db_connect()
	last_updated = 0
	sql_last_update = """SELECT DATE_FORMAT(MAX(`date`), '%d.%m.%Y %H:%i:%s') FROM Sync_Transfer_Log WHERE source_name='finished'"""
	cur.execute(sql_last_update)
	row = cur.fetchone()
	if row[0] is not None:
		last_updated = row[0]
	cur.close()
	conn.close()
	return last_updated



def searchCategories(uid, lang, searchcategory = None):
	"""
	create html for the search category selector in Fundstellen
	i. e. the category selector for the search input field
	"""
	
	if searchcategory is not None:
		category = int(searchcategory)
	else:
		category = 10
	
	if category == 10:
		selected = 'selected="selected"'
	else:
		selected = ''
	
	if lang != 'de':
		resA = ["""<option value="10" {0}>Taxon / Species</option>""".format(selected)]
	else:
		resA = ["""<option value="10" {0}>Taxon / Art</option>""".format(selected)]

	(conn, cur) = db_connect()
	sql = """SELECT REPLACE(REPLACE(c.id,'EN',''),'DE',''), f.field_name
				FROM ZFMK_Coll_Data_Fields f
					LEFT JOIN ZFMK_Coll_Data_Category c ON (c.id=f.category AND f.lang='{0}')
				WHERE c.id LIKE '%{0}' AND
					f.id NOT IN (2, 3, 11, 12, 15, 16, 17, 19, 20, 26, 27, 28) AND f.id<30""".format(lang)
	if uid == 0:
		sql += """ AND restricted!= 1"""
	cur.execute(sql)

	for row in cur:
		if category == int(row[0]):
			selected = 'selected="selected"'
		else:
			selected = ''
		resA.append("""<option value="{1}" {0}>{2}</option>""".format(selected, *row))
	conn.close()
	return "".join(resA)


def getSortByOptions(lang):
	return solr_sort_options[lang]


def getHiddenFilterString(filterlist):
	# setting the hidden filters element is b...
	# must be reworked to use a single form and setting the single form from request parameters

	filtersdict = {}
	count = 0
	for element in filterlist:
		try:
			filtersdict[element[0]].append(element[1])
		except KeyError:
			filtersdict[element[0]] = []
			filtersdict[element[0]].append(element[1])
		count += 1

	if len(filtersdict) > 0:
		filtersdict['count'] = count

	hiddenfilterstring = ''
	if len(filtersdict) > 0:
		hiddenfilterstring = json.dumps(filtersdict)
		#hiddenfilterstring = hiddenfilterstring.replace('"', '\\' + '"')

	return hiddenfilterstring


def getFilterListFromRequest(request, lang):
	# must be reworked to use a single form and setting the single form from request parameters
	solrrequest = SolrRequest(request)
	solrrequest.setFiltersFromQueryParams()
	filterlist = solrrequest.getFilterQueriesList()

	filterdefs = solrrequest.getFilterDefinitions()
	for element in filterlist:
		element.append(filterdefs[element[0]][lang])

	return filterlist


def getSearchQueryFromRequest(request):
	searchterm = request.params.get('search_term')
	searchcategory = request.params.get('search_category')
	
	category = None
	term = ''
	
	if searchterm is not None and searchterm != '':
			if searchcategory is not None and searchcategory != '': # do i need this if? searchcategory should always be set when comming from the results page
				category = searchcategory
				term = searchterm
	
	return (category, term)
	


