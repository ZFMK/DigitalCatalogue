from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import pudb

from .lib.vars import messages, config
from .lib.viewslib import get_language, set_language, get_session_uid
from .lib.NamesRetrieval import NamesRetrieval

import logging
log = logging.getLogger(__name__)


@view_config(route_name='getNamesList', renderer="json")
def getNames_view(request):
	#session = request.session
	#uid = get_session_uid(session)
	
	field = request.params.getone('field')
	searchterm = request.params.getone('search')
	
	namesgetter = NamesRetrieval(request, field, searchterm)
	resultrows = namesgetter.getResultRows()
	nameslist = []
	for name in resultrows:
		nameslist.append(name)  
	
	return {'names': nameslist}




