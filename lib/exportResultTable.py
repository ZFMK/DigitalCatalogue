"""
create a tab separated table file or html table that contains the results from viewsErgebnisse Fundstellen
"""
import pudb
import json
import codecs
import time
import datetime
import os
from html import unescape


from gbol.lib.vars import messages, config
from gbol.lib.viewslib import db_connect, get_language, set_language, get_session_uid
from gbol.lib.sqlDataQuery import DataQuery

import logging
log = logging.getLogger(__name__)



class ResultTable():
	def __init__(self, request, fileformat='csv', specimen_ids=""):
		self.request = request
		self.session = self.request.session
		self.fileformat = fileformat
		self.specimen_ids = specimen_ids
		
		self.lang = get_language(self.request)
		self.uid = get_session_uid(self.session)
		pass
	
	
	def setTableHeader(self):
		(conn, cur) = db_connect()
		# -- Get fields and names
		# there are no data in ZFMK_Coll_Data that have field_id > 26, but the headers are taken from here
		if self.uid > 0:
			wherestring = "(`id`<30 OR `id` in (65, 93))"
		else:
			wherestring = "((restricted<1 AND `id`<30) OR `id`=93)"
		sqlDataFields = """
			SELECT id, field_name, category, `order` FROM `ZFMK_Coll_Data_Fields`
			WHERE lang="{0}" AND {1} ORDER BY `order`""".format(self.lang, wherestring)

		cur.execute(sqlDataFields)
		self.field_ids = []
		self.field_names = []
		for row in cur:
			self.field_names.append(row[1])
			self.field_ids.append(str(row[0]))
		
		self.headerRow = []
		for i in range(0, len(self.field_ids)):
			if self.field_ids[i] == '15':  # -- insert Coordinates before no. indivuals
				# coordinates are read from ZFMK_Coll_Geo, we put a placeholder column here
				self.headerRow.append("{0}".format(messages['coord'][self.lang]))
			self.headerRow.append("{0}".format(self.field_names[i]))
		

	def setTableData(self):
		(conn, cur) = db_connect()
		dataquery = DataQuery(self.uid, self.field_ids, self.lang)
		query = dataquery.getDataQuery(self.specimen_ids)
		params = dataquery.getParams()
		cur.execute(query, params)
		
		# unicode for checked-symbol or small x-symbol 
		barcode_present = [unescape('&#x02717;'), unescape('&#x02714;')]  # -- 0 = not present, 1 = present
		
		self.datarows = []
		# -- Body
		# row[6] contains arbitrary fields, all others are inserted in the order given by self.field_ids
		# is for i in range(0, len(self.field_ids)): needed? shouldn't it be: for field_id in self.field_ids?
		for row in cur:
			datarow = []
			# create data dict here
			data = {}
			if row[6] is not None:
				data = {e[0]: e[1] for e in [d.split(':', 1) for d in row[6].replace('"', '').split("§")]}
			for i in range(0, len(self.field_ids)):
				if self.field_ids[i] == '15':
					# -- insert Coordinates before no. indivuals 
					# therefore, it is before the try: part where the data other are appended
					# this code is hermetic
					if row[1] and row[2]:
						datarow.append("{1};{2}".format(*row))
					else:
						datarow.append("")
				try:  # -- value present?
					# insert the data from data dict here
					datarow.append("{0}".format(data[self.field_ids[i]]))
				except KeyError:
					if self.field_ids[i] == '19':  # -- insert parent Taxon
						datarow.append("{4}".format(*row))
					elif self.field_ids[i] == '65':  # -- Barcode region?
						if self.uid > 0:
							datarow.append("{10}".format(*row))
						else:
							pass
					elif self.field_ids[i] == '93':  # -- Barcode sequence
						if self.uid > 0:
							datarow.append("{9}".format(*row))
						else:
							datarow.append(barcode_present[row[8]])
					elif self.field_ids[i] == '27':  # -- Species
						datarow.append("{3}".format(*row))
					elif self.field_ids[i] == '28':  # -- Vernacular
						datarow.append("{7}".format(*row))
					elif self.field_ids[i] == '22' and row[5]:  # -- Institute
						datarow.append("{5}".format(*row))
					else:
						datarow.append("")
			self.datarows.append(datarow)
		return
		
		
	
	
	def writeCSVFile(self):
		# TODO: should the set up be called here?
		self.setTableHeader()
		self.setTableData()
		
		now = datetime.datetime.now()
		if self.uid > 0:
			trancKey = "{0}-{1}".format(self.uid, str(now))
		else:
			trancKey = "guest-{0}".format(str(now))
		trancKey = trancKey[:-7].replace(':', '').replace(' ', '')
		filename = config['hosturl'].replace('www', '').replace('.', '_') + '-search_results-' + trancKey + ".csv"
		myFile = os.path.join(config['homepath'], "documents/download/results", filename)

		fh = open(myFile, 'w')
		fd = fh.fileno()
		os.write(fd, codecs.BOM_UTF8)  # -- write utf8 byte order mark
		os.write(fd, bytes("\t".join(self.headerRow) + '\n', 'utf-8'))
		
		for datarow in self.datarows:
			os.write(fd, bytes("\t".join(datarow) + '\n', 'utf-8'))
		
		fh.flush()
		fh.close()
		return filename
		
	
	def getHTML(self):
		# TODO: should the set up be called here?
		self.setTableHeader()
		self.setTableData()
		
		res_a = []
		A = res_a.append
		A("<table><tr><th>{0}</th></tr>".format("</th><th>".join(self.headerRow)))
		
		for datarow in self.datarows:
			A("<tr><td>{0}</td></tr>".format("</td><td>".join(datarow)))
		
		A("</table>")
		return "\n".join(res_a)
		
		#self.filename = None
		
		

