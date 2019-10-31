from pyramid.response import Response
from pyramid.view import view_config
from pyramid.renderers import render
from Bio.Blast.Applications import NcbiblastnCommandline
from Bio.Application import ApplicationError
from Bio.Blast import NCBIXML
from Bio.Blast import NCBIWWW

from Bio.Seq import Seq
from Bio import SeqIO
from Bio.SeqRecord import SeqRecord

import urllib.request
from socket import timeout
import xml.etree.ElementTree as ET

try:
	from StringIO import StringIO
except ImportError:
	from io import StringIO
import re
import math
import pudb

import threading
import queue

import logging
log = logging.getLogger(__name__)

from gbol.lib.vars import messages, config

def fkt_clean(value):
	if isinstance(value, str) and len(value) == 0:
		return None
	if value is None:
		return None
	else:
		try:  # -- 0xf6 -> ö in iso8859-1
			s = value.strip()
			return '%s' % s
		except AttributeError as e:
			return value  # -- either None or int
		except UnicodeError as e:
			s = unicode(s, "ISO-8859-1")
			return '%s' % s
		else:
			return value

class Blast(threading.Thread):
	Result = []
	ResultLock = threading.Lock()
	numResults = 0
	Error = None

	Letterbox = queue.Queue()

	def __init__(self, group=None, target=None, name=None, verbose=None, num=None, logged_in=False, form={}):
		threading.Thread.__init__(self, group=group, target=target, name=name)
		self.num = num
		self.logged_in = logged_in
		self.form = form
		return

	def run(self):
		log.debug('Thread number: %i started' % self.num)
		Blast.Error = None
		while True:
			log.debug('Thread number: %i waiting...' % self.num)
			item = Blast.Letterbox.get()  # -- get next sequence from queue, block until next one arrives
			if isinstance(item, str) and item == 'exit':
				log.debug('Exit thread number: %i' % self.num)
				Blast.Letterbox.task_done()
				break
			if self.form['db']==2:  # -- BOLD Blast
				# this will only propagate the last error from the http requests
				try:
					blast_result = self.run_bold_blast(item)
				except:
					# create an empty list as it is needed below
					blast_result = []

			else:
				blast_result = self.run_blast(item)

			Blast.ResultLock.acquire()
			if len(blast_result)>0:
				Blast.numResults+= 1
			Blast.Result.append(blast_result)
			Blast.ResultLock.release()
			Blast.Letterbox.task_done()

	def run_bold_blast(self, seq_record):
		"""
		<match>
		<ID>SSWLD2829-13</ID>
		<sequencedescription>COI-5P</sequencedescription>
		<database>BOLD: Public Records</database>
		<citation>BOLD Systems, 2017</citation>
		<taxonomicidentification>Eremocoris borealis</taxonomicidentification>
		<similarity>0.8743</similarity>
		<specimen>
			<url>http://www.boldsystems.org/index.php/Public_RecordView?processid=SSWLD2829-13</url>
			<collectionlocation>
				<country>Canada</country>
				<coord>
					<lat>49.065</lat>
					<lon>-113.778</lon>
				</coord>
			</collectionlocation>
		</specimen>
		</match>
		"""

		log.debug('Started BOLD-BLAST in thread number: %i' % self.num)

		Result={}
		boldurl = "{0}?db={1}&sequence={2}".format(config['blast']['bold_url'], self.form['bold_blast_db'], seq_record.seq)
		request = urllib.request.Request(boldurl)
		
		try:
			response = urllib.request.urlopen(request, None, 120) # wait for 120 seconds
			data = response.read().decode('utf-8')
		except urllib.error.URLError as e:
			Blast.Error = "Could not connect to boldsystems API"
			raise
		except timeout:
			Blast.Error = "Request to boldsystems API timed out"
			raise
		except:
			Blast.Error = "Request to boldsystems API failed"
			raise

		safe_record_id = seq_record.id.replace(' ', '_').replace(',', '').replace(';', '')
		if '<matches></matches>' in data:
			log.debug('no match for blast %s in thread number: %i' % (safe_record_id, self.num))
			Result[safe_record_id] = [{
					'ID': 'No match found',
					'database': '',
					'taxon': '',
					'similarity': ''
				}]
		else:
			root = ET.fromstring(data)
			tag = root.tag
			Result[safe_record_id] = []
			r = Result[safe_record_id].append
			m = 0
			for match in root:
				m+= 1
				if m > self.form['hits']:
					break
				ident = math.ceil(float(match.find('similarity').text)*100)
				if ident < self.form['perc_identity']:
					m-= 1
					continue
				log.debug('Hits in Thread %i: %i' % (self.num, m))
				r({
					'ID': '<a href="%s" target="_bold">%s</a>'%(match.find('specimen').find('url').text, match.find('ID').text),
					'database': match.find('database').text,
					'taxon': match.find('taxonomicidentification').text,
					'perc_identity': ident
				})
		return Result

	def run_blast(self, seq_record):
		h = 0
		#p_blocked = re.compile('^(\d+)\s+acc\|(\S+)\|loc\|(\S+)\s+from\s+(.+)(-X)$')  # -- 82354 acc|ZFMK-TIS-2569384|loc|COI from Elateridae-X|len|1234
		p_free = re.compile('^(\d+)\s+acc\|(\S+)\|loc\|(\S+)\s+from\s+(.+)$')   # -- 82354 acc|ZFMK-TIS-2569384|loc|COI from Elateridae|len|1234
		Result={}
		tries = 1
		stop = False

		if int(self.form['db'])==1:  # Blast GBOL DB
			if not self.logged_in and self.form['search_db']=='db_public':
				db = "%sblast_db_pub" % (config['blast']['blast_db_home'])
			else:
				db = "%sblast_db" % config['blast']['blast_db_home']

			blast_cline = NcbiblastnCommandline(query="-",
				task=self.form['task'],
				db=db,
				evalue=self.form['evalue'],
				perc_identity=self.form['perc_identity'],
				outfmt=5)
			while not stop:
				try:
					log.debug("\tBlasting sequence@GBOL: %s in thread number %i" % (seq_record.id, self.num))
					resultHandle = StringIO(blast_cline(stdin=seq_record.format("fasta"))[0])
				except ApplicationError as e:
					tries+= 1
					if tries>1:
						log.error("Error blasting the sequence, exciting: %s\n\tError was: %s" % (seq_record.id, e))
						return Result
					log.error("Error blasting the sequence, sleeping 5 seconds: %s\n\tError was: %s" % (seq_record.id, e))
					time.sleep(5)
				else:
					stop=True
			blastRecords = NCBIXML.parse(resultHandle)
		else:  # -- NCBI blast search
			ncbi_url = '<a href="%s/{0}" target="_ncbi">{1}</a>'%config['blast']['ncbi_url']
			while not stop:
				try:
					log.debug("\tBlasting sequence@NCBI: %s in thread number %i" % (seq_record.id, self.num))
					resultHandle = NCBIWWW.qblast(
						program="blastn",
						database="nr",
						sequence=seq_record.format("fasta"),
						expect=self.form['evalue'],
						nucl_penalty=self.form['penalty'],
						nucl_reward=self.form['reward'])
					blastRecords = NCBIXML.parse(resultHandle)
				except ApplicationError as e:
					tries+= 1
					if tries>1:
						log.error("Error blasting the sequence, exciting: %s\n\tError was: %s" % (seq_record.id, e))
						return Result
					log.error("Error blasting the sequence, sleeping 5 seconds: %s\n\tError was: %s" % (seq_record.id, e))
					time.sleep(5)
				else:
					stop=True

		# -- see: http://biopython.org/DIST/docs/api/Bio.Blast.Record.Blast-class.html
		found = False
		stop = False
		log_debug = log.isEnabledFor(logging.DEBUG)
		for record in blastRecords:
			if stop:
				break
			Result[record.query] = []
			r = Result[record.query].append
			for alignment in record.alignments:
				if stop:
					break
				for hsp in alignment.hsps:
					if stop:
						break
					if hsp.expect < self.form['evalue']:
						l_q = record.query_length
						l_s = alignment.length
						if l_q<l_s:
							ident = math.ceil(hsp.identities/l_q*100)
						else:
							ident = math.ceil(hsp.identities/l_s*100)
						if log_debug:
							logs = ['Alignment: %s'%alignment.title]
							logs.append('HSP.align_length: %r, identities: %r, bits: %r, positives: %r'%(hsp.align_length, hsp.identities, hsp.bits, hsp.positives))
							logs.append('HSP.query_start: %r, HSP.query_end: %r, HSP.sbjct_start: %r, HSP.sbjct_end: %r'%(hsp.query_start, hsp.query_end, hsp.sbjct_start, hsp.sbjct_end))
							logs.append('HSP.query: %r'%(hsp.query))
							logs.append('HSP.match: %r'%(hsp.match))
							logs.append('HSP.sbjct: %r'%(hsp.sbjct))
							logs.append('len(query): %r, len(subject): %r, perc. identity: %r'%(l_q, l_s, ident))
							log.debug('\n'.join(logs))
						if ident < self.form['perc_identity']:
							continue
						h+= 1
						found=True
						if h>self.form['hits']:
							stop = True
							break
						if int(self.form['db'])==1:
							m = p_free.match(alignment.title)
							try:
								specimen_id=m.group(1)
							except AttributeError as e:
								h-= 1
								log.error('Could not parse title from Blast search in %r'%alignment.title)
								continue
							r({
								'acc_no': m.group(2),
								'locus': m.group(3),
								'taxon': m.group(4),
								'length': alignment.length,
								'identities': hsp.identities,
								'perc_identity': ident,
								'e_value': hsp.expect
							})
						else:  # -- NCBI
							r({
								'id': ncbi_url.format(alignment.accession, alignment.hit_id),
								'info': alignment.hit_def,
								'length': alignment.length,
								'identities': hsp.identities,
								'perc_identity': ident,
								'e_value': hsp.expect
							})
		if found:
			return Result
		return {}

@view_config(route_name='identifications')
def identifications_view(request):
	session = request.session
	set_language(request)
	lang = get_language(request)
	uid = get_session_uid(session)
	form = {'query': '', 'task': 'megablast', 'evalue': 0.0001, 'penalty': -1,
			'reward': 1, 'hits': int(config['blast']['default_result_size']), 'perc_identity': 98, 'search_db': 'db_all', 'db': 1, 'bold_blast_db': 'COX1'}
	Result = {}
	success=True
	logged_in = uid>0
	message=""
	
	# message = "! Die BOLD-Datenbank ist derzeit nicht verfügbar, da sie gewartet wird! The BOLD database is currently not available, due to maintanance!"

	# make parameter available from get request to prefill query field when calling identifications from specimendetail page
	accessionnum = ''
	region = ''
	if 'accessionnumber' in request.GET:
		accessionnum = request.GET.get('accessionnumber')
	if 'region' in request.GET:
		region = request.GET.get('region')
		if region in ('COI', 'COI-5P', 'COI-P5', 'COI 5'):
			if logged_in is True:
				form['db'] = 2
				form['bold_blast_db'] = 'COX1_SPECIES'
	if 'sequence' in request.GET:
		form['query'] = ">{0} {1}\n".format(accessionnum, region) + request.GET.get('sequence')
		
	

	if 'sequence_query_submit' in request.POST:
		p = request.POST
		for e in ('query', 'task', 'evalue', 'penalty', 'reward', 'hits', 'perc_identity'):
			form[e] = fkt_clean(p.get('sequence_%s'%e))

		if form['query'] is None or (form['query'] is not None and form['query'][0]!='>'):
			success=False
			message = messages['errors']['invalid_sequence'][lang]['err_title']

		if 'sequence_db' in p:
			form['db'] = int(p.get('sequence_db'))
		if form['db']==0:
			success=False
			message = messages['errors']['ncbi_search_disabled'][lang]['err_title']

		if form['db']==1 and 'sequence_search_db' in p:  # -- only for gbol blast search
			form['search_db'] = p.get('sequence_search_db')
		if form['db']==2 and 'sequence_bold_blast_db' in p:  # -- only for bold blast search
			form['bold_blast_db'] = p.get('sequence_bold_blast_db')

		form['lang'] = lang

		try:
			form['evalue'] = float(form['evalue'])
		except ValueError:
			success=False
		try:
			form['penalty'] = int(form['penalty'])
		except ValueError:
			success=False
		if form['penalty']>0:
			form['penalty'] = -1
			success=False
		try:
			form['reward'] = int(form['reward'])
		except ValueError:
			success=False
		if form['reward']<0:
			form['reward'] = 1
			success=False
		try:
			form['hits'] = int(form['hits'])
		except ValueError:
			success=False
		try:
			form['perc_identity'] = int(form['perc_identity'])
		except ValueError:
			success=False
		else:
			if form['perc_identity']<0 and 100<form['perc_identity']:
				form['perc_identity']=90
				success=False

		if success:
			seq_to_search_for = StringIO(form['query'].replace('\t','').replace('-','').replace('~','')) # file handle
			seq_to_search_for=list(SeqIO.parse(seq_to_search_for, "fasta")) # SeqRecords

			pool = [Blast(num=num, logged_in=logged_in, form=form) for num in range(config['blast']['num_worker_threads'])]
			for thread in pool:
				thread.setDaemon(True)
				thread.start()


			for seq_record in seq_to_search_for:
				# --see: http://python.haas.homelinux.net/python_kapitel_18_004.htm
				Blast.Letterbox.put(seq_record)

			for thread in pool:
				Blast.Letterbox.put('exit')

			Blast.Letterbox.join()

			for thread in pool:
				thread.join()
			log.debug('Active threads after blast: %i' % threading.active_count())

		result_table_header = {
				'1':{  # -- GBOL
					'sort':['query', 'acc_no','taxon','perc_identity','identities','locus','e_value'],
					'de':{'query':'Anfrage','acc_no':'Katalognummer','locus':'Marker','taxon':'Taxon','length':'Sequenzlänge','identities':'Übereinstimmung','perc_identity':'Übereinstimmung (%)','e_value':'E-Wert','sequence':'Sequence'},
					'en':{'query':'Query','acc_no':'Catalog number','locus':'Marker','taxon':'Taxon','length':'Sequence length','identities':'Identities','perc_identity':'Percent identity [%]','e_value':'E-value','sequence':'Sequence'}},
				'2':{  # -- BOLD
					'sort':['query', 'ID', 'taxon','perc_identity','database'],
					'de':{'query':'Anfrage','ID':'ID','perc_identity':'Übereinstimmung (%)','database':'Datenbank','taxon':'Taxon'},
					'en':{'query':'Query','ID':'ID','perc_identity':'Percent identity [%]','database':'Database','taxon':'Taxon'}},
				'0':{  # -- NCBI
					'sort':['query', 'id','info','identities','perc_identity','e_value'],
					'de':{'query':'Anfrage','id':'ID','info':'Hit information','length':'Sequenzlänge','identities':'Übereinstimmung','perc_identity':'Übereinstimmung (%)','e_value':'E-Wert','sequence':'Sequence'},
					'en':{'query':'Query','id':'ID','info':'Hit Information','length':'Sequence length','identities':'Identity','perc_identity':'Percent identity [%]','e_value':'E-value','sequence':'Sequence'}}
			}


		html = []
		if Blast.Error is not None:
			message = Blast.Error
		elif Blast.numResults > 0:
			head_sort = result_table_header[str(form['db'])]['sort']
			head_text = result_table_header[str(form['db'])][lang]
			h = html.append
			h('<table id="BlastResultTable" width="100%"><thead><tr>')
			html.extend(['<th>%s</th>'%head_text[ct] for ct in head_sort])
			h('</tr></thead><tbody>')
			Blast.ResultLock.acquire()
			for result in Blast.Result:
				if len(result)>0:
					for key, result_list in result.items():
						for entry in result_list:
							try:
								s = entry['perc_identity']
							except KeyError as e:
								log.error("Error in iteration over Blast result: %r.\n\tEntry: %r" % (e, entry))
								continue
							if s >= 98:
								clr = 'light_green'
							elif s >= 90 and s < 96:
								clr = 'light_orange'
							elif s >= 96 and s < 98:
								clr = 'light_yellow'
							else:
								clr = 'light_red'
							h('<tr class="{0}"><td>{1}</td>'.format(clr, key))
							html.extend(['<td>%s</td>'%entry[ci] for ci in head_sort[1:]])
							h('</tr>')
			Blast.ResultLock.release()
			h('</tbody></table>')
			form['blast_result_html'] = "".join(html)
			Blast.numResults = 0
			Blast.Result = []
		else:
			if len(message)==0:
				message = "No hits for these sequence(s)"

		log.debug('Active threads in the end: %i' % threading.active_count())

	bold_dbs = {'COX1':'All Barcode Records on BOLD', 'COX1_SPECIES':'Species Level Barcode Records', 'COX1_SPECIES_PUBLIC':'Public Record Barcode Database', 'COX1_L640bp':'Full Length Record Barcode Database'}
	bold_db_select = []
	for t in ['COX1', 'COX1_SPECIES', 'COX1_SPECIES_PUBLIC', 'COX1_L640bp']:
		if t == form['bold_blast_db']:
			bold_db_select.append('<option value="{0}" selected="selected">{1}</option>'.format(t, bold_dbs[t]))
		else:
			bold_db_select.append('<option value="{0}">{1}</option>'.format(t, bold_dbs[t]))
	form['bold_blast_db_list'] = "".join(bold_db_select)

	tasks = []
	for t in ['megablast','blastn']:
		if t == form['task']:
			tasks.append('<option value="{0}" selected="selected">{0}</option>'.format(t))
		else:
			tasks.append('<option value="{0}">{0}</option>'.format(t))
	form['task_list'] = "".join(tasks)

	if not logged_in:
		form['select_search_db'] = 1
		form['logged_in'] = False
	else:
		form['logged_in'] = True

	if form['query'] is None:
		form['query'] = ""

	if len(message)>0:
		result = render('templates/%s/ergebnisse/identifications.pt' % lang, {
			'lan': lang,
			'sequence': form,
			'message': message}, request=request)
	else:
		result = render('templates/%s/ergebnisse/identifications.pt' % lang, {
			'lan': lang,
			'sequence': form}, request=request)
	response = Response(result)
	return response


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


def get_language(request):
	session = request.session
	if 'languange' in session:
		if session['languange'] == 'de':
			return 'de'
		elif session['languange'] == 'en':
			return 'en'
	return 'de'
