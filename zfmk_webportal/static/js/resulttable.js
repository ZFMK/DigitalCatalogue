"use strict";


function ResultTable(bol_js, id_prefix) {
	this.bol_js = bol_js;
	if (id_prefix != undefined) {
		this.id_prefix = id_prefix;
	}
	else {
		this.id_prefix = '';
	}
	//console.log('I am here, resulttable.js');
}

/*
ResultTable.prototype.setDivIDPrefix = function(prefix) {
	var self = this;
	self.id_prefix = prefix;
}
*/

ResultTable.prototype.setupTableDiv = function() {
	var self = this;
	$('#' + self.id_prefix + 'resultArea').remove();
	$('#' + self.id_prefix + 'viewCounter').html(self.bol_js.sentences('map','no_specimens') + '0');
	$('#' + self.id_prefix + 'anzeige-content').append('<div id="' + self.id_prefix + 'resultArea"><table id="' + self.id_prefix + 'viewTable" class="display"></table></div>');
};



ResultTable.prototype.createAnzeige = function(data, source) {
	var self = this;
	var e, i, j, l = data.tablerowdicts.length,
		id, colname, pagelen = 50, resulttable,
		tabledata = [], tablecolumns = [], tablerow = {},
		idslist = [];

	for (i=0 ; i<l; i++) {
		e = data.tablerowdicts[i];
		tablerow = e;
		tabledata.push(tablerow);
	}
	var idslist = data.idslist
	if (source === 'addto') {
		$('#' + self.id_prefix + 'idslist').append(idslist);
	} else {
		$('#' + self.id_prefix + 'idslist').empty().append(idslist);
	}

	if (source !== 'addto') {
		self.setupTableDiv();
		for ( j=0; j < data.fields.length; j++) {
			// generate array of {data: 'name of column'} objects
			tablecolumns.push({'data': data.fields[j][1], 'title': data.fields[j][1]})
		}
	}

	if (source === "addto") {
		var regexNum = /\d+?$/;
		i += parseInt($('#' + self.id_prefix + 'viewCounter').text().match(regexNum), 10);
		//console.log('not greedy? ', $('#viewCounter').text().match(regexNum));
		//i += parseInt($('#viewCounter').text().replace(/[^0-9.]/g, ''), 10);
		//console.log(i);
	}
	if (i > 0) {
		// set table generation parameters depending on row number
		var paging = false;
		var defrender = false;
		if (i > 50) {
			paging = true;
			defrender = true;
			pagelen = Math.pow(10, (Math.floor(Math.pow((i/10), 0.1)) +1));
			if (pagelen > 1000) {
				pagelen = 1000;
			}
		}

		if (source === 'addto') {
			var resulttable = $('#' + self.id_prefix + 'viewTable').DataTable();
			if (paging == true) {
				resulttable.page.len(pagelen).draw();
			}
			console.log(resulttable);
			console.log(resulttable.rows.length);
			resulttable.rows.add(tabledata).draw();
			
			console.log('adding');
		} else {
			resulttable = $('#' + self.id_prefix + 'viewTable').DataTable({
				'data': tabledata,
				'columns': tablecolumns,
				//"deferRender": defrender,
				"pagingType": "full_numbers",
				"scrollX": true,
				"scrollY": 300,
				//"scrollCollapse": false,
				"paging": paging,
				"lengthMenu": [10, 50, 100, 500, 1000],
				//wait 800ms before starting a search when something is entered into search field
				"searchDelay": 800,
				"defaultContent": "<i>None</i>",
				'stateSave': true,
				"language": {
					"url": "/static/js/DataTables/" + self.bol_js.get_lang() + ".txt"
				},
				"columnDefs": [{"width": "10%", "targets": 0}],
				"aaSorting": [[1, "asc"]]
			});
		}

		if (source !== 'addto') {
			// setting pageLength in parameters kills performance when loading new pages
			if (paging == true) {
				resulttable.page.len(pagelen).draw();
			}
		}
		
		$('#' + self.id_prefix + 'exportButton').show();
		$('#' + self.id_prefix + 'fastaButton').show();
		$('#' + self.id_prefix + 'viewCounter').html(self.bol_js.sentences('map','no_specimens') + i);
	}
};

ResultTable.prototype.createResultTableWithPages = function(data) {
	var self = this;
	var tabledata = [];
	var tablecolumns = []; 
	var tablerow = {};
	var i, j;
	
	for (i=0 ; i<data.tablerowdicts.length; i++) {
		tabledata.push(data.tablerowdicts[i]);
	}
	
	//self.createTableHeader(data.fields);
	self.setupTableDiv();
	
	
	for ( j=0; j < data.fields.length; j++) {
		// generate array of {data: 'name of column', 'title': 'name of column'} objects, data is needed for sorting values to columns, title is needed for header
		tablecolumns.push({'data': data.fields[j][1], 'title': data.fields[j][1]})
	}
	
	var resulttable = $('#' + self.id_prefix + 'viewTable').DataTable({
				'data': tabledata,
				'columns': tablecolumns,
				"scrollX": true,
				"scrollY": 300,
				"scrollCollapse": false,
				"paging": false,
				//wait 800ms before starting a search when something is entered into search field
				//"searchDelay": 800,
				'searching': false,
				//"defaultContent": "<i>None</i>",
				//'stateSave': true,
				"language": {
					"url": "/static/js/DataTables/" + self.bol_js.get_lang() + ".txt"
				},
				//"columnDefs": [{"width": "10%", "targets": 0}],
				"aaSorting": [[1, "asc"]],
				'info': false,
			});
};


