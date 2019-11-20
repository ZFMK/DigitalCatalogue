import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.txt')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'pyramid',
    'pyramid_tm',
    'pyramid_chameleon',
    'pyramid_debugtoolbar',
    'pyramid_beaker',
    'waitress',
    'pymysql',
    'pudb',
    'simplejson',
    'passlib',
    'configparser',
    'biopython'
    ]

setup(name='zfmk_webportal',
      version='3.7',
      description='zfmk_webportal',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="zfmk_webportal",
      entry_points="""\
      [paste.app_factory]
      main = zfmk_webportal:main
      """,
      )
