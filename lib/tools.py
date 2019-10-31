# -*- coding: utf8 -*-
"""
	Small scripts that are used in several modules
	Database connect
	language settings
	...
"""

import pymysql
import warnings
import traceback
import time

import logging
log = logging.getLogger(__name__)

from gbol.lib.vars import config

class ConnectDB(object):
	""" Connects to target database """
	def __init__(self):
		self.con = None
		self.cur = None
		self.open_connection()
		self.commit = self.__commit
		self.execute = self.__execute
		self.no_execute = 0  # to prevent infinitive loops

	def open_connection(self):
		self.con = self.__mysql_connect()
		self.cur = self.con.cursor()
		self.con.autocommit(True)

	def reset_connection(self):
		self.close()
		time.sleep(8)
		self.open_connection()

	def __mysql_connect(self):
		try:
			con = pymysql.connect(host=config['host'], port=config['port'], user=config['user'], passwd=config['pw'], db=config['db'], charset='utf8')
		except pymysql.Error as e:
			log.critical("Error {0}: {1}".format(*e.args))
			raise
		return con

	#how to submit parameters in the pymysql way? execute(sql, [parameters])
	def __execute(self, query, commit=True):
		with warnings.catch_warnings():
			warnings.simplefilter('error', pymysql.Warning)
			try:
				self.cur.execute(query)
			except pymysql.Warning as e:
				log.warn("MySQL warning: {}".format(*e.args))
				log.debug("\n\t{}".format(query))
				raise
			except pymysql.Error as e:
				log.debug("MySQL Error {0}: {1}".format(*e.args))
				if e.args[0]==2006 and self.no_execute<1:  # -- (2006, "MySQL Server has gone away")
					self._open_connection()
					self.no_execute = 1
					self.__execute(query, commit)
				else:
					log.critical(e)
					raise
			except UnicodeEncodeError as e:
				if self.con:
					self.con.rollback()
				err_msg = "Unicode error!\n\tencoding:{0}\n\t{1}\n\t{4}".format(*e.args)
				log.critical(err_msg)
				log.critical(traceback.print_stack())
				raise
			except Exception as e:
				if self.con:
					self.con.rollback()
				log.critical("Error %r" % e.message)
				log.critical(traceback.print_stack())
				raise
			else:
				self.con.commit()
				self.no_execute = 0

	def __commit(self):
		with warnings.catch_warnings():
			try:
				self.con.commit()
			except Exception as e:
				if self.con:
					self.con.rollback()
				log.critical("Error %r" % e.message)
				log.critical(traceback.print_stack())
				raise

	def sql_clean(self, s):
		if not s:
			return ""
		return s.replace("\\","\\\\").replace("\'","'").replace("'","\\\'").replace('"','\\\"')

	def fkt_clean(self, value):
		try:  # -- 0xf6 -> ö in iso8859-1
			s = value.strip()
			return u''+self.sql_clean(s)+u''
		except UnicodeError:
			s = unicode(value, "ISO-8859-1")
			return u''+self.sql_clean(s)+u''
		return value

	def close(self):
		if self.con:
			self.con.close()

