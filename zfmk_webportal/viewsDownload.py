from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response
from pyramid.response import FileResponse
from pyramid.view import view_config
from pyramid.renderers import render

import os

from .lib.vars import config, messages
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid


import logging
log = logging.getLogger(__name__)

import pudb


@view_config(route_name='download')
def download_view(request):
	session = request.session
	set_language(request)
	lang = get_language(request)
	if "fileName" in request.params or "filename" in request.params:
		if "fileName" in request.params:
			filename = request.params['fileName']
		else:
			filename = request.params['filename']
		if "results" in request.params:
			response = FileResponse(os.path.join(config['homepath'], 'documents/download/results', filename), request=request)
		else:
			try:
				dir_file = os.path.join(config['homepath'], 'documents/download', filename)
				response = FileResponse(dir_file, request=request)
			except FileNotFoundError as e:
				log.error('File not found: {}'.format(dir_file))
				result = render('templates/%s/error.pt'%lang, {'err_title': messages['errors']['file_not_found'][lang]['err_title'],
							'err_text': messages['errors']['file_not_found'][lang]['err_text'].format(filename)}, request=request)
				return Response(result)
	response.headers['Content-Disposition'] = ('attachment; filename=' + filename)
	return response


