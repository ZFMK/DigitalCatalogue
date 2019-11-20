"use strict";


function ResultLoader(bol_js, facets, querylist, id_prefix) {
	this.bol_js = bol_js;
	this.facets = facets;
	if (id_prefix != undefined) {
		this.id_prefix = id_prefix;
	}
	else {
		this.id_prefix = '';
	}
	this.resulttable = new ResultTable(bol_js, this.id_prefix);
	this.resultmap = new ResultMap(bol_js, this.id_prefix);
	this.querylist = querylist;
	this.rownum = 0;
	this.data = {};
	this.requestparams = null;
	
	// paging things
	this.startrow = 0;
	this.lastrow = 0;
	this.numFound = 0;
	this.pagesize = 1000;
	this.currentpage = 1;
	this.lastpage = 1;
	this.pagebuttons = [];
	
	//console.log('I am here, resultloader.js');
}


/*
ResultLoader.prototype.setDivIDPrefix = function(prefix) {
	var self = this;
	self.id_prefix = prefix;
	self.setNewResultTable();
}
*/

/*
ResultLoader.prototype.setNewMap = function() {
	var self = this;
	console.log(self.bol_js);
	self.resultmap = new ResultMap(self.bol_js);
	self.resultmap.setTarget(self.id_prefix + 'map');
	console.log(self.resultmap);
}

ResultLoader.prototype.setNewResultTable = function() {
	var self = this;
	self.resulttable = new ResultTable(self.bol_js);
	self.resulttable.setDivIDPrefix(self.id_prefix);
}
*/

ResultLoader.prototype.setRequestParams = function(paramsdict) {
	var self = this;
	if (paramsdict == null) {
		self.requestparams = null;
	}
	else {
		self.requestparams = [];
		for (var key in paramsdict) {
			self.requestparams.push({'name': key, 'value': paramsdict[key]});
		}
	}
}


ResultLoader.prototype.getRequestParams = function(source) {
	var self = this;
	self.requestparams = self.facets.readSearchParams();
	console.log('self.requestparams: ', self.requestparams);
}

ResultLoader.prototype.setPage = function(page, pagesize) {
	var self = this;
	// delete the entries for page and pagesize before setting new values
	// TODO: use a simple dictionary and convert it before requesting the solr server
	for (var i=0; i<self.requestparams.length; i++) {
		if (self.requestparams[i]['name'] == 'page') {
			self.requestparams.splice(i, 1);
		}
		if (self.requestparams[i]['name'] == 'pagesize') {
			self.requestparams.splice(i, 1);
		}
	}
	
	if ((page == undefined) && (page == null)) {
		self.requestparams.push({'name': 'page', 'value' : 1});
	}
	else {
		self.requestparams.push({'name': 'page', 'value' : page});
	}
	if ((pagesize != undefined) && (pagesize != null)){  
		self.requestparams.push({'name': 'pagesize', 'value': 1000});
		self.pagesize = pagesize;
	}
	else {
		self.requestparams.push({'name': 'pagesize', 'value': pagesize});
		self.pagesize = pagesize;
	}
	return;
	
}

ResultLoader.prototype.updateResultMapSize = function() {
	var self = this;
	self.resultmap.map.updateSize();
}


ResultLoader.prototype.loadHtmlTable = function(page, pagesize) {
	var self = this;
	
	if (self.requestparams == null) {
		self.getRequestParams('', page, pagesize);
	}
	self.requestparams.push({'name': 'htmltable', 'value': 'true'});
	
	self.setPage(page, pagesize);

	$('#' + self.id_prefix + 'exportButton').hide();
	$('#' + self.id_prefix + 'fastaButton').hide();
	//console.log('loadHtmlTable');
	
	self.bol_js.loadingOverlay($('#content'), true);
	$.ajax({
		url: "/static/getSpecimenGeoInfo",
		type: 'POST',
		dataType: 'json',
		data: self.requestparams
	}).done(function(data){
		if (data['entries'].length !== 0) {
			data['facets'] = data.entries.facet_counts;
			data['result_docs'] = data.entries.response.docs;
			
			$('#' + self.id_prefix + 'anzeige-content').html(data['htmltable']);
			//self.addTableColEvents();
			
			// needed here because ol might take some time to load the tiles
			self.bol_js.loadingOverlay($('#content'), false);
			
			self.resultmap.createFundstellenLayers(data, '', self.requestparams[1].value);

			self.setResultCounts(data);
			//self.resulttable.createResultTableWithPages(data);
			self.addPageButtons();
			self.setResultInfo();
			self.addSortEvents();

			if ((data['facets'] != 0) && (data['facets'] != undefined)) {
				self.taxonDetailsdrawPies(data['facets']['facet_fields']);
			}
			
			
		}
	}).fail (function() {
		console.log('failed ajax call')
		alert('failed ajax call');
	}).always(function(){
		//console.log('self.numFound ', self.numFound);
		if ((self.numFound > 0) && (self.numFound <= 100000)) {
			$('#' + self.id_prefix + 'exportButton').show();
		}
		self.bol_js.loadingOverlay($('#content'), false);
	});
	return;
	
	
}

ResultLoader.prototype.setTaxonInfo = function(taxon) {
	var self = this;
	$.ajax({
		url: "/static/getSpecimenGeoInfo",
		type: 'POST',
		dataType: 'json',
		data: {search_term: taxon, source: "taxasearch"}
	}).always(function(data){
		if (!data.success) {
			alert(data.text);
		}
		if (data['entries']) {
			data['result_docs'] = data.entries.response.docs;
			data['facets'] = data.entries.facet_counts;
			var ol_title = "";
			if (data['result_docs'][0]['tax_species']) {
				ol_title = data['result_docs'][0]['tax_species'];
			}
			//self.resultmap.createFundstellenLayers(data, '', ol_title);
			//console.log(self.bol_js);
			var tax = self.bol_js.sentences('taxon_details','tax');
			$('#taxonomy').empty().append(data['taxonomy']);
			//self.resulttable.createAnzeige(data, "setTaxonPage"); // source must not be undefined
			//self.resultloader.loadSpecimenTableData(data); // div for page buttons is missing
			//self.taxonDetailsdrawPies(data['facets']['facet_fields']);
		}
	});
	
}

ResultLoader.prototype.setSpecimenInfo = function(specimen_id, taxon) {
	var self = this;
	$.ajax({
		url: "/static/getSpecimenGeoInfo",
		type: 'POST',
		dataType: 'json',
		data: {'search_term': specimen_id, 'taxon': taxon, source: "specimensearch"}
	}).always(function(data){
		if (!data.success) {
			alert(data.text);
		}
		if (data['entries']) {
			data['result_docs'] = data.entries.response.docs;
			data['facets'] = data.entries.facet_counts;
			var ol_title = "";
			if (data['result_docs'][0]['tax_species']) {
				ol_title = data['result_docs'][0]['tax_species'];
			}
			self.resultmap.createFundstellenLayers(data, '', ol_title);
			//console.log(self.bol_js);
			var tax = self.bol_js.sentences('taxon_details','tax');
			$('#taxonomy').empty().append(data['taxonomy']);
		}
	});
	
}

ResultLoader.prototype.taxonDetailsdrawPies = function(data) {
	var self = this;
	var div1, div2, div3 = '', count, l = 0, i = 0, k = 0, pie, arr = [], lang, messages = {};
	messages['collection_facet'] = {'de': "Sammlung", 'en': "Collection"};
	messages['country_facet'] = {'de': "Land", 'en': "Country"};
	messages['completeness_level'] = {'de': "Vollständigkeit der Datensätze [%]", 'en': "Completeness of data records [%]"};
	messages['media_types'] = {'de': "Vorhandene Medien", 'en': "Available media"};
	lang=self.bol_js.get_lang();
	count = Object.keys(data).length;

	if (count > 0) {
		div1 = '<div id="' + self.id_prefix + 'chart';
		div2 = '" class="chart"></div>';
		for (l; l < count; l++) {
			div3 += div1 + l + div2;
		}
		$('#' + self.id_prefix + 'ChartArea').html(div3);
		
		
		for (pie in data) {
			arr = [];
			if (pie == 'completeness_level') {
				var sum = 0;
				for (k=0; k < data[pie].length; k=k+2) {
					sum = sum + data[pie][k+1];
				}
				
				for (k=0; k < data[pie].length; k=k+2) {
					var temp = [data[pie][k], Math.round((data[pie][k+1]/sum)*100)];
					arr.push(temp);
				}
				var newarray = [];
				var columnprefix = '';
				for (var m=10; m <= 100; m=m+10) {
					if (m < 100) {
						columnprefix = ">";
					}
					else {
						columnprefix = "";
					}
					newarray.push([columnprefix + m + '%', 0])
					for (k=0; k < arr.length; k++) {
						if (arr[k][0] == m) {
							newarray[newarray.length-1][1] = arr[k][1];
						}
					}
				}
				if (newarray.length > 0) {
					$('#' + self.id_prefix + 'ChartArea' + ' #' + self.id_prefix + 'chart' + i).jqplot([newarray], {
						title: messages[pie][lang],
						//seriesColors: ['#FF0000', '#EE1100', '#DD2200', '#BB4400', '#AA6600', '#888800', '#66AA00', '#44CC00', '#22EE00', '#00FF00'],
						seriesDefaults: {
							shadow: false,
							renderer: jQuery.jqplot.BarRenderer,
							pointLabels: {show: true},
							//rendererOptions: {
							//	varyBarColor: true
							//}
						},
						axes: {
							xaxis:{
								renderer: $.jqplot.CategoryAxisRenderer
							}
						}
					});
				}
			}
			
			else {
				for (k=0; k < data[pie].length; k=k+2) {
					if (pie == 'collection_facet') {
						var temp = [data[pie][k].match(/^\s*\S+/), data[pie][k+1]];
					}
					else {
						var temp = [data[pie][k], data[pie][k+1]];
					}
					if (temp[0] != "") {
						arr.push(temp);
					}
				}
				//console.log(arr);
				//if (arr.length <= 0) {
				//	arr.push(["not available", 100]);
				//}
				if (arr.length <= 0) {
					$('#' + self.id_prefix + 'ChartArea' + ' #' + self.id_prefix + 'chart' + i).addClass('hidden');
				}
				else {
					$('#' + self.id_prefix + 'ChartArea' + ' #' + self.id_prefix + 'chart' + i).removeClass('hidden');
				}
				
				if (arr.length > 0) {
					$('#' + self.id_prefix + 'ChartArea' + ' #' + self.id_prefix + 'chart' + i).jqplot([arr], {
						title: messages[pie][lang],
						seriesDefaults: {
							shadow: false,
							renderer: jQuery.jqplot.PieRenderer,
							rendererOptions: {
								startAngle: 180,
								sliceMargin: 4,
								showDataLabels: true
							}
						},
						grid: {
							background: 'transparent',
							drawGridlines: false,
							borderColor: 'transparent',
							shadow: false,
							drawBorder: false,
							shadowColor: 'transparent'
						},
						legend: {
							show: true,
							renderer: $.jqplot.EnhancedPieLegendRenderer,
							location: 's',
							fontSize: 0.85,
							rendererOptions: {
								numberRows: 2
							}
							//placement : "outside"
						}
					});
				}
			}
			i++;
		}
	} else {
		$('#' + self.id_prefix + 'ChartArea').html('<div id="' + self.id_prefix + 'messageBox">Keine Daten vorhanden</div>');
	}
};

ResultLoader.prototype.setResultCounts = function(data) {
	var self = this;
	self.startrow = parseInt(data.start) + 1;
	self.lastrow = parseInt(data.start) + parseInt(data.rows);
	if (self.lastrow > parseInt(data.numFound)) {
		self.lastrow = parseInt(data.numFound);
	}
	self.numFound = parseInt(data.numFound);
}

ResultLoader.prototype.setResultInfo = function() {
	var self = this;
	if (self.numFound > 0) {
		$('#' + self.id_prefix + 'viewCounter').html(self.bol_js.sentences('resultslice', '0') + self.startrow.toString() + self.bol_js.sentences('resultslice', '1') + self.lastrow.toString() + self.bol_js.sentences('resultslice', '2') + self.numFound);
	}
	else {
		$('#' + self.id_prefix + 'viewCounter').html(self.bol_js.sentences('no_specimens_found', 'msg'));
	}
}

ResultLoader.prototype.addPageButtons = function() {
	var self = this;
	var i;
	var page;
	
	// always remove the old button list
	$('#' + self.id_prefix + 'page_button_list').remove();
	
	//console.log(self.numFound, self.pagesize);
	
	if (self.numFound > self.pagesize) {
		self.calculatePageNums();
		self.calculateButtonValues();
		
		$('#' + self.id_prefix + 'page_selector').prepend('<div id="' + self.id_prefix + 'page_button_list" class="page_button_list"></div>');

		for (i = 0; i < self.pagebuttons.length; i++) {
			if ((self.pagebuttons[i] != "...") && (parseInt(self.pagebuttons[i]) != self.currentpage)) {
				$('#' + self.id_prefix + 'page_button_list').append('<button type="button" id="' + self.id_prefix + 'pagebutton_' + i + '" value="' + self.pagebuttons[i] + '" >' + self.pagebuttons[i] + '</button>');
				$('#' + self.id_prefix + 'pagebutton_' + i).addClass('pagebutton');
				$('#' + self.id_prefix + 'pagebutton_' + i).click( function() {
					page = parseInt($(this).val());
					var source = '';
					//console.log('pagebutton page ', page);
					// need to call startSearch here as loadHtmlTable grows the table but i do not know where this happens
					startSearch(page, self.pagesize);
					//growResultTable();
					//self.loadHtmlTable(page, self.pagesize);
				});
			}
			
			if (self.pagebuttons[i] == "...") {
				$('#' + self.id_prefix + 'page_button_list').append('<span id="' + self.id_prefix + 'pagebutton_' + i + '">' + self.pagebuttons[i] + '</span>');
				$('#' + self.id_prefix + 'pagebutton_' + i).addClass('pagebutton');
				$('#' + self.id_prefix + 'pagebutton_' + i).addClass('current_page_button');
			}
			if (parseInt(self.pagebuttons[i]) == self.currentpage) {
				$('#' + self.id_prefix + 'page_button_list').append('<button type="button" id="' + self.id_prefix + 'pagebutton_' + i + '" value="' + self.pagebuttons[i] + '" >' + self.pagebuttons[i] + '</button>');
				$('#' + self.id_prefix + 'pagebutton_' + i).prop('disabled', true);
				$('#' + self.id_prefix + 'pagebutton_' + i).addClass('current_page_button');
				$('#' + self.id_prefix + 'pagebutton_' + i).addClass('pagebutton');
			}
		}
	}
};

ResultLoader.prototype.calculatePageNums = function() {
	var self = this;
	self.currentpage = Math.floor(self.startrow / self.pagesize) + 1;
	self.lastpage = Math.floor(self.numFound / self.pagesize) + 1;
	if (self.currentpage > self.lastpage) {
		self.currentpage = self.lastpage;
	}
};

ResultLoader.prototype.calculateButtonValues = function() {
	var self = this;
	var i;

	self.pagebuttons = [];
	self.pagebuttons[0] = "1";
	if (self.lastpage < 8) {
		for (i = 0; i < self.lastpage; i++) {
			self.pagebuttons[i] = String(i + 1);
		} 
	}
	if (self.lastpage >= 8) {
		if (self.currentpage > 3 && self.currentpage < self.lastpage - 3) {
			self.pagebuttons[1] = "...";
			self.pagebuttons[2] = String(self.currentpage -1);
			self.pagebuttons[3] = String(self.currentpage);
			self.pagebuttons[4] = String(self.currentpage +1);
			self.pagebuttons[5] = "...";
			self.pagebuttons[6] = String(self.lastpage);
		}
		else {
			if (self.currentpage <= 3) {
				for (i = 0; i < 5; i++) {
					self.pagebuttons[i] = String(i + 1);
				}
				self.pagebuttons[5] = "...";
				self.pagebuttons[6] = String(self.lastpage);
			}
			if (self.currentpage >= self.lastpage - 3) {
				self.pagebuttons[1] = "...";
				for (i = 2; i < 7; i++) {
					self.pagebuttons[i] = String(self.lastpage - (6-i));
				}
			}
		}
	}
};


ResultLoader.prototype.addSortEvents = function(data) {
	var self = this;
	/*
	$('#sort_selector option').each( function() {
		var colname = $(this).val();
		console.log('colname ', colname);
	});
	*/
	// the table headers go the solr sort names by resulttable.pt as data-sort attributes
	// $('#' + self.id_prefix + 'anzeige-content #viewTable th').each( function() { //currently only the main table, because the taxon table will need more work
	$('#anzeige-content #viewTable th').each( function() {
		var sort_name = $(this).data('sort');
		if (sort_name != undefined) {
			$(this).off('click');
			$(this).click( function () {
				var sort_direction = $('#sort_direction').val();
				if (sort_direction == "asc") {
					sort_direction = "desc";
				}
				else {
					sort_direction = "asc";
				}
				$('#sort_direction').val(sort_direction);
				$('#sort_selector').val(sort_name);
				startSearch();
			});
		}
		// set the down/up arrow images in header
		$(this).children('.colheader_flex').children('.sort_buttons').remove();
		if (sort_name != undefined) {
			if ($(this).data('sort') == $('#sort_selector').val()) {
				if ($('#sort_direction').val() == 'asc') {
					$(this).children('.colheader_flex').append('<div class="sort_buttons">&emsp;<img class="sort_button" src="/static/images/buttons/sort_by_column_asc.png" alt="sort button ascending" /></div>');
				}
				else {
					$(this).children('.colheader_flex').append('<div class="sort_buttons">&emsp;<img class="sort_button" src="/static/images/buttons/sort_by_column_desc.png" alt="sort button descending" /></div>');
				}
			}
			else {
				$(this).children('.colheader_flex').append('<div class="sort_buttons">&emsp;<img class="sort_button" src="/static/images/buttons/sort_table.png" alt="sort button" /></div>');
			}
		}
	});
}

