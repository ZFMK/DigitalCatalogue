from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import json
import pudb

from .lib.vars import messages, config, solr_sort_options
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid
from .lib.solrRequest import SolrRequest
from .lib.runSolr import RunSolr


import logging
log = logging.getLogger(__name__)



class ResultViews():
	def __init__(self, request):
		self.request = request
		self.session = request.session
		self.lang = get_language(request)
		self.uid = get_session_uid(self.session)
		self.fieldlist = []
		self.solr_sort_options = solr_sort_options[self.lang]




	@view_config(route_name='getSpecimenGeoInfo')
	def getSpecimenGeoInfo_view(self):
		"""Species			27
		Common Name			28
		Country				 7
		Bundesland			26
		Institute			22
		Catalogue-No.		 1
		Family
		"""

		geo_min_max = ['-180', '-90', '180', '90']
		geo_coords = []
		resT = "0"
		source = self.request.POST.get('source')
		if source == "specimensearch":
			taxon = self.request.POST.get('taxon')

		self.setPagingParams()
		self.setSortingParams()


		solrrequest = SolrRequest(self.request)

		# prepare solrrequest to the special needs when used in taxasearch
		if source == "taxasearch":
			taxon = self.request.POST.get('search_term')
			#solrrequest.setSolrRequestForResultPage()
			solrrequest.setSolrRequestForTaxonPage()

		# prepare solrrequest to the special needs when used in specimensearch
		elif source == "specimensearch":
			solrrequest.setSolrRequestForSpecimenPage()

		elif source == "csvExport":
			# prepare the request without paging to get all results
			solrrequest.setSolrRequestForResultPage()

		else:
			solrrequest.setSolrRequestForResultPage(self.page, self.pagesize, self.sort, self.direction)
			pass

		self.setDBConnection()
		self.setFieldList()

		fieldstrings = ['["{0}", "{1}"]'.format(fields[0], fields[1]) for fields in self.fieldlist]

		# search via solr
		# print ('running solr for data\n')
		solrrunner = RunSolr(self.uid)
		(cont, result) = solrrunner.get_data_from_solr(solrrequest, self.lang, debug = True)

		'''
		if not cont:
			Response.status_int = 500
			text = '{{"success": false, "text": "{0}", "lang": "{1}", "entries": [], "bounds": [{3}], ' \
				   '"fields": [{2}]}}'.format(result, self.lang, ",".join(fieldstrings), ",".join(geo_min_max))
			return Response(text)
		'''

		#pudb.set_trace()
		j = json.loads(result)

		# SQL Query for detail pages -- Taxonomy
		# this is just for generating the taxonomy string.
		# TODO: grep the taxon from solr request instead of taxon parameter
		if j['response']['numFound'] != 0 and source in ("specimensearch", "taxasearch"):
			resT = self.getTaxonomyString(taxon)

		# prepare the data as list of lists here instead of in results.js to keep the work away from the javascript

		self.closeDBConnection()

		tabledata = []

		if j['response']['numFound'] == 0:
			pass
			#text = '{{"success": false, "text": "{0}", "lang": "{1}", "entries": [], "bounds": [{3}], ' \
			#	   '"fields": [{2}], "taxonomy": {4}}}'.format(messages['no_results'][self.lang], self.lang, ",".join(fieldstrings),
			#												   ",".join(geo_min_max), resT)
		else:
			tabledata, idslist = self.convertToRowDicts(j)

		try:
			start_param = j['responseHeader']['params']['start']
		except KeyError:
			start_param = 0
		try:
			rows_param = j['responseHeader']['params']['rows']
		except KeyError:
			rows_param = config['solr']['max_result']


		if self.request.POST.get('htmltable'):
			htmltable = self.getHTMLTable(tabledata)
			htmltablestring = json.dumps(htmltable)
			text = '{{"success": true, "lang": "{0}", "entries": {1}, ' \
			   '"numFound": "{2}", ' \
			   ' "start": "{3}", "rows": "{4}", "htmltable": {5}, "taxonomy": {6}}}'.format(
							self.lang,
							result,
							j['response']['numFound'],
							start_param,
							rows_param,
							htmltablestring,
							resT
							)

		else:
			jsontabledata = json.dumps(tabledata)

			# TODO: the solr results are separated into entries and facets here, although they can be provided in the same container?
			text = '{{"success": true, "lang": "{0}", "entries": {1}, "bounds": [{3}], ' \
				   '"fields": [{2}], "taxonomy": {4}, "tablerowdicts": {5}, "idslist": "{6}", "numFound": "{7}", ' \
				   ' "start": "{8}", "rows": "{9}"}}'.format(
								self.lang,
								result,
								",".join(fieldstrings),
								",".join([str(c) for c in geo_min_max]),
								resT,
								jsontabledata,
								",".join(idslist),
								j['response']['numFound'],
								start_param,
								rows_param
								)
		return Response(text)



	def setDBConnection(self):
		(self.conn, self.cur) = db_connect()

	def closeDBConnection(self):
		self.cur.close()
		self.conn.close()


	def setPagingParams(self):
		self.page = self.request.POST.get('page')
		if self.page is None or self.page == "":
			self.page = None
		self.pagesize = self.request.POST.get('pagesize')
		if self.pagesize is None or self.pagesize == "":
			self.pagesize = None


	def setSortingParams(self):
		self.sort = self.request.POST.get('sort')
		if self.sort is None or self.sort == "":
			self.sort = None
		self.direction = self.request.POST.get('direction')
		if self.direction is None or self.direction == "":
			self.direction = None


	def setFieldList(self):
		field_ids = ['7', '26', '1', '96']  # -- Country, State, AccessionNumber, typestatus
		field_query = """SELECT if(f1.id is null, f.id, CONCAT(f1.field_name,'_',REPLACE(REPLACE(c.id,'EN',''),'DE',''))) AS id, f.field_name
							FROM ZFMK_Coll_Data_Fields f
								LEFT JOIN ZFMK_Coll_Data_Category c ON (c.id=f.category AND f.lang='{1}')
								LEFT JOIN ZFMK_Coll_Data_Fields f1 ON (f1.id = f.id AND f1.lang='prg')
							WHERE c.id LIKE '%{1}' AND
								f.id IN (27, 28, {0}, 19, 93) ORDER BY f.`order`""".format(",".join(field_ids), self.lang)
		self.cur.execute(field_query)
		for row in self.cur:
			try:
				solr_sort_name = self.solr_sort_options[row[1]]
			except KeyError:
				solr_sort_name = None
			self.fieldlist.append([row[0], row[1], solr_sort_name])


	def getTaxonomyString(self, taxon):
		sql2 = """SELECT CONCAT_WS(', ',
						tf.tax_kingdom,
						tf.tax_phylum,
						tf.tax_subphylum,
						tf.tax_class,
						tf.tax_order,
						tf.tax_family,
						tf.tax_subfamily) AS taxonomy
					FROM ZFMK_Coll_TaxaFlat tf
					INNER JOIN ZFMK_Coll_Taxa t ON (tf.taxon_id = t.id)
					WHERE taxon = %s"""
		self.cur.execute(sql2, taxon)
		row = self.cur.fetchone()
		if not row:
			resT = taxon
		else:
			resT = '"' + row[0] + '"'
		return resT


	def getHTMLTable(self, tabledata):
		htmltable = render('templates/%s/resulttable.pt' % self.lang, {'data': {'fields': [[field[1],field[2]] for field in self.fieldlist], 'tablerowdicts': tabledata}})
		return htmltable



	def convertToRowDicts(self, results):
		try:
			entries = results['response']['docs']
		except KeyError:
			return [], []
		rowdicts = []
		barcode_present = ['&#10007;', '&#8730;']
		idslist = [];
		i = 0
		for entry in entries:
			rowdict = {}
			rowdict['id'] = entry['id']
			idslist.append(entry['id'])
			for fieldnames in self.fieldlist:
				fieldkey = fieldnames[0]
				colname = fieldnames[1]

				# idslist here or in javascript?
				# rowdict['DT_RowClass'] = 'has_barcode';
				if fieldkey == 'sequence_12':
					if int(entry['barcode_count']) > 0:
						rowdict[colname] = barcode_present[1]
						rowdict['DT_RowClass'] = 'has_barcode'
					else:
						rowdict[colname] = barcode_present[0]
				# do not add a number column to the table
				#elif fieldkey == 'Number':
				#	rowdict[colname] = i+1;
				elif fieldkey == '27':
					try:
						rowdict[colname] = '<div id="details_{0}" data-taxon="{1}" class="taxon_name_column"><img src="/static/images/info.png" class="popupbutton_inline"> <em>{1}</em></div>'.format(entry['id'], entry['taxon'][0])
						#rowdict[colname] = '&nbsp;<div id="details_{0}" data-taxon="{1}" class="popupbutton taxon_name_column" onclick="fill_taxondetails_iframe(\'taxondetail\', \'{1}\');"></div>&nbsp;{1}'.format(entry['id'], entry['taxon'][0])
						rowdict['taxon_for_details'] = entry['taxon'][0]
					except KeyError:
						#print (entry['id'])
						rowdict[colname] = ""
				elif fieldkey == 'AccessionNumber_1':
					rowdict[colname] = '<div><img src="/static/images/info.png" class="popupbutton_inline"> {0}</div>'.format(entry['AccessionNumber_1'][0])
					#rowdict[colname] = '&nbsp;<div id="details_{0}" class="popupbutton" onclick="fill_taxondetails_iframe(\'specimendetail\', \'{0}\');"></div>&nbsp;{1}'.format(entry['id'], entry['AccessionNumber_1'][0])
				elif fieldkey == '28':
					rowdict[colname] = entry['vernacular']
				elif fieldkey == '19':
					try:
						rowdict[colname] = entry['parenttaxon'][0]
					except KeyError:
						rowdict[colname] = ""
				elif fieldkey == 'Institute_11':
					rowdict[colname] = entry['institute']
				else:
					try:
						if (isinstance(entry[fieldkey], list)) or (isinstance(entry[fieldkey], tuple)):
							rowdict[colname] = ',\n'.join(entry[fieldkey])
						else:
							rowdict[colname] = entry[fieldkey]
					except KeyError:
						rowdict[colname] = ''
			rowdicts.append(rowdict)
			i += 1
		return rowdicts, idslist



