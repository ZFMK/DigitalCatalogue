from pyramid.config import Configurator
from pyramid.session import SignedCookieSessionFactory


def main(global_config, **settings):
	# my_session_factory = SignedCookieSessionFactory('itsaseekreet')
	# config = Configurator(session_factory=my_session_factory)
	config = Configurator()
	config.include('pyramid_beaker')
	config.include('pyramid_chameleon')
	config.add_route('specimenlist', '/')
	config.add_route('collection', '/collection/{collectionname}')
	config.add_route('impressum', '/impressum')
	config.add_route('privacy', '/privacy')
	config.add_route('kontakt', '/kontakt')

	config.add_route('taxonPage', '/taxondetail/{name}')
	config.add_route('specimenPage', '/specimendetail/{name}')

	config.add_route('download', '/download')
	config.add_route('upload_media', '/upload_media')
	config.add_route('loadTreeView', '/static/loadTreeView')
	config.add_route('getSpecimenGeoInfo', '/static/getSpecimenGeoInfo')
	config.add_route('getRedList', '/static/getRedList')
	config.add_route('facet_get_more', '/static/facet_get_more')
	config.add_route('load_facet_form', '/static/load_facet_form')
	config.add_route('save_filter', '/static/save_filter')
	config.add_route('delete_filter', '/static/delete_filter')
	config.add_route('csvExport', '/static/csvExport')
	config.add_route('fastaExport', '/static/fastaExport')
	config.add_route('autocomplete_statistics', '/static/autocomplete_statistics')
	config.add_route('get_statisticsDE', '/static/get_statisticsDE')
	config.add_route('get_statisticsBL', '/static/get_statisticsBL')
	config.add_route('get_statisticsMI', '/static/get_statisticsMI')
	config.add_route('image_upload', '/static/image_upload')
	config.add_route('identifications', '/identifications')
	# Ajax wrapper for CKEditors filemanager:
	config.add_route('filemanager', '/static/js/ckeditor/filemanager/connectors/php/filemanager')
	# Internationalization:
	# config.add_translation_dirs('gbol:locale')
	
	# views not used any more
	'''
	config.add_route('institute', '/team/gbol-institute')
	config.add_route('organisation', '/team/organisation')
	config.add_route('projekte', '/team/projekte')
	config.add_route('experten', '/team/experten')
	
	config.add_route('results', 'ergebnisse/results')
	config.add_route('stats_country', 'ergebnisse/fragments/stats_country')
	config.add_route('stats_state', 'ergebnisse/fragments/stats_state')
	config.add_route('stats_missing', 'ergebnisse/fragments/stats_missing')
	
	config.add_route('links', '/links')
	config.add_route('news', '/news/news')
	config.add_route('publikationen', '/news/publikationen')
	config.add_route('test', '/test')
	config.add_route('newsletter', '/newsletter')
	config.add_route('was-ist-gbol', '/gbol/was-ist-gbol')
	config.add_route('vision', '/gbol/vision')
	config.add_route('ziele', '/gbol/ziele')
	config.add_route('anwendungsgebiete', '/gbol/anwendungsgebiete')
	config.add_route('warum-dna-barcoding', '/dna-barcoding/warum-dna-barcoding')
	config.add_route('was-ist-dna-barcoding', '/dna-barcoding/was-ist-dna-barcoding')
	config.add_route('wer-kann-mitmachen', '/mitmachen/wer-kann-mitmachen')
	config.add_route('teilnahmeinfos', '/mitmachen/teilnahmeinfos')
	config.add_route('vorteile', '/mitmachen/vorteile')
	config.add_route('verantwortung-der-sammler', '/mitmachen/verantwortung-der-sammler')

	config.add_route('login', '/sammeln/login')
	config.add_route('pw-forgot', '/sammeln/passwort-vergessen')
	config.add_route('pw-change', '/sammeln/change-password')
	config.add_route('logout', '/sammeln/logout')
	config.add_route('regist', '/sammeln/regist')
	config.add_route('dashboard', '/sammeln/dashboard')
	config.add_route('versenden', '/sammeln/sammeln-versenden')
	config.add_route('material-anfordern', '/sammeln/versandmaterial-anfordern')
	config.add_route('sammeltabelle', '/sammeln/sammeltabelle-herunterladen')
	config.add_route('versandanschreiben', '/sammeln/versandanschreiben')
	config.add_route('versandanschreiben-anzeigen', '/sammeln/versandanschreiben-anzeigen')
	config.add_route('webeditor', '/sammeln/webeditor')
	config.add_route('nutzer-editieren', '/sammeln/userEdit')
	
	config.add_route('nutzer-zertifizieren', '/admin/certify-users')
	config.add_route('expertise-zertifizieren', '/admin/certify-expertise')
	config.add_route('nutzer-verwaltung', '/admin/user-management')
	config.add_route('admin_material', '/admin/material')
	config.add_route('masqUserList', '/admin/masq_user_list')
	config.add_route('masqUser', '/admin/masq_user')
	
	config.add_route('documents', 'ergebnisse/documents')
	config.add_route('getImageUrls', '/ergebnisse/getImageUrls')
	config.add_route('searchUser', '/static/searchUser')
	config.add_route('tableeditor', '/colltable/edit')
	config.add_route('getCollTableData', '/colltable/getdata')
	config.add_route('writeCollTableData', '/colltable/writedata')
	
	'''

	config.add_static_view(name='static', path='static')
	config.scan()

	return config.make_wsgi_app()
