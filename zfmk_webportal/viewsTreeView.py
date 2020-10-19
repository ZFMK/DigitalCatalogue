from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import pudb

from .lib.vars import messages, config
from .lib.viewslib import db_connect, get_language, set_language, get_session_uid


import logging
log = logging.getLogger(__name__)


@view_config(route_name='loadTreeView')
def loadTreeView_view(request):
	lan = get_language(request)
	(conn, cur) = db_connect()
	resA = []
	A = resA.append
	nodeid = request.POST.get('nodeid')
	query = """SELECT t.taxon,
				t.id, t.parent_id,
				t.known,
				t.collected,
				t.barcode,
				t.collected_individuals,
				t.barcode_individuals,
				t.rgt - t.lft AS rank
			FROM ZFMK_Coll_Taxa t
			WHERE lft IS NOT NULL AND parent_id = {0} AND t.collected_individuals > 0 ORDER BY t.taxon""".format(nodeid)
	# log.debug('%s SQL Treeview:\n%s', __name__, query)
	try:
		cur.execute(query)
	except Exception as e:
		cur.close()
		conn.close()
		return Response(
			'{{"success": false, "text": "Error {1}", "node": {0}, "entries": []}}'.format(nodeid, e.args[0]))
	for row in cur:
		A('["{0}",{1},{2},{3},{4},{5},{6},{7},{8}]'.format(*row))

	cur.close()
	conn.close()
	return Response('{{"success": true, "node": {0}, "entries": [{1}]}}'.format(nodeid, ",".join(resA)))

