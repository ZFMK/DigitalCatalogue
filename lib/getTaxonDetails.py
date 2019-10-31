"""
TODO: Das hier ist gruselig! Vermengung von Daten und Darstellung in Reinstform
aber, es war noch gruseliger...
"""

import pudb
import json
from gbol.lib.vars import messages, config
from gbol.lib.viewslib import db_connect
from gbol.lib.getRedList import RedList



import logging
log = logging.getLogger(__name__)


def getTaxonDetails(taxon, lang="en"):
	(conn, cur) = db_connect()
	sql = "SELECT tax_order, tax_class, taxon_id FROM ZFMK_Coll_TaxaFlat WHERE tax_species = %s"
	cur.execute(sql, taxon)
	row = cur.fetchone()
	if row is None:
		data = ""
		redlisttable = ""
	else:
		tax_order = row[0]
		tax_class = row[1]
		taxon_id = row[2]
		sql2 = """SELECT DISTINCT e.name,
				COUNT(ue.uid),
				GROUP_CONCAT(u.vorname ,' ' , u.Nachname SEPARATOR '<br>')
			FROM Expertise e 
			LEFT JOIN UserExpertise ue ON e.tid = ue.id_expertise
			LEFT JOIN (SELECT uid, vorname, nachname FROM users WHERE role=3 AND public=1 UNION
						SELECT uid, NULL, NULL FROM users WHERE role=3 AND public=0) u ON u.uid = ue.uid
			WHERE name LIKE %s OR name LIKE %s
			GROUP BY e.name
			ORDER BY e.name""".format(tax_order, tax_class)
		cur.execute(sql2, ("%{0}%".format(tax_order), "%{0}%".format(tax_class)))
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
		
		redlist = RedList(taxon_id)
		redlisttable = redlist.getHTMLRedListTable(lang)
	
	cur.close()
	conn.close()
	
	
	result = {"taxon": taxon, "expertise": data, "redlisttable": redlisttable}
	return result
	
