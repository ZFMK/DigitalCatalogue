from pyramid.httpexceptions import HTTPFound
from pyramid.response import Response
from pyramid.response import FileResponse
from pyramid.view import view_config
from pyramid.renderers import render
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import pymysql
import os
from gbol.lib.async_email import send_mail

from gbol.lib.vars import config, messages
from gbol.lib.viewslib import db_connect, get_language, set_language, get_session_uid


import logging
log = logging.getLogger(__name__)

import pudb



@view_config(route_name='privacy')
def privacy_view(request):
	set_language(request)
	lang = get_language(request)
	show_header = config['show_header']
	result = render('templates/%s/privacy.pt' % lang, {'show_header': show_header}, request=request)
	response = Response(result)
	return response
