from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import pudb

from .lib.vars import messages, config
from .lib.viewslib import get_language, set_language, get_session_uid
from .lib.getTaxonDetails import getTaxonDetails

import logging
log = logging.getLogger(__name__)

@view_config(route_name='taxonPage')
def taxonDetailPage_view(request):
	set_language(request)
	lang = get_language(request)
	taxon = request.matchdict['name']
	htmlfragments = getTaxonDetails(taxon, lang = lang)

	viewtarget = request.params.get('viewtarget')
	# if viewtarget = iframe, it generates a complete html page, otherwise the html to fill a div
	if viewtarget == "iframe":
		result = render('templates/%s/taxondetailpage.pt' % lang, htmlfragments, request=request)
	else:
		result = render('templates/%s/taxondetailcontent.pt' % lang, htmlfragments, request=request)
	response = Response(result)
	return response


