from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render

from .lib.vars import config, messages
from .lib.viewslib import get_language, set_language


@view_config(route_name='privacy')
def privacy_view(request):
	set_language(request)
	lang = get_language(request)
	show_header = config['show_header']
	result = render('templates/%s/privacy.pt' % lang, {'show_header': show_header}, request=request)
	response = Response(result)
	return response
