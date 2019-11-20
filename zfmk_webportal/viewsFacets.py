from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
from collections import OrderedDict
import ast
import urllib.request
import urllib.parse
import http.client
import ssl
from html import unescape
import json

import pudb

from .lib.vars import taxon_ids, messages, config, states, redlist
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid
from .lib.filterSaver import insertFilter, deleteFilter, getFilters
#from .lib.exportResultTable import ResultTable
#from .lib.sqlDataQuery import DataQuery
from .lib.solrRequest import SolrRequest
from .lib.runSolr import RunSolr


import logging

log = logging.getLogger(__name__)



def facets_get(request, uid, lang):
	"""
	returns the html for the facets in Fundstellen
	"""

	solrrequest = SolrRequest(request)
	solrrequest.setSolrRequestFor_facets_get()
	field_list = solrrequest.getFilterDefinitions()

	limit = config['solr']['facet_max_result']

	solrrunner = RunSolr(uid)

	(con, ret) = solrrunner.get_data_from_solr(solrrequest, lang, debug = True)  # -- field_name: ..._facet
	if not con:
		return (con, ret)

	resA = []
	A = resA.append
	facet = ast.literal_eval(ret)
	for field in sorted(field_list.items(), key=lambda x: x[1]['prio']):
		field_name = field[0]
		field_item = field[1]
		if field_item['prio'] == 0:
			continue

		facet_fields = facet['facet_counts']['facet_fields']
		if field_name in facet_fields:
			A(
				"""<div data-key="{0}" data-title="{1}" class="facetdivblock"><h3 class="facettitle">{1}</h3><ul>""".format(
					field_name, field_item[lang]))
			i = 0
			facet_field_dict = dict(
				facet_fields.get(field_name)[i:i + 2] for i in range(0, len(facet_fields.get(field_name)), 2))
			for k in sorted(facet_field_dict, key=facet_field_dict.get, reverse=True):
				if len(k) == 0:
					continue
				if field_name[:4] == 'tax_':
					value = k.capitalize()
				elif field_name in ['typestatus_facet', 'media_types']:
					value = k.capitalize()
				elif field_name == 'redlist_status':
					try:
						value = redlist['category'][33]['conditions'][k][lang]
					except KeyError:
						value = k
				elif field_name == 'redlist_current_population':
					try:
						value = redlist['category'][27]['conditions'][k][lang]
					except KeyError:
						value = k
				else:
					value = k
				if i < limit:
					A("""<li class="facetdiv select-item" data-value='{0}'>{0} ({1:n})</li>""".format(value, facet_field_dict[k]))
				elif i == limit:
					A("""<li class="opener" align="right" name="{2}" field="{0}">{1}</li>""".format(field_name, field_list['more'][lang], field_item[lang]))
				else:
					break
				i += 1
			A("</ul></div>")
	#if uid == 0:
	#	A('<div class="facetdivblock redlistblock"><br><br>' + messages['red_list_view'][lang] + "</div>")
	return (True, "".join([f.replace('\n', ' ').replace('\t', '') for f in resA]))


@view_config(route_name='facet_get_more')
def facet_get_more_view(request):
	"""
	returns the html for the more boxes in Fundstellen facets part
	"""

	session = request.session
	uid = get_session_uid(session)
	lang = get_language(request)
	resA = []
	A = resA.append

	solrrequest = SolrRequest(request)
	solrrequest.setSolrRequestFor_facet_get_more()

	fieldnames = solrrequest.getFacetFields()
	if len(fieldnames) <= 0:
		return Response('')
	else:
		field_name = fieldnames[0]

	solrrunner = RunSolr(uid)
	(cont, ret) = solrrunner.get_data_from_solr(solrrequest, lang)
	if not cont:
		from pyramid.httpexceptions import HTTPInternalServerError
		Response.status_int = 500
		return HTTPInternalServerError(title=ret, detail=ret)

	facet = ast.literal_eval(ret)
	if facet['facet_counts']:
		facet_fields = facet['facet_counts']['facet_fields']
		if field_name in facet_fields:
			A("""<div class="morefacets">
					<div id="appendix"><button class="sort-button alpha"> </button>&nbsp;<button class="sort-button number"> </button></div>
					<ul data-key="{0}">""".format(field_name.replace("_facet", "")))
			facet_field_dict = dict(
				facet_fields.get(field_name)[i:i + 2] for i in range(0, len(facet_fields.get(field_name)), 2))
			for k in sorted(facet_field_dict, key=facet_field_dict.get, reverse=True):
				if len(k) == 0:
					continue
				if field_name[:4] == 'tax_':
					value = k.capitalize()
				elif field_name in ['typestatus_facet', 'media_types']:
					value = k.capitalize()
				elif field_name == 'redlist_status':
					try:
						value = redlist['category'][33]['conditions'][k][lang]
					except KeyError:
						value = k
				elif field_name == 'redlist_current_population':
					try:
						value = redlist['category'][27]['conditions'][k][lang]
					except KeyError:
						value = k
				else:
					value = k
				A("""<li class="facetdivol select-item" data-count='{1}' data-value='{0}'>{0} ({1:n})</li>""".format(
					value, facet_field_dict[k]))
		A("""</ul></div>""")

	return Response(''.join(resA))


def facet_get_stats(request, uid, lang, reset=False):
	"""
		get min and max ranges for collected and barcoded individuals
		returns hidden html fields for filter template
		If reset the max value is resetted to the highest number in the list
	"""


	resA = []
	A = resA.append

	solrrequest = SolrRequest(request)
	solrrequest.setSolrRequestFor_facet_get_stats()

	field_names = ['barcode_individuals', 'collected_individuals']

	solrrunner = RunSolr(uid)
	(cont, ret) = solrrunner.get_data_from_solr(solrrequest, lang)
	if not cont:
		return (cont, ret)

	indminmax = solrrequest.getIndividuumsMinMax()

	facet = ast.literal_eval(ret)
	for field_name in field_names:
		short = "".join([x[0] for x in field_name.split('_')])
		if not 'facet_counts' in facet:
			# -- some defaults
			rng = [1, 5]
		else:
			f = facet['facet_counts']['facet_fields'][field_name]
			if len(f) == 2:  # -- only one value in return list
				rng = [int(f[0]), int(f[0])]
			else:
				try:
					rng = [int(f[0]), int(f[-2])]
				except IndexError:
					rng = [0, 5]
		sel = rng[1]  # -- set to max per default
		sel_field_name = '%s_value_sel' % short
		if sel_field_name in indminmax:
			sel = int(indminmax[sel_field_name])
		if sel > rng[1]:
			sel = rng[1]
		if sel < 0:
			sel = rng[0]
		if not reset:  # -- set to old max value
			rng[1] = indminmax['%s_value_max' % short]

		A("""<input type="hidden" id="{0}_value_sel" size="5" name="{0}_value_sel" value="{1}"/>
			<input type="hidden" id="{0}_value_min" size="5" name="{0}_value_min" value="{2}" />
			<input type="hidden" id="{0}_value_max" size="5" name="{0}_value_max" value="{3}" />""".format(short, sel, rng[0], rng[1]))

	return (True, ''.join(resA))


@view_config(route_name='load_facet_form')
def load_facet_form(request):
	"""
		called from results.js: addElement and removeElement function
		returns html
	"""
	#print('load_facet_form')
	session = request.session
	lang = get_language(request)
	uid = get_session_uid(session)
	facets = ""
	facet_numbers = ""
	message = ""
	(cont, ret) = facets_get(request, uid, lang)

	'''
	filterlist = []
	if uid > 0:
		filterlist = getFilters(uid)
	'''

	if not cont:
		message = ret
	else:
		facets = ret
		(cont, ret) = facet_get_stats(request, uid, lang)
	if not cont:
		message = ret
	else:
		facet_numbers = ret

	result = render('templates/%s/filter.pt' % lang, {
		'lang': lang,
		'facets': facets,
		#'filterlist': filterlist,
		#'savebutton_class': '',
		#'individuals_slider': facet_numbers,
		'filter_available': len(facets) > 0 and len(facet_numbers) > 0,
		'message': message}, request=request)
	return Response(result)








