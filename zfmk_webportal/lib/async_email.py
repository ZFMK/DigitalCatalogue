"""
http://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-email-support
"""
from .decorators import f_async
import smtplib
from email.mime.text import MIMEText

from .vars import config
#smtp_server = config['smtp']['server']

@f_async
def send_async_email(msg):
    #s = smtplib.SMTP(smtp_server)
    #s.sendmail(msg['From'], msg['To'], msg.as_string())
    #s.quit()
    pass

def send_mail(mail_to, mail_from, header, text):
    msg = MIMEText(text)
    msg['Subject'] = header
    msg['From'] = mail_from
    msg['To'] = mail_to
    send_async_email(msg)
