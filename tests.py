import unittest

from pyramid import testing


class ViewTests(unittest.TestCase):
	def setUp(self):
		self.config = testing.setUp()

	def tearDown(self):
		testing.tearDown()

	def test_home_view(self):
		from .views import home_view
		request = testing.DummyRequest()
		info = my_view(request)
		self.assertEqual(info['project'], 'gbol')

	#def test_hello_world(self):
	#	from tutorial import hello_world

	#	request = testing.DummyRequest()
	#	response = hello_world(request)
	#	self.assertEqual(response.status_code, 200)


class FunctionalTests(unittest.TestCase):
	def setUp(self):
		from gbol import main
		app = main({})
		from webtest import TestApp
		self.testapp = TestApp(app)

	def test_root(self):
		res = self.testapp.get('/', status=200)
		self.assertTrue(b'Pyramid' in res.body)



