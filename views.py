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

'''
@view_config(route_name='home')
def home_view(request):
	#oos = {'de': 'Die GBOL Webseite wird gerade gewartet, deshalb kann es bis 14:00 Uhr in einigen Bereichen der Ergebnissuche zu Beeinträchtigungen kommen.',
	#	   'en': 'The GBOL Website is currently maintained. Functions in the Result search may not work as expected, please check again after 2 p.m.'}
	set_language(request)
	lang = get_language(request)
	#message = oos[lang] + '<br/>' + request.session.pop_flash()
	message = request.session.pop_flash()
	if len(message) < 1:
		result = render('templates/%s/home.pt' % lang, {}, request=request)
	else:
		message = message[0]
		result = render('templates/%s/home.pt' % lang, {'message': message}, request=request)
	response = Response(result)
	return response

'''

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
		if "fileOption" in request.params:
			if request.params['fileOption'] == 'collectionsheet':
				filepath = os.path.join(config['homepath'], config['collection_table']['ordered'], filename)
				response = FileResponse(filepath, request=request)
			elif request.params['fileOption'] == 'versandanschreiben':
				(conn, cur) = db_connect()
				cur.execute("""SELECT concat_ws(' ', salutation, title, vorname, nachname) as `name`,
						street, concat_ws(' ', zip, city) as city, country, postaladdress,
						s.count, transactionKey
					From users u
						left join ShippingRequests sr ON sr.uid = u.uid
						Left join Shippings s on sr.id = s.ShippingRequestId
						left join RelUserInstitution ui on sr.ContactId = ui.uid
						left Join Institution i on i.id = ui.institutionId
					where transactionKey = '{0}'""".format(filename))
				row = cur.fetchone()
				send_to = str(row[4]).split('\n')
				cur.close()
				if lang == 'en':
					filename = 'cover_letter.pdf'
				else:
					filename = 'versandanschreiben.pdf'
				coverLetterName = os.path.join(config['homepath'], 'documents/download', filename)
				c = canvas.Canvas(coverLetterName)
				c.translate(0, 700)
				c.drawImage(ImageReader(os.path.join(config['homepath'], 'static/images/logo.png')), 50, -100, 200, 200)
				c.setFont("Helvetica-Bold", 14)
				c.setFillColorRGB(0, 0, 0)
				c.drawString(20, -150, messages['letter_sender'][lang])
				c.drawString(20, -290, messages['letter_send_to'][lang])
				c.setFont("Helvetica", 14)
				c.drawString(20, -190, row[0])
				c.drawString(20, -210, row[1])
				c.drawString(20, -230, row[2])
				c.drawString(20, -250, row[3])
				i = 0
				while i < len(send_to):
					c.drawString(20, -330 - i * 20, send_to[i])
					i += 1
				c.setFont("Helvetica-Bold", 14)
				c.drawString(20, -370 - i * 20, messages['letter_order_no'][lang].format(row[6]))
				c.setFont("Helvetica", 14)
				c.drawString(20, -410 - i * 20, messages['letter_no_samples'][lang].format(row[5]))
				c.drawString(20, -450 - i * 20, messages['letter_body1'][lang])
				c.drawString(20, -470 - i * 20, messages['letter_body2'][lang])
				c.showPage()
				c.save()
				response = FileResponse(coverLetterName, request=request)
				response.headers['Content-Disposition'] = ("attachment; filename=%s" % filename)
				os.remove(coverLetterName)
			elif request.params['fileOption'] == 'tk_ct':  # -- called via link from viewsAdmin: sammelliste_view
				if 'role' in session and session['role'] is not None and 2 in session['role']:  # only TK allowed downl
					response = FileResponse(os.path.join(config['homepath'], config['collection_table']['filled'], filename), request=request)
				else:
					url = request.route_url('sammelliste')
					return HTTPFound(location=url)
		elif "newsUpload" in request.params:
			# used in: filemanager.js, function: selectItem and in filemanager.class.php
			filename = filename.split('?')[0]  # workaround for ckeditor always sending a timestamp with the filename
			try:
				dir_file = os.path.join(config['homepath'], config['news']['media_directory'], filename)
				response = FileResponse(dir_file, request=request)
			except FileNotFoundError as e:
				log.error('File not found: {}'.format(dir_file))
				result = render('templates/%s/error.pt'%lang, {'err_title': messages['errors']['file_not_found'][lang]['err_title'],
															   'err_text': messages['errors']['file_not_found'][lang]['err_text'].format(filename)}, request=request)
				return Response(result)
		elif "news" in request.params:
			response = FileResponse(os.path.join(config['homepath'], config['news']['media_directory'], filename), request=request)
		elif "results" in request.params:
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



'''
@view_config(route_name='impressum')
def impressum_view(request):
	set_language(request)
	lang = get_language(request)
	result = render('templates/%s/impressum.pt' % lang, {}, request=request)
	response = Response(result)
	return response
'''

