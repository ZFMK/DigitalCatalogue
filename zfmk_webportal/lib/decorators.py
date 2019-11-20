"""
http://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-email-support
"""
from threading import Thread


def f_async(f):
    def wrapper(*args, **kwargs):
        thr = Thread(target=f, args=args, kwargs=kwargs)
        thr.start()
    return wrapper
