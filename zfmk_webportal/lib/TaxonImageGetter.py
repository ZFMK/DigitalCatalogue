import pudb
import json
from .vars import messages, config
from .viewslib import db_connect


import logging
log = logging.getLogger(__name__)




class TaxonImageGetter():
	def __init__(self, taxon_id):
		self.taxon_id = taxon_id
		(self.con, self.cur) = db_connect()
		self.images = []
	
	
	
	def getTaxonImages(self):
		
		imagequery = """
			SELECT
			GROUP_CONCAT(s.`id` SEPARATOR ';;;'),
			GROUP_CONCAT(s.`AccessionNumber` SEPARATOR ';;;'),
			m.`media_url`,
			m.`media_creator`,
			m.`license`
			FROM ZFMK_Coll_Media m
				INNER JOIN ZFMK_Coll_Specimen s ON (m.`specimen_id` = s.`id`)
				INNER JOIN ZFMK_Coll_Taxa t ON (s.taxon_id = t.id)
			WHERE t.`id` = %s AND m.`media_type` = 'image'
			GROUP BY t.id, m.media_url, m.media_creator, m.license
			LIMIT 20
			;"""
		self.cur.execute(imagequery, (self.taxon_id))
		rows = self.cur.fetchall()
		
		for row in rows:
			if row[0] is not None:
				imagedict = {'specimenid': row[0].split(';;;'), 'accessionnumber': row[1].split(';;;'), 'url': row[2], 'creator': row[3], 'license': row[4]}
				self.images.append(imagedict)
		
		return self.images



