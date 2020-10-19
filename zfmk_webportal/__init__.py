from pyramid.config import Configurator
from pyramid.session import SignedCookieSessionFactory


def main(global_config, **settings):
	config = Configurator()
	config.include('pyramid_beaker')
	config.include('pyramid_chameleon')
	config.add_route('specimenlist', '/')
	config.add_route('collection', '/collection/{collectionname}')
	config.add_route('impressum', '/impressum')
	config.add_route('privacy', '/privacy')

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
	config.add_route('getNamesList', '/autocomplete/getNamesList')
	config.add_route('image_upload', '/static/image_upload')


	config.add_static_view(name='static', path='static')
	config.scan()

	return config.make_wsgi_app()
