"""

"""

import pudb
import json
from .vars import messages, config
from .viewslib import db_connect
from .getRedList import RedList

# replaced by reading the URLs from gbol-python database
#from .getImageUrls import getImageUrls


import logging
log = logging.getLogger(__name__)


def getSpecimenDetails(specimenid, lang="en", uid=0):
	df_ids = (1, 8, 9, 22, 12, 15, 16, 17, 3, 4, 5, 7, 11, 13, 15, 26)
	bf_ids = (93, 21, 65, 66, 68, 74, 94, 76, 75, 77, 78, 80)
	spec_info = ""
	barcode_info = ""
	geo_info = ""
	(conn, cur) = db_connect()
	sql = """SELECT s.taxon,
					tf.tax_order,
					tf.tax_class,
					(SELECT
						d.term
						FROM ZFMK_Coll_Data2Specimen ds
							INNER JOIN ZFMK_Coll_Data d ON d.id = ds.data_id
						WHERE d.field_id = 1 AND ds.specimen_id = s.id
					) AS accessionnumber,
					tf.taxon_id
				FROM ZFMK_Coll_TaxaFlat tf
					LEFT JOIN ZFMK_Coll_Specimen s ON tf.taxon_id = s.taxon_id
				WHERE s.id = %s"""
	cur.execute(sql, specimenid)
	row = cur.fetchone()
	taxon = row[0]
	accnum = row[3]
	taxon_id = row[4]
	if accnum is None:
		accnum = ''

	if row[1] is None:
		data = ""
	else:
		tax_order = row[1]
		tax_class = row[2]
		sql1 = """SELECT DISTINCT e.name,
				COUNT(ue.uid),
				GROUP_CONCAT(u.vorname ,' ' , u.Nachname SEPARATOR '<br>')
			FROM Expertise e
			LEFT JOIN UserExpertise ue ON e.tid = ue.id_expertise
			LEFT JOIN (SELECT uid, vorname, nachname FROM users WHERE role=3 AND public=1 UNION
						SELECT uid, NULL, NULL FROM users WHERE role=3 AND public=0) u ON u.uid = ue.uid
			WHERE name LIKE %s OR name LIKE %s
			GROUP BY e.name
			ORDER BY e.name"""
		cur.execute(sql1, ("%{0}%".format(tax_order), "%{0}%".format(tax_class)))
		data = ""
		if cur is None:
			if lang == "de":
				data += '<p class="align-left">Keine Experten in der Datenbank</p>'
			elif lang == "en":
				data += '<p class="align-left">No experts in the database</p>'
		else:
			for row in cur:
				data += '<p class="align-left">' + row[0] + '<br><span class="smaller_font">' + str(row[1])
				if row[1] == 1:
					if lang == "de":
						data += " Experte*"
					elif lang == "en":
						data += " expert*"
				else:
					if lang == "de":
						data += " Experten*"
					elif lang == "en":
						data += " experts*"
				if str(row[2]) == 'None':
					data += "</span></p><p>Keine Experten mit &ouml;ffentlichem Namen</p>"
				else:
					data += "</span></p><p> " + str(row[2]) + '</p>'
			if lang == "de":
				data += '<p class="align-left"><span class="smaller_font">* Experten mit &ouml;ffentlichem Namen im Profil</span></p>'
			elif lang == "en":
				data += '<p class="align-left"><span class="smaller_font">* Experts with public names in their profile</span></p>'

	# get specimen and collection/geo data
	sql2 = """SELECT
				d.field_id,
				f.field_name,
				d.term
				FROM ZFMK_Coll_Data2Specimen ds
					INNER JOIN ZFMK_Coll_Data d ON d.id = ds.data_id
					INNER JOIN ZFMK_Coll_Data_Fields f ON (f.id = d.field_id AND f.lang = %s)
				WHERE d.field_id IN ({0}) AND ds.specimen_id = %s
				ORDER BY d.field_id, d.id""".format(', '.join("%s" for _ in df_ids))
	if uid == 0:
		sql2 += " AND restricted != 1"
	cur.execute(sql2, (lang, *df_ids, specimenid))

	# fields without depositor name
	spec_info_fields = (1, 8, 22, 12, 15, 16, 17)
	if uid != 0:
		# fields with depositor name
		spec_info_fields = (1, 8, 9, 22, 12, 15, 16, 17)
	for row in cur:
		if row[0] in spec_info_fields:
			spec_info += row[1] + ": " + row[2] + "<br>"
		if row[0] in (3, 4, 5, 7, 11, 13, 26):
			geo_info += row[1] + ": " + row[2] + "<br>"

	# get barcode data
	sql3 = """SELECT DISTINCT
					b.`id`,
					b.`sequence`,
					br.field_id,
					f.field_name,
					br.term,
					br.read_id,
					br.id,
					b.`region`,
					b.`responsible`
					FROM ZFMK_Coll_Barcode b LEFT JOIN ( -- left join when no barcode read data are available for barcode: old toolusage
						ZFMK_Coll_Barcode_Reads br
						INNER JOIN ZFMK_Coll_Data_Fields f ON (f.id = br.field_id AND f.lang = %s)
						) ON br.barcode_id = b.id
					WHERE (br.field_id IN ({0}) OR br.barcode_id is NULL) AND b.specimen_id = %s""".format(', '.join("%s" for _ in bf_ids))
	if uid == 0:
		sql3 += " AND restricted != 1"
	sql3 += " ORDER BY b.id, br.read_id, br.id, br.field_id"
	cur.execute(sql3, (lang, *bf_ids, specimenid))
	barcode_dict = {}
	barcode_info = ""
	#pudb.set_trace()
	if cur.rowcount == 0:
		# the results may be available on boldsystems, how to check this and insert them?
		if lang == "de":
			barcode_info = "Keine &ouml;ffentlichen Ergebnisse"
		else:
			barcode_info = "No publicly available results"
	else:
		barcode_dict = {}
		for row in cur:
			##### Das hier funktioniert nicht mit einem dictionary, weil es für die Richtungen unterschiedliche Daten gibt, die mit dem selben Schlüssel gespeichert sind
			##### es gibt wieder nur eine Zuordnung der Richtungen nach der Reiehfolge der Daten
			# if row[0] in (93, 21, 65, 66, 68, 74, 94, 76, 75, 77, 78, 80): # set in select query
			try:
				barcode_dict[row[0]]
			except KeyError:
				barcode_dict[row[0]] = {}
				barcode_dict[row[0]]['sequence'] = row[1]
				barcode_dict[row[0]]['region'] = row[7]
				barcode_dict[row[0]]['responsible'] = row[8]
				barcode_dict[row[0]]['read'] = {}
			# add a dictionary for each read
			try:
				barcode_dict[row[0]]['read'][row[5]]
			except KeyError:
				barcode_dict[row[0]]['read'][row[5]] = []
			if row[2] == 77:
				linkname = row[4]
			elif row[2] == 66:
				pass
			elif row[2] == 68:
				pass
			elif row[2] == 78:
				try:
					linkname
				except UnboundLocalError:
					linkname = "link to tracefile"
				# TODO: remove html
				barcode_dict[row[0]]['read'][row[5]].append(row[3]+': <a href="' + row[4] + '" target="_blank">' + linkname + '</a>')
				#barcode_info += row[3] + ": " + '<a href="' + row[4] + '" target="_blank">' + linkname + '</a>' + "<br>"
			else:
				try:
					barcode_dict[row[0]]['read'][row[5]].append(row[3] + " : " + row[4])
				except TypeError:
					# a bloody fix for empty barcode reads from toolusage, the chaos with toolusage with reads, without reads, parallel barcodes in tooluage and methods is hell!
					# TODO: fix that
					pass
					#barcode_info += row[1] + ": " + row[2] + "<br>"

	# get image data
	imagequery = """SELECT
			m.`media_url`,
			m.`media_creator`,
			m.`license`
			FROM ZFMK_Coll_Media m
				INNER JOIN ZFMK_Coll_Specimen s ON (m.`specimen_id` = s.`id`)
			WHERE s.`id` = %s AND m.`media_type` = 'image'
			ORDER BY m.`id`"""
	cur.execute(imagequery, (specimenid))
	rows = cur.fetchall()
	imagedata = []
	for row in rows:
		if row[0] is not None:
			imagedict = {'url': row[0], 'creator': row[1], 'license': row[2]}
			imagedata.append(imagedict)


	cur.close()
	conn.close()


	redlist = RedList(taxon_id)
	redlisttable = redlist.getHTMLRedListTable(lang)


	## alternative for getting image urls:
	# use DC webservice to get the image urls for a specimen
	#imageurls = getImageUrls(accnumber = accnum)
	result = {"id": specimenid, "taxon": taxon, "accnum": accnum, "expertise": data,
		"spec_info": spec_info, "barcode_dict": barcode_dict, "barcode_info": barcode_info, "geo_info": geo_info,
		"imagedata": imagedata, 'redlisttable': redlisttable}
	return result



