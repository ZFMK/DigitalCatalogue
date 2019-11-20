import pudb
import json
from .vars import messages, config, redlist
from .viewslib import db_connect


import logging
log = logging.getLogger(__name__)



class RedList ():
	def __init__(self, taxon_id):
		self.taxon_id = taxon_id
		self.resultrows = []
		self.readRedListData()


	def readRedListData(self):
		(conn, cur) = db_connect()

		sql = """SELECT rl.category_id,
				rl.value,
				pt2.term
			FROM ZFMK_Coll_TaxaRedLists rl
			LEFT JOIN ZFMK_Coll_TaxaPropertyTerms pt ON rl.reference_id = pt.id
			LEFT JOIN ZFMK_Coll_TaxaPropertyTerms pt2 ON rl.reference_id = pt2.id AND rl.category_id = '33'
			WHERE taxon_id = %s"""
		cur.execute(sql, self.taxon_id)
		rows = cur.fetchall()

		self.resultrows = list(rows)

		cur.close()
		conn.close()

	def getHTMLRedListTable(self, lang = 'de'):
		if len(self.resultrows) <= 0:
			redlisttable = ''
		else:
			redlisttable = "<table>"
			for row in self.resultrows:
				category = redlist['category'][row[0]][lang]
				if row[0] in (30, 34):
					condition = row[1]
				else:
					try:
						condition = redlist['category'][row[0]]['conditions'][row[1]][lang]
					except KeyError:
						condition = row[1]
				if row[0] == 33:
					redlisttable += "<tr><td>" + category + ":</td><td>" + condition + "</td></tr><tr><td>" + redlist['source'][lang] + ":</td><td>" + row[2] + "</td></tr>"
				else:
					redlisttable += "<tr><td>" + category + ":</td><td>" + condition + "</td></tr>"
			redlisttable += "</table>"
		return redlisttable

	def getRedListData(self, lang='de'):
		"""
		What? cleaning up all that intermingled html and data code is really a task
		"""
		if len(self.resultrows) <= 0:
			text = '{{"success": false, "text": "{0}", "entries": []}}'.format(messages['no_results_rl'][lang])
		else:
			entries = {}
			for row in self.resultrows:
				category = redlist['category'][row[0]][lang]
				if row[0] in (30, 34):
					condition = row[1]
				else:
					condition = redlist['category'][row[0]]['conditions'][row[1]][lang]
				if row[0] == 33:
					entries[category] = {'condition': condition, redlist['source'][lang]: row[2]}
				else:
					entries[category] = {'condition': condition}
			text = '{{"success": true, "lang": "{0}", "entries": "{1}"}}'.format(lang, entries)
		return text



