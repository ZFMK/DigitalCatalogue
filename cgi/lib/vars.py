import configparser
import logging

log = logging.getLogger(__name__)

c = configparser.ConfigParser()
c.read("../../production.ini")
config = {}
config['host'] = c['dboption']['chost']
config['port'] = int(c['dboption']['cport'])
config['user'] = c['dboption']['cuser']
config['pw'] = c['dboption']['cpw']
config['db'] = c['dboption']['cdb']
config['homepath'] = c['option']['home']
config['hosturl'] = c['option']['hosturl']
config['news'] = c['news']

config['smtp'] = {}
config['smtp']['sender'] = c['option']['smtp-sender']
config['smtp']['server'] = c['option']['smtp']

config['solr'] = {}
config['solr']['url'] = c['option']['solr_url']
config['solr']['url_auth'] = c['option']['solr_url_auth']
config['solr']['user'] = c['option']['solr_user']
config['solr']['passwd'] = c['option']['solr_passwd']

config['collection_table'] = {}
config['collection_table']['template'] = c['option']['template_collection_sheet']
config['collection_table']['ordered'] = c['option']['collection_table_ordered']
config['collection_table']['filled'] = c['option']['collection_table_filled']

config['dwb'] = {}
config['dwb']['name_suffix'] = c['option']['dwb_name_suffix']
config['dwb']['connection_string'] = c['option']['dwb_connection_string']
config['dwb']['use_dwb'] = int(c['option']['use_dwb'])

config['blast'] = {}
config['blast']['blast_db_home'] = c['blast']['blast_db_home']
config['blast']['default_result_size'] = c['blast']['default_result_size']

if not c.has_option('option', 'dev_group'):
    log.critical('Option `dev_group` is not defined in production.ini!\nPlease add at least one email to the list.')
    raise NameError('Option `dev_group` is not defined in production.ini!\nPlease add at least one email to the list.')
config['dev_group'] = c['option']['dev_group']

taxon_ids = """100408, 100430, 100431, 100451, 100453, 3000243, 3100522, 3200125,
                3200126, 4000014, 4402020, 4403366, 4403382, 4403383, 4404012,
                4404135, 4404679, 4405947, 4406565, 4407062, 4408012, 5000093,
                5000095, 5000203, 5009403, 5009532, 5100497, 5200013, 5210014,
                5220011, 5400004, 5401236, 5413793, 5416518, 5416650, 5426341,
                5428084, 5428327, 5428727, 5428849, 5428977, 5429029, 5429176,
                5429405, 5430460, 5431215"""

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

facets = ("sp.", "fam.", "ord.", "cl.", "subphyl./div.", "phyl./div.", "kingdom",
          "institute", "state", "colldate", "barcode_count")

messages = {}
messages['results'] = {}
messages['results']['choose_taxa'] = {'de': '- Bitte w&auml;hlen Sie ein Taxon aus -',
                                      'en': '- Please choose a taxon -'}
messages['results']['choose_states'] = {'de': '- Bitte w&auml;hlen Sie ein Bundesland aus -',
                                        'en': '- Please choose a state -'}
messages['news_edit'] = {'de': ' Bearbeiten ', 'en': ' Edit '}
messages['news_reset'] = {'de': " Zur&uuml;cksetzen ", 'en': " Reset "}
messages['news_reset_html'] = {'de': "<h2><strong>Titel</strong></h2><p>Inhalt</p>",
                               'en': "<h2><strong>Title</strong></h2><p>Content</p>"}
messages['news_message_saved'] = {'de': "News gespeichert!", 'en': "News saved!"}
messages['news_message_updated'] = {'de': "News bearbeitet!", 'en': "News updated!"}
messages['news_message_empty'] = {'de': "Bitte geben Sie Titel und Inhalt des neuen Newsbeitrages ein!",
                                  'en': "Please enter title and content of the news posting!"}
messages['docs_message_saved'] = {'de': "Dokument gespeichert!", 'en': "Document saved!"}
messages['docs_message_updated'] = {'de': "Dokument bearbeitet!", 'en': "Document updated!"}
messages['docs_message_empty'] = {'de': "Bitte geben Sie Titel und Inhalt des neuen Beitrages ein!",
                                  'en': "Please enter title and content of the posting!"}
messages['docs_message_file_missing'] = {'de': "Bitte w&auml;hlen Sie eine PDF-Datei zum Upload!",
                                  'en': "Please select a pdf-file for upload!"}
messages['docs_message_confirm_del'] = {'de': "Löschen des Dokuments bitte best&auml;tigen!",
                                  'en': "Please confirm to delete the document!"}
messages['docs_message_deleted'] = {'de': "Dokument gel&ouml;scht",
                                  'en': "Document deleted"}
messages['news_cancel'] = {'de': " Abbrechen ", 'en': " Cancel "}
messages['contact'] = {'de': 'Bitte überprüfen Sie die eingegebenen Daten.', 'en': 'Please check the data entered.'}
messages['contact_send'] = {'de': 'Die Mail wurde versandt!', 'en': 'Send mail was successful!'}
messages['letter_sender'] = {'de': 'Absender', 'en': 'Sender'}
messages['letter_send_to'] = {'de': 'Empfänger', 'en': 'Send to'}
messages['letter_order_no'] = {'de': 'Auftragsnummer {0}', 'en': 'Order no. {0}'}
messages['letter_no_samples'] = {'de': 'Anzahl Proben: {0}', 'en': 'No. samples: {0}'}
messages['letter_body1'] = {'de': 'Hinweis: Bitte drucken Sie das Anschreiben aus oder notieren Sie alternativ die ',
                            'en': 'Please print this cover letter or write the'}
messages['letter_body2'] = {'de': 'Auftragsnummer auf einem Zettel und legen diesen dem Probenpaket bei.',
                            'en': 'order number on a slip and send it together with your parcel '
                                  'containing the samples.'}
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
messages['reg_exp_mail_body'] = {'de': 'Hallo {salutation} {title} {vorname} {nachname},\n\n'
                                       'wir haben Ihre Registrierung für die taxonomische Expertise {expertisename} '
                                       'erhalten und an die entsprechenden Koordinatoren weitergeleitet.\n\n'
                                       'Viele Grüße\nIhr GBOL Team',
                                 'en': 'Hello {salutation} {title} {vorname} {nachname},\n\n'
                                       'We have received Your registration for the taxonomic expertise {3} and '
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
messages['pub_updated'] = {'en': 'Publication updated!', 'de': 'Publikation bearbeitet!'}
messages['pub_saved'] = {'en': 'Publication saved!', 'de': 'Publikation gespeichert!'}
messages['pub_error'] = {'en': 'Please enter title and content of the publications posting!',
                         'de': 'Bitte geben Sie Titel und Inhalt des neuen Publikationsbeitrages ein!'}
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
