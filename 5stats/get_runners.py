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
proxies = None #{ 'http': '127.0.0.1:8888'}

def parse_time(t):
	if not t:
		return 0
	(hours,minutes,seconds) = t.split(':')
	return int(hours) * 3600 + int(minutes) * 60 + int(seconds)

def format_time(t):
	seconds = t % 60
	t = (t - seconds) / 60
	minutes = t % 60
	hours = (t - minutes)  / 60
	return "{0}:{1:02}:{2:02}".format(hours,minutes,seconds) if hours > 0 else "{1:02}:{2:02}".format(minutes,seconds)

class Runner:
	def __init__(self,tr):
		tds = tr.find_all("td")
		self.first_name   = tds[0].string
		self.last_name    = tds[1].string
		self.sex          = tds[2].string[0]
		self.age          = tds[2].string[1:]
		self.bib          = tds[3].string
		self.team         = tds[4].string
		self.state        = tds[5].string
		self.country_res  = tds[6].string
		self.citizenship  = tds[7].string
		self.place        = tds[8].string
		self.gender_place = tds[9].string
		self.age_place    = tds[10].string

		self.gun_time     = tds[11].string
		self.net_time     = tds[12].string
		self.time_5k      = tds[13].string
		self.time_10k     = tds[14].string
		self.time_15k     = tds[15].string
		self.time_20k     = tds[16].string
		self.time_half    = tds[17].string
		self.time_25k     = tds[18].string
		self.time_30k     = tds[19].string
		self.time_35k     = tds[20].string
		self.time_40k     = tds[21].string

		self.sec_5k       = parse_time(self.time_5k)
		self.sec_10k      = parse_time(self.time_10k)
		self.sec_15k      = parse_time(self.time_15k)
		self.sec_20k      = parse_time(self.time_20k)
		self.sec_half     = parse_time(self.time_half)
		self.sec_25k      = parse_time(self.time_25k)
		self.sec_30k      = parse_time(self.time_30k)
		self.sec_35k      = parse_time(self.time_35k)
		self.sec_40k      = parse_time(self.time_40k)
		self.sec_total    = parse_time(self.net_time)

	def __repr__(self):
		return ("{0.first_name},{0.last_name},{0.sex},{0.age},{0.bib},{0.team},{0.state},{0.country_res},{0.citizenship}," + 
			"{0.place},{0.gender_place},{0.age_place}," +
			"{0.gun_time},{0.net_time},{0.time_5k},{0.time_10k},{0.time_15k},{0.time_20k},{0.time_half},{0.time_25k},{0.time_30k},{0.time_35k},{0.time_40k}" +
			"{0.sec_5k},{0.sec_10k},{0.sec_15k},{0.sec_20k},{0.sec_half},{0.sec_25k},{0.sec_30k},{0.sec_35k},{0.sec_40k},{0.sec_total}").format(self)

def get_form_action(s):
	r = s.get(search_url)
	r.encoding = 'utf-8'
	soup = BeautifulSoup.BeautifulSoup(r.text)
	form = soup.find('form')
	return form['action']


def extract_runners_table(s,html):
	soup = BeautifulSoup.BeautifulSoup(html)
	table = soup.find('table')
	runnerCount = 0
	for tr in table.find_all('tr', bgcolor="#FFFFFF"):
		runner = Runner(tr)
#		print runner
		runnerCount += 1

	sys.stderr.write("read {0} runners\n".format(runnerCount))

	next_button = soup.find('input', value='Next 100 >')
	if next_button:
		next_url = next_button.parent['action']
		sys.stderr.write("next page\n")
		params = {
			'submit': 'Next 100 >'
		}
		headers = {
			'referer': search_url
		}
		r = s.post(next_url, data=params, headers=headers, proxies=proxies)
		r.encoding = 'utf-8'
		extract_runners_table(s,r.text)
	else:
		sys.stderr.write("END\n")


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
	r = s.post(form_action, data=params, headers=headers, proxies=proxies)
	r.encoding = 'utf-8'
	extract_runners_table(s, r.text)	

def main(name):
	s = requests.Session();
	form_action = get_form_action(s)
	do_first_search(s,form_action, 3,50, 3,52)

if __name__=="__main__":
	# sys.stdout = codecs.getwriter('utf8')(sys.stdout)
	main(*sys.argv)
