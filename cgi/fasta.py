#!/usr/bin/env python3

from os import path as os_path
from lib.vars import messages, config

from Bio.Seq import Seq
from Bio import SeqIO
from Bio.SeqRecord import SeqRecord

import pymysql
import subprocess
try:
	from StringIO import StringIO
except ImportError:
	from io import StringIO
import re

import logging
log = logging.getLogger('blast')

import pudb

clean_barcodes=False
build_blast_db=False
blast=True
blast_random=False
test_fasta_handle=True
align=False

conn = pymysql.connect(host=config['host'], port=config['port'], user=config['user'], passwd=config['pw'], db=config['db'], charset='utf8')
cur = conn.cursor(pymysql.cursors.SSCursor)

struct = {'public': {'sql_ext': ' AND (ISNULL(withhold) OR withhold IN ('', 0))', 'db_name': 'blast_db_pub'},
		 'restricted': {'sql_ext': '', 'db_name': 'blast_db'}}

sql_count = """select region, count(region) as `#` from ZFMK_Coll_Barcode group by region"""
sql = """
SELECT b.specimen_id,
	d.term AS acc_no,
	b.region,
	REPLACE(REPLACE(b.sequence,'-',''),' ','') AS sequence,
	CONCAT(s.taxon,
		IF(ISNULL(b.withhold) OR b.withhold IN ('', 0),'','-X')) AS taxon
FROM ZFMK_Coll_Barcode b
	INNER JOIN (
		SELECT MAX(analysis_number) AS analysis_number, specimen_id
        FROM ZFMK_Coll_Barcode
        WHERE valid=1
        GROUP BY specimen_id
	) a ON (a.analysis_number=b.analysis_number AND a.specimen_id=b.specimen_id)
	LEFT JOIN ZFMK_Coll_Specimen s ON s.id=b.specimen_id
	LEFT JOIN ZFMK_Coll_Data2Specimen ds ON ds.specimen_id=s.id
	inner JOIN ZFMK_Coll_Data d ON d.id=ds.data_id
WHERE d.field_id=1
"""

def run_blast(seq_record, local=True):
	from Bio.Blast.Applications import NcbiblastnCommandline
	from Bio.Application import ApplicationError
	from Bio.Blast import NCBIXML

	blast_num_results = int(config['blast']['default_result_size'])

	if local:
		blast_cline = NcbiblastnCommandline(query="-", db="%sblast_db_pub"%config['blast']['blast_db_home'], evalue=0.001, outfmt=5)
		try:
			resultHandle = StringIO(blast_cline(stdin=seq_record.format("fasta"))[0])
		except ApplicationError as e:
			raise NameError("BLAST error: %r")
		log.info("Blasting the Sequence:\n\t%r" % seq_to_search_for)
		pudb.set_trace()
		blastRecords = NCBIXML.parse(resultHandle)
	else:  # -- not tested!
		from Bio.Blast import NCBIWWW
		resultHandle = NCBIWWW.qblast("blastn", "nr", seq_record.format("fasta"))
		blastRecords = NCBIXML.parse(resultHandle)

	E_VALUE_THRESH = 0.001
	a = 0
	h = 0
	p_blocked = re.compile('^(\d+)\s+acc\|(\S+)\|loc\|(\S+)\s+from\s+(.+)(-X)$')  # -- 82354 acc|ZFMK-TIS-2569384|loc|COI from Elateridae-X
	p_free = re.compile('^(\d+)\s+acc\|(\S+)\|loc\|(\S+)\s+from\s+(.+)$')   # -- 82354 acc|ZFMK-TIS-2569384|loc|COI from Elateridae
	Result={}

	# -- see: http://biopython.org/DIST/docs/api/Bio.Blast.Record.Blast-class.html
	for record in blastRecords:
		Result[record.query] = []
		r = Result[record.query].append
		for alignment in record.alignments:
			for hsp in alignment.hsps:
				if hsp.expect < E_VALUE_THRESH:
					pudb.set_trace()
					h+= 1
					if h>=blast_num_results: continue
					m = p_blocked.match(alignment.title)
					if m:
						sequence = 'blocked'
					else:
						m = p_free.match(alignment.title)
						if m:
							sequence = hsp.sbjct
						else:
							continue
					specimen_id=m.group(1)
					r({
						'acc_no': m.group(2),
						'locus': m.group(3),
						'taxon': m.group(4),
						'length': alignment.length,
						'align_length': hsp.align_length,  # == len(hsp.match)
						'identities': hsp.identities,  # == matching nucleotides??
						'e_value': hsp.expect,
						'query': hsp.query,
						'match': hsp.match,
						'subject': sequence,
						'len_query': len(hsp.query),
						'len_match': len(hsp.match),
						'len_subject': len(sequence),
						'score': hsp.score,
					})
	return Result


if clean_barcodes:
	log.info("Clean barcodes in DB")
	sql_correct_barcodes = """UPDATE ZFMK_Coll_Barcode SET sequence=REPLACE(REPLACE(sequence,'-',''),' ','')"""
	sql_add_valid_flag = """ALTER TABLE `gbol-python`.`ZFMK_Coll_Barcode`
							ADD COLUMN `valid` TINYINT UNSIGNED NULL DEFAULT 0 AFTER `withhold`,
							ADD INDEX `idx_valid` (`valid` ASC)"""
	sql_flag_barcodes_valid = """UPDATE ZFMK_Coll_Barcode SET valid=1 WHERE region IS NOT NULL AND sequence REGEXP '^[A-Z]+$'"""
	cur.execute(sql_correct_barcodes)
	conn.commit()
	try:
		cur.execute(sql_add_valid_flag)
	except pymysql.err.InternalError as e:
		pass  # -- already in
	conn.commit()
	cur.execute(sql_flag_barcodes_valid)
	conn.commit()

struct = {'public': {'sql_ext': ' AND (ISNULL(withhold) OR withhold IN ("", 0))', 'fasta_file': 'fasta_pub.fas', 'db_name': 'blast_db_pub'},
		 'restricted': {'sql_ext': '', 'fasta_file': 'fasta.fas', 'db_name': 'blast_db'}}

if build_blast_db:
	for key, item in struct.items():
		R = []
		r = R.append
		fasta_file = os_path.join(config['blast']['blast_db_home'], item['fasta_file'])
		exec_sql = sql % item['sql_ext']
		cur.execute(exec_sql.replace('\n', ' ').replace('\t', ''))
		while True:
			row = cur.fetchone()
			if not row:
				break
			r(SeqRecord(seq=Seq(row[3]), id="lcl|{0}".format(*row), description="acc|{2}|loc|{3} from {0}".format(str(row[4].encode('ascii',errors='ignore').decode("ascii")), *row)))

		SeqIO.write(R, fasta_file, "fasta")

		log.info("Make BLAST DB")
		subprocess.call(["makeblastdb", "-in", fasta_file, "-parse_seqids", "-dbtype", "nucl", "-out=%s/%s"%(config['blast']['blast_db_home'], item['db_name'])])

if blast:
	""" See also: https://humgenprojects.lumc.nl/svn/ngs-misc/trunk/src/blast.py """
	Result = {}
	log.info('=== Blast ===')
	if blast_random:
		print("Getting one random record from GBOL barcodes")
		sql2 = """SELECT FLOOR(rand() * count(id)) FROM ZFMK_Coll_Barcode where valid=1"""
		cur.execute(sql2)
		while True:
			row = cur.fetchone()
			if not row:
				break
			max_records = row[0]
			print("\t%i records in GBOL Barcode db" % max_records)
		exec_sql = sql % ''
		sql3 = """%s LIMIT %i,1""" % (exec_sql, max_records)
	elif test_fasta_handle:
		fasta_text=""""
			>lcl|3 acc|ZFMK-TIS-3|loc|COI from Gastrodes grossipes-X
			AACCCTTTATTTTATGTTCGGAATATGGTCGGGGATAGTAGGATCCTCCCTAAGATGAAT
			TATTCGAATTGAATTAGGACAACCCGGATCATTTATCGGAGATGATCAAATCTACAATAC
			CATTGTTACTGCCCACGCCTTTATTATAATTTTCTTTATAGTTATACCTATTATAATTGG
			AGGATTTGGTAACTGACTGGTGCCATTAATAATTGGAGCACCCGATATAGCATTCCCACG
			AATAAATAACATAAGATTTTGACTATTACCCCCATCAATTACCCTCCTAATTATAAGTAG
			AATAATTGAATTAGGAGCAGGAACCGGTTGAACCGTGTACCCACCCCTATCAAATAATAT
			ATTCCACAGAGGAGCTTCAGTAGATATAGCAATCTTTTCGTTACATCTAGCAGGTGTGTC
			ATCCATCTTAGGAGCCATTAACTTTATTTCTACAATTATAAATATACGACCCACAGGTAT
			AACACCTGAACAAATTCCATTGTTTGTATGATCAGTAGGAATTACCGCCCTTCTATTATT
			ATTATCACTGCCAGTTTTAGCTGGAGCAATCACTATATTATTAACAGACCGTAACTTTAA
			CACGTCATTCTTTGACCCTACAGGAGGGGGAGACCCAATTCTATACCAACACCTTTTC
			>lcl|59282 acc|ZFMK-TIS-2542629|loc|COI from Simulium equinum-X
			TTGTAATAATTTTTTTTATAGTTATACCAATTATAATTGG
			AGGATTTGGAAATTGATTAGTACCTTTAATATTAGGAGCCCCAGATATGGCATTCCCACG
			AATAAATAATATAAGTTTTTGACTTTTACCACCTTCATTAACATTATTATTAGCTAGCAG
			AGGATTTGGAAATTGATTAGTACCTTTAATATTAGGAGCCCCAGATATGGCATTCCCACG
			AATAAATAATATAAGTTTTTGACTTTTACCACCTTCATTAACATTATTATTAGCTAGCAG
			AGGATTTGGAAATTGATTAGTACCTTTAATATTAGGAGCCCCAGATATGGCATTCCCACG
			AATAAATAATATAAGTTTTTGACTTTTACCACCTTCATTAACATTATTATTAGCTAGCAG
			"""
		seq_to_search_for = StringIO(fasta_text.replace('\t','')) # file handle
		seq_to_search_for=SeqIO.parse(seq_to_search_for, "fasta") # SeqRecords
	else:
		sql3 = """%s AND d.term='ZFMK-TIS-2568804'""" % sql

	if not test_fasta_handle:
		cur.execute(sql3)
		while True:
			row = cur.fetchone()
			if not row:
				break
			Result=SeqRecord(seq=Seq(row[3]), id="lcl|{0}".format(*row), description="acc|{2}|loc|{3} from {0}".format(str(row[4].encode('ascii',errors='ignore').decode("ascii")), *row))
		try:
			blast_result = run_blast(seq_record, True)
		except NameError as e:
			print(e)
			raise
		log.info("Blasting the Sequence:\n\t%r" % seq_to_search_for)
	else:
		for seq_record in seq_to_search_for:
			try:
				blast_result = run_blast(seq_record, True)
			except ApplicationError as e:
				print("BLAST error: %r"%e)
				raise
			else:
				Result.update(blast_result)

	for key in Result.keys():
		L = Result[key]
		print(key)
		for s in L:
			print("{acc_no}, {taxon}. Score: {score}, expect: {e_value}:\n\t{query} ({len_query})\n\t{match} ({len_match})\n\t{subject} ({len_subject})\n\tlength: {length}\tidentities: {identities}\talign_length: {align_length}".format(**s))

if align:
	from Bio.Align.Applications import MuscleCommandline
	muscle_cline = MuscleCommandline(clwstrict=True)

	import subprocess
	import sys
	child = subprocess.Popen(str(muscle_cline),
							 stdin=subprocess.PIPE,
							 stdout=subprocess.PIPE,
							 stderr=subprocess.PIPE,
							 universal_newlines=True,
							 shell=(sys.platform!="win32"))
	SeqIO.write(R, child.stdin, "fasta")
	child.stdin.close()

	from Bio import AlignIO
	align = AlignIO.read(child.stdout, "clustal")
	print(align)

conn.close()



