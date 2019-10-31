from pyramid.httpexceptions import HTTPFound, exception_response
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
import json
import pudb

from gbol.lib.vars import messages, config
from gbol.lib.viewslib import db_connect, get_language, set_language, get_session_uid


@view_config(route_name='kontakt')
def kontakt_view(request):
	set_language(request)
	lang = get_language(request)
	conn = pymysql.connect(host=config['host'], port=config['port'],
						   user=config['user'], passwd=config['pw'], db=config['db'])
	cur = conn.cursor()
	msg = []
	if 'op' in request.POST:
		name = request.POST.get('name')
		mail = request.POST.get('mail')
		kid = request.POST.get('category')
		header = request.POST.get('header')
		text = request.POST.get('text')
		if any([name == "", mail == "", kid == "", header == "", text == ""]):
			msg.append(messages['contact'][lang])
		else:
			cur.execute("SELECT email FROM kontakt WHERE kontaktid = " + kid)
			row = cur.fetchone()
			try:
				send_mail(row[0], mail + " (" + name + ") ", header, text.replace('\t', ''))
			except Exception as e:
				msg.append('Message could not be send: %r' % e)
			else:
				msg.append(messages['contact_send'][lang])
	cur.execute("SELECT taxa, institut, name, kontaktId FROM kontakt WHERE lang='%s' ORDER BY kontaktId" % lang)
	value = []
	for row in cur.fetchall():
		value.append('<option value="{3}">{0}, {1}, {2}</option>'.format(*row))
	cur.close()
	conn.close()
	if len(msg) < 1:
		result = render('templates/%s/kontakt.pt' % lang, {'value': "".join(value)}, request=request)
	else:
		result = render('templates/%s/kontakt.pt' % lang, {'value': "".join(value),
														   'message': "<br />".join(msg)}, request=request)
	response = Response(result)
	return response
 
