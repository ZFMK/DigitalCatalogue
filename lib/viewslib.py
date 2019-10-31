"""
functions used by several views
"""
import pymysql
import locale
from gbol.lib.vars import config, messages



# database connector
def db_connect():
	conn = pymysql.connect(host=config['host'], port=config['port'],
						   user=config['user'], passwd=config['pw'], db=config['db'])
	cur = conn.cursor()
	return (conn, cur)


def get_session_uid(session):
	if 'uid' in session and session['uid'] is not None:
		return session['uid']
	return 0


def set_language(request):
	session = request.session
	if 'btnGerman' in request.POST:
		session['languange'] = 'de'
	elif 'btnEnglish' in request.POST:
		session['languange'] = 'en'
	elif request.params.get('lang') == 'de':
		session['languange'] = 'de'
	elif request.params.get('lang') == 'en':
		session['languange'] = 'en'




def get_language(request):
	session = request.session
	if 'languange' in session:
		if session['languange'] == 'en':
			locale.setlocale(locale.LC_ALL, 'en_US.utf8')
			return 'en'
	session['languange'] = 'de'
	locale.setlocale(locale.LC_ALL, 'de_DE.utf8')
	return 'de'


