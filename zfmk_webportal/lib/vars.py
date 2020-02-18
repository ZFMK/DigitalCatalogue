import configparser
import logging
log = logging.getLogger(__name__)

c = configparser.ConfigParser()
c.read("production.ini")
config = {}
config['host'] = c['dboption']['chost']
config['port'] = int(c['dboption']['cport'])
config['user'] = c['dboption']['cuser']
config['pw'] = c['dboption']['cpw']
config['db'] = c['dboption']['cdb']
config['homepath'] = c['option']['home']
config['hosturl'] = c['option']['hosturl']
config['show_header'] = c.getboolean('option','show_header')

config['solr'] = {}
config['solr']['url'] = c['option']['solr_url']
config['solr']['user'] = c['option']['solr_user']
config['solr']['passwd'] = c['option']['solr_passwd']
config['solr']['facet_max_result'] = int(c['option']['solr_facet_max_result'])
config['solr']['max_result'] = str(c['option']['solr_max_result'])



taxon_ids = """100408, 100430, 100431, 100451, 100453, 3000243, 3100522, 3200125,
				3200126, 4000014, 4402020, 4403366, 4403382, 4403383, 4404012,
				4404135, 4404679, 4405947, 4406565, 4407062, 4408012, 5000093,
				5000095, 5000203, 5009403, 5009532, 5100497, 5200013, 5210014,
				5220011, 5400004, 5401236, 5413793, 5416518, 5416650, 5426341,
				5428084, 5428327, 5428727, 5428849, 5428977, 5429029, 5429176,
				5429405, 5430460, 5431215"""

redlist = {}
redlist['source'] = {'de': 'Quelle', 'en': 'Source'}
redlist['category'] = {}
redlist['category'][27] = {'de': 'Aktuelle Bestandssituation', 'en': 'Current population'}
redlist['category'][27]['conditions'] = {}
redlist['category'][27]['conditions']['ex'] = {'de': 'Ausgestorben', 'en': 'Extinct'}
redlist['category'][27]['conditions']['es'] = {'de': 'Extrem selten', 'en': 'Extremely rare'}
redlist['category'][27]['conditions']['ss'] = {'de': 'Sehr selten', 'en': 'Very rare'}
redlist['category'][27]['conditions']['s'] = {'de': 'Selten', 'en': 'Rate'}
redlist['category'][27]['conditions']['mh'] = {'de': 'Mäßig häufig', 'en': 'Moderately frequent'}
redlist['category'][27]['conditions']['h'] = {'de': 'Häufig', 'en': 'Frequent'}
redlist['category'][27]['conditions']['sh'] = {'de': 'Sehr häufig', 'en': 'Very frequent'}
redlist['category'][27]['conditions']['?'] = {'de': 'Unbekannt', 'en': 'Unknown'}
redlist['category'][27]['conditions']['nb'] = {'de': 'Nicht bewertet', 'en': 'Not rated'}
redlist['category'][28] = {'de': 'Kurzfristiger Bestandstrend', 'en': 'Short-termed population trend'}
redlist['category'][28]['conditions'] = {}
redlist['category'][28]['conditions']['vvv'] = {'de': 'Sehr starke Abnahme', 'en': 'Very strong drop'}
redlist['category'][28]['conditions']['vv'] = {'de': 'Starke Abnahme', 'en': 'Strong drop'}
redlist['category'][28]['conditions']['v'] = {'de': 'Abnahme mäßig oder im Ausmaß unbekannt', 'en': 'Moderate drop or extent unknown'}
redlist['category'][28]['conditions']['(v)'] = {'de': 'Gleich bleibend', 'en': 'Constant'}
redlist['category'][28]['conditions']['='] = {'de': 'Gleich bleibend', 'en': 'Constant'}
redlist['category'][28]['conditions']['^'] = {'de': 'Deutliche Zunahme', 'en': 'Clear increase'}
redlist['category'][28]['conditions']['?'] = {'de': 'Daten ungenügend', 'en': 'Insufficient data'}
redlist['category'][29] = {'de': 'Langfristiger Bestandstrend', 'en': 'Long-termed population trend'}
redlist['category'][29]['conditions'] = {}
redlist['category'][29]['conditions']['<<<'] = {'de': 'Sehr starker Rückgang', 'en': 'Very strong drop'}
redlist['category'][29]['conditions']['<<'] = {'de': 'Starker Rückgang', 'en': 'Strong drop'}
redlist['category'][29]['conditions']['<'] = {'de': 'Mäßiger Rückgang', 'en': 'Moderate drop'}
redlist['category'][29]['conditions']['(<)'] = {'de': 'Rückgang, Ausmaß unbekannt', 'en': 'Drop, extent unknown'}
redlist['category'][29]['conditions']['='] = {'de': 'Gleich bleibend', 'en': 'Constant'}
redlist['category'][29]['conditions']['>'] = {'de': 'Deutliche Zunahme', 'en': 'Clear increase'}
redlist['category'][29]['conditions']['?'] = {'de': 'Daten ungenügend', 'en': 'Insufficient data'}
redlist['category'][30] = {'de': 'Letzter Nachweis', 'en': 'Last evidence'}
redlist['category'][31] = {'de': 'Neobiota', 'en': 'Neobiota'}
redlist['category'][31]['conditions'] = {}
redlist['category'][31]['conditions']['N'] = {'de': 'Ja', 'en': 'Yes'}
redlist['category'][32] = {'de': 'Risikofaktoren', 'en': 'Risk factors'}
redlist['category'][32]['conditions'] = {}
redlist['category'][32]['conditions']['-'] = {'de': 'Negativ wirksam', 'en': 'Negatively effective'}
redlist['category'][32]['conditions']['='] = {'de': 'Nicht feststellbar', 'en': 'Not detectable'}
redlist['category'][33] = {'de': 'Rote Liste Kategorie', 'en': 'German Red List categories'}
redlist['category'][33]['conditions'] = {}
redlist['category'][33]['conditions']['0'] = {'de': 'Ausgestorben oder verschollen', 'en': 'Extinct  or missing'}
redlist['category'][33]['conditions']['1'] = {'de': 'Vom Aussterben bedroht', 'en': 'In danger of extinction '}
redlist['category'][33]['conditions']['2'] = {'de': 'Stark gefährdet', 'en': 'Strongly endagnered'}
redlist['category'][33]['conditions']['3'] = {'de': 'Gefährdet', 'en': 'Endagnered'}
redlist['category'][33]['conditions']['G'] = {'de': 'Gefährdung unbekannten Ausmaßes', 'en': 'Endangerment of unknown extent'}
redlist['category'][33]['conditions']['R'] = {'de': 'Extrem selten', 'en': 'Extremely rare'}
redlist['category'][33]['conditions']['V'] = {'de': 'Vorwarnliste', 'en': 'Heads-up list'}
redlist['category'][33]['conditions']['*'] = {'de': 'Ungefährdet', 'en': 'Not endangered'}
redlist['category'][33]['conditions']['D'] = {'de': 'Daten unzureichend', 'en': 'Insufficient data'}
redlist['category'][33]['conditions']['nb'] = {'de': 'Nicht bekannt', 'en': 'Unknown'}
redlist['category'][34] = {'de': 'Sonderfälle', 'en': 'Exceptions'}
redlist['category'][35] = {'de': 'Verantwortlichkeit', 'en': 'Responsibility'}
redlist['category'][35]['conditions'] = {}
redlist['category'][35]['conditions']['!!'] = {'de': 'In besonders hohem Maße verantwortlich', 'en': 'Extremely high responsibility'}
redlist['category'][35]['conditions']['!'] = {'de': 'In hohem Maße verantwortlich', 'en': 'High responsibility'}
redlist['category'][35]['conditions']['(!)'] = {'de': 'In besonderem Maße für hochgradig isolierte Vorposten verantwortlich', 'en': 'Especially responsible for highly isolated outposts'}
redlist['category'][35]['conditions']['nb'] = {'de': 'Nicht bewertet, mindestens allgemeine Verantwortlichkeit', 'en': 'Not rated, at least common responsibility'}
redlist['category'][35]['conditions']['?'] = {'de': 'Daten ungenügend, eventuell erhöhte Verantwortlichkeit zu vermuten', 'en': 'Insufficient data, maybe higher responsibility assumed'}

states = {'de': ["Europa",
				 "Baden-Württemberg",
				 "Bayern",
				 "Berlin",
				 "Brandenburg",
				 "Bremen",
				 "Hamburg",
				 "Hessen",
				 "Mecklenburg-Vorpommern",
				 "Niedersachsen",
				 "Nordrhein-Westfalen",
				 "Rheinland-Pfalz",
				 "Saarland",
				 "Sachsen",
				 "Sachsen-Anhalt",
				 "Schleswig-Holstein",
				 "Thüringen"],
		  'en': ["Europe",
				 "Baden-Württemberg",
				 "Bavaria",
				 "Berlin",
				 "Brandenburg",
				 "Bremen",
				 "Hamburg",
				 "Hesse",
				 "Mecklenburg Western Pomerania",
				 "Lower Saxony",
				 "North Rhine Westphalia",
				 "Rhineland Palatinate",
				 "Saarland",
				 "Saxony",
				 "Saxony-Anhalt",
				 "Schleswig-Holstein",
				 "Thuringia"]}

solr_sort_options = {
	"de":{
		"Art": "tax_species",
		"Artname": "vernacular",
		"Katalognummer": "accessionnumber",
		"Taxon Name": "parenttaxonname",
		"Land": "country",
		"Bundesland": "state",
		"Typenstatus": "typestatus"
	},
	"en":{
		"Species": "tax_species",
		"Common name": "vernacular",
		"Catalogue number": "accessionnumber",
		"Taxon Name": "parenttaxonname",
		"Country": "country",
		"State": "state",
		"Type status": "typestatus"
	}
}

messages = {}
messages['red_list_view'] = {'de': "Rote Liste Daten nur für registrierte Nutzer sichtbar", 'en': "Red List data for registered users only"}
messages['no_results'] = {'de': "Es tut uns leid, für das gesuchte Taxon haben wir noch kein Material in GBOL erhalten oder "
					"das Taxon wird nicht für Deutschland geführt. Bitte wenden Sie sich bei Fragen gerne per Mail "
					"an info@bol-germany.de.",
			  'en': "We are sorry, no entries for this taxon have been found. Either we did not get any specimens "
					"for this taxon so far, or it is not listed on the target list for Germany. Please contact us "
					"via info@bol-germany.de for any further inquiries."}
messages['no_results_rl'] = {'de': "Für diese Art ist kein Rote Liste Status verfügbar.",
			  'en': "There is no information on the red list status for this species."}
messages['errors'] = {}
messages['errors']['file_not_found'] = {'de': {'err_title': 'Datei nicht gefunden', 'err_text': 'Die angeforderte Datei {0} konnte nicht gefunden werden'},
	'en': {'err_title': 'File not found', 'err_text': 'The file {0} you requested could not be found!'}}
messages['errors']['connection_error'] = {'de': {'err_title': 'Verbindungsfehler', 'err_text': 'Verbindungsfehler: das Feature zur filtrierten Suche ist leider nicht verfügbar. Die Verbindung zum Indexing Server konnte nicht hergestellt werden. Bitte versuchen Sie es später noch einmal.'},
	'en': {'err_title': 'Connection error', 'err_text': 'Connection error: the filtered search feature is currently not available. A connection error to the index server occured, please try again later'}}
messages['errors']['invalid_sequence'] = {'de': {'err_title': 'Ungültige oder keine Sequenz', 'err_text': 'Die hochgeladenen Sequenz ist nicht im FASTA Format oder es wurde keine Sequenz angegeben!'},
	'en': {'err_title': 'Invalid or no sequence provided', 'err_text': 'The sequence uploaded has no FASTA format or you you did not paste a sequence at all!'}}
messages['errors']['blast_program_error'] = {'de': {'err_title': 'Fehler beim blasten der Sequenz: {0}\n\tDer Fehler ist: {1}', 'err_text': ''},
	'en': {'err_title': 'Error blasting sequence: {0}\n\tError was: {1}', 'err_text': ''}}
messages['errors']['ncbi_search_disabled'] = {'de': {'err_title': 'NCBIO Blast Suche steht zur Zeit leider nicht zur Verfügung', 'err_text': ''},
	'en': {'err_title': 'NCBI blast search is currently disabled', 'err_text': ''}}
messages['results'] = {}
messages['results']['choose_taxa'] = {'de': '- Bitte w&auml;hlen Sie ein Taxon aus -',
	'en': '- Please choose a taxon -'}
messages['results']['choose_states'] = {'de': '- Bitte w&auml;hlen Sie ein Bundesland aus -',
	'en': '- Please choose a state -'}
messages['saved_filters'] = {'en': 'Saved filters', 'de': 'Gespeicherte Filter'}


messages['pls_select'] = {'de': 'Bitte wählen', 'en': 'Please select'}
messages['wrong_credentials'] = {'de': 'Falscher Benutzer oder Passwort!', 'en': 'Wrong user or password!'}
messages['still_locked'] = {'de': 'Sie wurden noch nicht von einem Koordinator freigeschaltet!',
							'en': 'Your account must be unlocked by the Administrator!'}
messages['required_fields'] = {'de': 'Bitte alle Pflichtfelder ausfüllen!',
							   'en': 'Please fill out all required fields!'}
messages['username_present'] = {'de': 'Nutzername schon vorhanden, bitte wählen Sie einen anderen.',
								'en': 'Username already present, please choose another one.'}
messages['user_created'] = {'de': 'Ihre Registrierungsanfrage wird bearbeitet. Sie werden in Kürze eine Email '
								  'Benachichtigung zum Stand Ihrer Freigabe für das GBOL Webportal erhalten.',
							'en': 'User created. Please wait for unlock of your account by the administrator.'}
messages['reg_exp_mail_subject'] = {'de': 'Ihre Registrierung beim GBOL Webportal',
									'en': 'Your Registration at GBOL Webportal'}
messages['reg_exp_mail_body'] = {'de': 'Hallo {saluttext},\n\n'
									   'wir haben Ihre Registrierung für die taxonomische Expertise {expertisename} '
									   'erhalten und an die entsprechenden Koordinatoren weitergeleitet.\n\n'
									   'Viele Grüße\nIhr GBOL Team',
								 'en': 'Hello {saluttext},\n\n'
									   'We have received Your registration for the taxonomic expertise {expertisename} and '
									   'have send them to the corresponding GBOL-taxon coordinators.\n\n'
									   'Best regards,\nYour GBOL team'}
messages['reg_exp_chg_mail_body'] = {'de': 'Hallo {tk_user},\n\n{req_user} hat sich für die Expertise {expertisename} '
										   'registriert.\nBitte prüfen Sie die Angaben und zertifizieren die '
										   'Expertise anschließend.\n\nViele Grüße\nIhr GBOL Team',
									 'en': 'Hello {tk_user},\n\n{req_user} applies for the taxonomic expertise '
										   '{expertisename}.\nPlease check the data and approve or decline the request.'
										   '\n\nBest regards, Your GBOL team'}
messages['reg_exp_accept'] = {'de': """Hallo {3} {1} {2},

die Expertise {0} in Ihrem GBOL Konto wurde erfolgreich von einem Koordinator freigegeben.

Viele Grüße
Ihr GBOL Team
""", 'en': """Hello {3} {1} {2}

The expertise {0} of your GBOL account has been approved by the coordinator.

Best regards,
The GBOL Team
"""}
messages['reg_exp_decline'] = {'de': """Hallo {3} {1} {2},

die Expertise {0} in Ihrem GBOL Konto wurde von einem Koordinator abgelehnt.
Sie können sich bei Fragen im Kontakt-Bereich bei uns melden.

Viele Grüße
Ihr GBOL Team
""", 'en': """Hello {3} {1} {2}

The expertise {0} of your GBOL account has been refused by the coordinator.
If You have any questions regarding the GBOL approval process, please send us a note in the contact area.
We will answer Your inquiry as soon as possible.

Best regards,
The GBOL Team
"""}

messages['pwd_forgot_email_body'] = {'de': """{0},

eine Anfrage zum Zurücksetzen des Passworts für Ihr Benutzerkonto auf
dem German Barcode of Life Webportal wurde gestellt.

Sie können Ihr Passwort mit einem Klick auf folgenden Link ändern:

http://{1}/sammeln/change-password?link={2}

Ihr Benutzername lautet: {3}

Dieser Link kann nur einmal verwendet werden und leitet Sie zu einer Seite,
auf der Sie ein neues Passwort festlegen können. Er ist einen Tag lang gültig
und läuft automatisch aus, falls Sie ihn nicht verwenden.

Viele Grüße
Das Team von German Barcode of Life""",
									 'en': """{0},

a request for password reset for your useraccount on the
German Barcode of Life webportal has been posed.

You can change your password with the following link:

http://{1}/sammeln/change-password?link={2}

Your user name is: {3}

Please note: this link can only be used once. The link will direct you to a
website where you can enter a new password.
The link is valid for one day.

Best wishes,
Your team from German Barcode of Life"""}
messages['pwd_forgot_email_subject'] = {'de': 'Neue Login-Daten für {0} auf German Barcode of Life',
										'en': 'New login data for your user {0} on German Barcode of '
											  'Life webportal'}
messages['pwd_forgot_sent'] = {'de': 'Das Passwort und weitere Hinweise wurden an '
									 'die angegebene Email-Adresse gesendet.',
							   'en': 'The password and further tips werde sent to your email address.'}
messages['pwd_forgot_not_found'] = {'de': 'Es wurde kein Benutzer mit eingegebenem Namen bzw. Email gefunden.',
									'en': 'No user found with the name or the email entered.'}
messages['pwd_unmatch'] = {'de': 'Die beiden Passwörter stimmen nicht überein.', 'en': 'Passwords do not match.'}
messages['pwd_saved'] = {'de': 'Neues Passwort gespeichert.', 'en': 'New password saved'}
messages['pwd__link_used'] = {'de': 'Link wurde bereits benutzt.', 'en': 'The link has been used already'}
messages['pwd__link_invalid'] = {'de': 'Kein gültiger Link.', 'en': 'Link invalid'}
messages['pwd__link_timeout'] = {'de': 'Link ist nicht mehr gültig.', 'en': 'Link has timed out'}
messages['order_success'] = {'de': 'Danke, Ihre Bestellung wurde entgegengenommen.',
							 'en': 'Thank You, the order has been received.'}
messages['order_info_missing'] = {'de': 'Bitte füllen Sie alle Felder aus.', 'en': 'Please fill out all fields.'}
messages['edt_no_passwd'] = {'de': 'Bitte geben Sie Ihr Passwort an, um das Benutzerprofil zu ändern.',
							 'en': 'Please provide your password in order to change the userprofile.'}
messages['edt_passwd_wrong'] = {'de': 'Falsches Passwort.', 'en': 'Wrong password.'}
messages['edt_passwd_mismatch'] = {'de': 'Die beiden neuen Passwörter stimmen nicht überein.',
								   'en': 'Both new passwords do not match.'}
messages['edt_success'] = {'de': 'Benutzerprofil erfolgreich geändert', 'en': 'Userprofile updated.'}
messages['err_upload'] = {'de': 'Ein Fehler ist beim Hochladen der Sammeltabelle aufgetreten. '
								'Bitte schicken Sie Ihre Sammeltabelle per E-Mail an den Taxonkoordinator.',
						  'en': 'An error occured when uploading the collection sheet. Please sent it to the '
								'taxon coordinator via e-mail.'}
messages['succ_upload'] = {'de': 'Die Sammeltabelle wurde erfolgreich hochgeladen!',
						   'en': 'Collection sheet uploaded successfully!'}
messages['download'] = {'de': 'Herunterladen', 'en': 'Download'}
messages['cert'] = {'de': 'zertifiziert', 'en': 'certified'}
messages['subm'] = {'de': 'beantragt', 'en': 'submitted'}
messages['del_user_exp'] = {'de': 'Expertise zurückziehen', 'en': 'Withdraw expertise'}
messages['del_user_exp_reminder'] = {'de': 'Entzogene Expertise(n) wurde(n) auf "beantragt" zurück gesetzt, bitte lehnen Sie sie noch ab, um den Vorgang abzuschließen', 'en': 'Withdrawn expertise(s) where moved to expertise requests. Please decline the expertises to confirm the withdrawing process.'}
messages['select'] = {'de': 'Auswahl', 'en': 'Please select'}
messages['robot'] = {'de': 'Registrierung konnte nicht durchgeführt werden!', 'en': 'Could not process registration!'}
messages['email_reg_subject'] = {'de': 'GBOL Registrierung', 'en': 'GBOL Registration'}
messages['email_reg_body'] = {'de': """"Hallo {4} {2} {3}

ihr GBOL Konto {0} wurde erfolgreich von einem Koordinator freigegeben.
Sie können sich nun im dem Experten-Bereich anmelden.

Viele Grüße
Ihr GBOL Team
""", 'en': """Hello {4} {2} {3}

Your GBOL account has been approved by the coordinator.
You can now login into the expert area.

Best regards,
The GBOL Team
"""}
messages['email_reg_body_decline'] = {'de': """"Hallo {4} {2} {3}

ihr GBOL Konto {0} wurde von einem Koordinator abgelehnt.
Sie können sich bei Fragen im Kontakt-Bereich von GBOL bei uns melden.

Best regards,
Ihr GBOL Team
""", 'en': """Hello {4} {2} {3}

Your GBoL account has been refused by the coordinator.
If You have any questions regarding the GBoL approval process, please send us a note in the contact area.
We will answer Your inquiry as soon as possible.

Best regards,
The GBOL Team
"""}
messages['states'] = {'de': {'raw': 'Neu', 'cooking': 'in Arbeit', 'done': 'Fertig'},
					  'en': {'raw': 'New', 'cooking': 'in progress', 'done': 'Done'}}
messages['error'] = {'de': 'Keine Ergebnisse gefunden', 'en': 'Nothing found'}
messages['coord'] = {'de': 'Koordinaten (lat/lon)', 'en': 'Coordinates (lat/lon)'}
messages['taxon'] = {'de': 'Taxon', 'en': 'Higher taxon'}
messages['ncoll'] = {'en': 'Not Collected', 'de': 'Nicht gesammelt'}
messages['nbar'] = {'en': 'No Barcode', 'de': 'Kein Barcode'}
messages['barc'] = {'en': 'Barcode', 'de': 'Barcode'}

messages['mail_req_body'] = """Guten Tag {0},

eine Bestellung für Versandmaterial wurde auf dem GBOL-Portal abgesendet.

Gesendet am {1}

Bestellung:
Material: {2}
Anzahl Verpackungseinheiten: {3}
Taxonomische Gruppe: {4}

Nummer erstes Sammelröhrchen: {5}
Nummer letztes Sammelröhrchen: {6}

Absender:
	{name}
	{street}
	{city}
	{country}
	Email: {email}

"""

messages['material_request_address_missing'] = {
'de': 'Ihre Addressdaten sind unvollständig, bitte ergänzen Sie sie in <a href="/sammeln/userEdit">Ihrem Nutzerprofil</a> an',
'en': 'Some of your address data are missing, please add them to <a href="/sammeln/userEdit">your user profil</a>'
}


# -- In case of an error one of these messages are send to the dev_group specified in production.ini
messages['error'] = {}
messages['error']['order_processing'] = """
Eine Bestellung für Versandmaterial konnte nicht verarbeitet werden:

Bestellzeit: {1}
Koordinator (User-id): {0}
Möglicher Trasaktions-Key: {9}

Bestellung:
	Material: {2}
	Anzahl Verpackungseinheiten: {3}
	Taxonomische Gruppe (ID): {4}

Nummer erstes Sammelröhrchen: {5}
Nummer letztes Sammelröhrchen: {6}

Bestellt von:
	User-ID: {7}
	Name: {8}

Fehler:
{10}

"""
