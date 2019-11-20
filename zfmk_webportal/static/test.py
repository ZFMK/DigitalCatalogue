import pymysql
chost = 'localhost'
cport = 3306
cuser = 'root'
cpw = 'vmware'
cdb = 'gbol_python'
conn = pymysql.connect(host=chost, port=cport, user=cuser, passwd=cpw, db=cdb)
cur = conn.cursor()
cur.execute("Select * from users where uid = 1")
row = cur.fetchone()
cur.close()
conn.close()
print (row)
