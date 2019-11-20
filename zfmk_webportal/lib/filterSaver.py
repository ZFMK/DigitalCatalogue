"""
handle the facet search strings saved in mysql
not used yet, should be implemented in browsers web storage not in mysql, because non persistent and less heavy
"""

import pudb
import json
from .vars import messages, config
from .viewslib import db_connect

import logging
log = logging.getLogger(__name__)


def insertFilter(uid, filter_name, filter_query):
	(conn, cur) = db_connect()
	sql_save_filter = """INSERT INTO saved_filters (user_id, filter_name, created, text) VALUES (%s, %s, NOW(), %s)
							ON DUPLICATE KEY UPDATE user_id = %s, filter_name = %s, text = %s"""
	params = [uid, filter_name, filter_query, uid, filter_name, filter_query]
	try:
		cur.execute(sql_save_filter, params)
	except Exception as e:
		ret = "MySQL error: %r" % e
	else:
		conn.commit()
		ret = 'success'
	cur.close()
	conn.close()
	return ret


def getFilters(uid):
	filterlist = []
	(conn, cur) = db_connect()
	sql_saved_filters = "SELECT filter_name, text FROM saved_filters WHERE user_id=%s ORDER BY created"
	params = [uid]
	cur.execute(sql_saved_filters, params)
	rows = cur.fetchall()
	for row in rows:
		filterlist.append([row[0], row[1]])
	cur.close()
	conn.close()
	return filterlist


def deleteFilter(uid, filter_name):
	(conn, cur) = db_connect()
	sql_delete_filter = "DELETE FROM saved_filters WHERE filter_name = %s AND user_id = '%s'"
	params = [filter_name, uid]
	log.debug('sql: %s' % sql_delete_filter)
	try:
		cur.execute(sql_delete_filter, params)
	except Exception as e:
		ret = "MySQL error: %r" % e
	else:
		conn.commit()
		ret = 'success'
	cur.close()
	conn.close()
	return ret
