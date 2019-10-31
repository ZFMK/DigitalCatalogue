#!/usr/bin/python
# -*- coding: utf-8 -*-

import cgi, cgitb
import csv 
import urllib2
import xmltodict
import xml.etree.ElementTree as ET
import lxml.etree
import requests
from Bio import SeqIO

form = cgi.FieldStorage()

fileitem = form['userfile']
db = form.getvalue('db')
quan = form.getvalue('quantity')

print("Content-type: text/html\n")

print("""
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<title>BLAST Fasta-files: Results</title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
<h1>BLAST Fasta-files with the BOLD ID Engine Web Service: Results</h1>
""")

x = 1
for seq_record in SeqIO.parse(fileitem.file, "fasta"):
	boldurl = "http://boldsystems.org/index.php/Ids_xml?db=" + str(db) + "&sequence=" + seq_record.seq
	data = urllib2.urlopen(str(boldurl)).read()
	if '<matches></matches>' in data:
		print("""<p>Unable to match any records in the selected database for sequence {0} :(<br><a href="http://blast.ncbi.nlm.nih.gov/Blast.cgi" target="_blank">You can try to BLAST this sequence on GenBank</a></p>""").format(str(x))
	else:
		root = ET.fromstring(data)
		tag = root.tag
		matchdetails = []
		m = 0
		for match in root:
			if m < int(quan):
				idvalue = match.find('ID').text
				dbvalue = match.find('database').text
				tivalue = match.find('taxonomicidentification').text
				simvalue = match.find('similarity').text
				specvalue = match.find('specimen').find('url').text
				subdict = {'ID': idvalue, 'Database': dbvalue, 'Taxonomic identification': tivalue, 'Similarity': simvalue, 'Specimen': specvalue}
				matchdetails.append(subdict)
				m += 1
		s = open(seq_record.id + '_' + idvalue + '.csv', 'wb')
		fieldnames = ['ID', 'Database', 'Taxonomic identification', 'Similarity', 'Specimen']
		writer = csv.DictWriter(s, fieldnames = fieldnames)   
		headers = dict( (n,n) for n in fieldnames )
		writer.writerow(headers)
		writer.writerows(matchdetails)
		s.close()
		print("""<p>Successfully fetched results for sequence no. {0}.<br>Download results as an xml file: <a href="{1}">{2}</a></p>
		""").format(str(x), 'output_'+seq_record.id + '_' + idvalue + '.csv', 'output_'+seq_record.id + '_' + idvalue + '.csv')
	x += 1

print("""
</body></html>
""")
