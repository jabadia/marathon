#coding=utf-8

# 1
# http://web2.nyrrc.org/cgi-bin/htmlos.cgi/mar-programs/archive/archive_search.html

# 2
# obtener la action del form

# 3
# mandar el POST con los parámetros: input.f.hh, input.f.mm, input.t.hh, input.t.mm
# search.method = search.time

# 4
# obtener la tabla: 

# 5
# obtener la siguiente página: form, POST, Next 100


import sys
import bs4 as BeautifulSoup
import requests
from pprint import pprint
import codecs
from operator import attrgetter

search_url = "http://web2.nyrrc.org/cgi-bin/htmlos.cgi/mar-programs/archive/archive_search.html"

def get_form_action(s):
	r = s.get(search_url)
	r.encoding = 'utf-8'
	soup = BeautifulSoup.BeautifulSoup(r.text)
	form = soup.find('form')
	return form['action']

def do_first_search(s,form_action, f_hh, f_mm, t_hh, t_mm):
	params = {
		'search.method'	: 'search.time',
		'input.searchyear' : 2011,
		'input.top'     : 10,
		'input.top.wc'  : 10,
		'top.wc.type'   : 'P',
		'AESTIVACVNLIST': 'input.searchyear,input.top,input.agegroup,input.f.hh,input.f.mm,input.t.hh,input.t.mm,team_code,input.state,input.country,input.top.wc',
		'input.f.hh'	: f_hh,
		'input.f.mm'	: f_mm,
		'input.t.hh'	: t_hh,
		'input.t.mm'	: t_mm
	}
	headers = {
		'referer': search_url
	}
	proxies = None #{ 'http': '127.0.0.1:8888'}
	r = s.post(form_action, data=params, headers=headers, proxies=proxies)
	r.encoding = 'utf-8'
	soup = BeautifulSoup.BeautifulSoup(r.text)
	table = soup.find('table')
	for row in table.find_all('tr'):
		print(row)

def main(name):
	s = requests.Session();
	form_action = get_form_action(s)
	do_first_search(s,form_action, 3,50, 4,30)

if __name__=="__main__":
	# sys.stdout = codecs.getwriter('utf8')(sys.stdout)
	main(*sys.argv)
