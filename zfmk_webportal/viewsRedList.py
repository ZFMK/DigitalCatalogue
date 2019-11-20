from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import pudb

from .lib.vars import messages, config
from .lib.viewslib import get_language, set_language, get_session_uid
from .lib.getRedList import RedList


import logging
log = logging.getLogger(__name__)


@view_config(route_name='getRedList')
def getRedList_view(request):
	lang = get_language(request)
	taxon_id = request.POST.get('taxon_id')
	dataformat = request.POST.get('dataformat')

	redlist = RedList(taxon_id)
	if dataformat == 'htmltable':
		redlistdata = '{{"htmltable": "{0}"}}'.format(redlist.getHTMLRedListTable(lang))
	else:
		redlistdata = redlist.getRedListData(lang)

	return Response(redlistdata)
