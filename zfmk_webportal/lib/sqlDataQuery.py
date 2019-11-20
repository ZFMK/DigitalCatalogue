import logging
log = logging.getLogger(__name__)


class DataQuery():
	def __init__(self, uid, field_ids, lang):
		self.uid = uid
		self.field_ids = field_ids
		self.lang = lang
		self.sql_query = []
		self.sql_grouping = []

	def setSelectStrings(self):
		self.sql_query = []
		self.sql_query.append("SELECT s.id,")
		self.sql_grouping.append('s.id')
		#if self.uid > 0:
		self.sql_query.append("REPLACE(g.lat, ',', '.') AS center_x, REPLACE(g.lon, ',', '.') AS center_y,") # take the original coordinates
		self.sql_grouping.append('g.lat, g.lon')
		#else:
		#	self.sql_query.append("REPLACE(g.center_x, ',', '.'), replace(g.center_y, ',', '.'),") # take the disguised coordinates
		#	self.sql_grouping.append('g.center_x, g.center_y')

		self.sql_query.append("""IF (COALESCE(s.author, t.author) IS NOT NULL,
			CONCAT(COALESCE(s.taxon, t.taxon), ' ', COALESCE(s.author, t.author)), COALESCE(s.taxon, t.taxon)) AS taxon,
		IF (p.author IS NOT NULL, CONCAT(p.taxon, ' ', p.author), p.taxon) AS parenttaxon,
		gi.institute_short AS institute,
		(SELECT
			GROUP_CONCAT(CONCAT('"', d.field_id, '":"',
				IF(d.field_id = 2, SUBSTR(d.term, 1,11), COALESCE(d.term,'')),'"')
				SEPARATOR '§')
			FROM ZFMK_Coll_Data2Specimen ds
				INNER JOIN ZFMK_Coll_Data d ON d.id = ds.data_id
				INNER JOIN ZFMK_Coll_Data_Fields f ON (f.id = d.field_id AND f.lang='{1}')
			 WHERE d.field_id IN ({0}) AND ds.specimen_id = s.id
		) AS data,
		COALESCE(sc.`name`,'') AS vernacular,
		IF(s.barcode>0, 1, 0) AS barcode_count""".format(",".join(self.field_ids), self.lang))

		self.sql_grouping.append('s.taxon, t.taxon, p.taxon, gi.institute_short, s.barcode, vernacular')

	def setJoinString(self):
		self.sql_query.append("""FROM ZFMK_Coll_Specimen s
			LEFT JOIN ZFMK_Coll_Taxa t ON t.id = s.taxon_id
			LEFT JOIN ZFMK_Coll_Taxa p ON p.id = t.parent_id
			LEFT JOIN ZFMK_Coll_TaxaCommonNames sc ON (s.taxon_id=sc.taxon_id and sc.`code`='{0}')
			LEFT JOIN ZFMK_Coll_Institutes gi ON gi.institute_id=s.institute_id
			LEFT JOIN ZFMK_Coll_Geo g ON g.specimen_id = s.id """.format(self.lang))
		if self.uid > 0:
			self.sql_query.append("""LEFT JOIN ZFMK_Coll_Barcode b on b.specimen_id = s.id""")

	def getDataQueryTaxon(self, taxon_name):
		dataquery = ''
		self.setSelectStrings()
		self.setJoinString()

		# set placeholders and params to prevent sql-injection
		self.params = [taxon_name]

		self.sql_query.append("""WHERE coalesce(s.taxon, t.taxon) = %s""")
		#log.debug('%s SQL from dataSelect:\n%s', __name__, " ".join(self.sql_query))
		dataquery = " ".join(self.sql_query).replace('\t', ' ')
		return dataquery

	def getDataQuery(self, specimen_ids):
		dataquery = ''
		self.setSelectStrings()

		if self.uid > 0: # and target == 'export':
			self.sql_query.append(""", COALESCE(b.`sequence`,'') AS barcode_sequence,
				COALESCE(b.`region`,'') AS barcode_region""")
			self.sql_grouping.append('b.`sequence`, b.`region`')
		self.setJoinString()

		# set placeholders and params to prevent sql-injection
		placeholders = ["%s" for element in specimen_ids.split(",")]
		self.params = [int(element) for element in specimen_ids.split(",")]

		self.sql_query.append("""WHERE s.id in ({0})""".format(",".join(placeholders)))
		self.sql_query.append("""GROUP BY {0}""".format(",".join(self.sql_grouping)))
		self.sql_query.append("""ORDER BY `taxon`""")
		#log.debug('%s SQL from dataSelect:\n%s', __name__, " ".join(self.sql_query))
		dataquery = " ".join(self.sql_query).replace('\t', ' ')
		return dataquery

	def getParams(self):
		try:
			return self.params
		except AttributeError:
			return []

