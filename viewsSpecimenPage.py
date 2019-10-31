from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import pudb

from gbol.lib.vars import messages, config
from gbol.lib.viewslib import get_language, set_language, get_session_uid
from gbol.lib.getSpecimenDetails import getSpecimenDetails

import logging
log = logging.getLogger(__name__)


@view_config(route_name='specimenPage')
def specimenPage_view(request):
	set_language(request)
	lang = get_language(request)
	session = request.session
	uid = get_session_uid(session)
	specimenid = request.matchdict['name']
	
	htmlfragments = getSpecimenDetails(specimenid, lang= lang, uid = uid)
	
	'''
	viewtarget = request.params.get('viewtarget')
	
	if viewtarget == "iframe":
		result = render('templates/%s/specimendetailpage.pt' % lang, htmlfragments, request=request)
	else:
	'''
	
	result = render('templates/%s/specimendetailcontent.pt' % lang, htmlfragments, request=request)
	response = Response(result)
	return response

