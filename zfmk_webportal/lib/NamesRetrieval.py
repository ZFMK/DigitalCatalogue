import json
import pudb

from .runSolr import RunSolr

class NamesRetrieval():
	"""
	query portal database for autocompletion in html forms
	"""
	
	def __init__(self, request, field, searchterm):
		self.request = request
		self.field = field
		
		self.searchterm = searchterm
		
		self.setSolrSuggesterQuery()
		self.executeQuery()


	def setSolrSuggesterQuery(self):
		if self.field == 'taxon':
			self.suggester = 'taxonSuggester'
		elif self.field == 'location':
			self.suggester = 'countrystateSuggester'
		
		self.querystring = """wt=json&indent=true&suggest.dictionary={0}&suggest.q={1}&suggest=true&suggest.build=false""".format(self.suggester, self.searchterm)
		

	def executeQuery(self):
		solrrunner = RunSolr()
		
		solrrunner.setUrlPath('/suggest')
		solrrunner.setRequeststring(self.querystring)
		(cont, result) = solrrunner.get_data_from_solr(debug = True)
		j = json.loads(result)
		
		self.resultrows = []
		#pudb.set_trace()
		try:
			if len(j['suggest'][self.suggester][self.searchterm]['suggestions']) > 0:
				for suggestion in j['suggest'][self.suggester][self.searchterm]['suggestions']:
					self.resultrows.append(suggestion['term'])
		except KeyError:
			pass
		
	
	def getResultRows(self):
		return list(self.resultrows)
	

