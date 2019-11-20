"""
views called to save and restore facet searches in and from mysql

alternative implementation as web browser storage in facetsform.js, currently not used
"""


from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
from pyramid.httpexceptions import HTTPFound, exception_response
import pymysql
import json

import pudb

from .lib.vars import taxon_ids, messages, config, states, redlist
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid
from .lib.filterSaver import insertFilter, deleteFilter


@view_config(route_name='save_filter')
def save_filter_view(request):
	uid = get_session_uid(request.session)
	filter_name = request.POST.get('filter_name')
	filter_query = request.POST.get('filter_query').replace('"', "&quot;")

	ret = insertFilter(uid, filter_name, filter_query)
	return Response(ret)


@view_config(route_name='delete_filter')
def delete_filter_view(request):
	uid = get_session_uid(request.session)
	filter_name = request.POST.get('filter_name')

	ret = deleteFilter(uid, filter_name)
	return Response(ret)
