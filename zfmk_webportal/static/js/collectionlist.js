(function() {
	var bol_js = new BOL($(document.body).attr('data-lang'));
	var facets;
	var map;
	var resultgetter;
	var resulttableobj;
	var resultmapobj;
	var taxontree;
	
	String.prototype.format = function () {
		var i = 0, args = arguments;
		return this.replace(/{}/g, function () {
			return typeof args[i] != 'undefined' ? args[i++] : '';
		});
	};

	after_load = function () {
		facets = new Facets();
		querylist = new QueryList();
		resultloader = new ResultLoader(bol_js, facets, querylist);
		osdviewerlists = new OSDViewerLists();
		
		taxontree = new TaxonTree(facets);
		taxondetails = new TaxonDetails(bol_js, facets, resultloader, osdviewerlists);
		specimendetails = new SpecimenDetails(bol_js, facets, resultloader, osdviewerlists);
		
		bol_js.set_lang($(document.body).attr('data-lang'));
		init_searchbox();
		startSearch();
		//map_init();
		setPageSizeEvent();
	};

	$(document).ready(function() {
		bol_js.set_lang($(document.body).attr('data-lang'));
	});

	
	
	function init_searchbox() {
			$('#nested_tabs').tabs({
				cache: true,
				activate: function(event, ui) {
					check_nested(ui.newPanel.selector)
				},
				create: function(event, ui) {
					check_nested(ui.panel.selector)
				}
			});
	}
	
	function check_nested(selector) {
		// check wich type of search was selected under Fundstellen
		// if #search_pane was clicked set up Facets object
		// else set up treeview
		if (selector == "#search_pane" ) {
			if(facets) return true;
		} else if (selector == "#taxa_tree" ) {
			toggleField(document.getElementById('nested_tabs'), false);
			if($('#Node_Root').html().length>0) return true;
			jQuery.ajax({
				url: "/static/loadTreeView",
				type: 'POST',
				dataType: 'json',
				data: {nodeid: 1}
			}).done(function(data){
				if (!data.success) {
					alert(data.text);
				} else {
					taxontree.createTreeView(data.entries);
				}
			}).fail(function(xhr, textStatus, errorThrown){
				alert(textStatus);
			});
		}
	}
	

	startSearch = function(page, pagesize) {
		var source = '';
		var page = page;
		var pagesize = pagesize;
		if (page === undefined) {
			page = 1;
		}
		if (pagesize === undefined) {
			pagesize = $('#pagesize_selector').val();
			if (pagesize === undefined) {
				pagesize = 1000;
			}
		}
		
		// TODO: move it into globally available method
		$('.detail_overlay').empty();
		$('#detail_navigation').remove();
		$( window ).off('resize');
		growResultTable();
		
		
		
		osdviewerlists.removeOldViewerLists();
		
		
		console.log('startSearch page, pagesize ', page, pagesize);
		// the request params must be set to null to enforce the resultloader to read them from filter form
		// this is a bad idea
		resultloader.setRequestParams(null);
		//resultloader.loadSpecimenTableData(source, page, pagesize);
		resultloader.loadHtmlTable(page, pagesize);
		//facets.updateChosenFacetsEvents();
		return false;
	};

	shrinkResultTable = function () {
		$('#results_map').addClass('hidden');
		$('#ChartArea').addClass('hidden');
		$('#results_table').css({'max-height': '25em'});
		$('#viewTable').css('max-height', '15em');
	}
	
	growResultTable = function () {
		$('#results_map').removeClass('hidden');
		$('#ChartArea').removeClass('hidden');
		// this is dirty because I step through resultloader to update the map
		// the map must be updated when it was hidden and the window was resized in this time
		resultloader.updateResultMapSize();
		$('#results_table').css({'max-height': '40em'});
		$('#viewTable').css('max-height', '30em');
	}

	/*
	addToSearch = function() {
		var source = 'addto';
		resultloader.loadSpecimenTableData(source);
		return false;
	};
	*/

	clearFacets = function() {
		facets.clearFacets();
	};
	
	clearSearchTerm = function() {
		facets.clearSearchTerm();
	};

	showCitation = function(button) {
		var div = document.getElementById('citation');
		if (div.style.display !== 'none') {
			div.style.display = 'none';
		}
		else {
			div.style.display = 'block';
		}
	};

	submitTextBox = function (key) {
		if (key.which == 13) {
			startSearch();
		}
	};



	function showLoadingAnimation() {
		bol_js.loadingOverlay($('#content'), true);
	}

	function hideLoadingAnimation() {
		bol_js.loadingOverlay($('#content'), false);
	}



	function selectMapLayer(layerId) {
		var style = new OpenLayers.Style({
					strokeColor: "white",
					strokeWidth: 1,
					fillColor: "blue",
					fillOpacity: 0.4,
					fontColor: "white",
					fontSize: 9
				}
			),
			styleMap = new OpenLayers.StyleMap({"default": style});
		if (map.layers[layerId]) {
			map.layers[layerId].styleMap = styleMap;
			map.layers[layerId].redraw();
		}
	}

	function deselectMapLayer(layerId) {
		var style = new OpenLayers.Style({
					strokeColor: "white",
					strokeWidth: 1,
					fillColor: "#FF8F35",
					fillOpacity: 0.4,
					fontColor: "white",
					fontSize: 9
				}
			),
			styleMap = new OpenLayers.StyleMap({"default": style});
		if (map.layers[layerId]) {
			map.layers[layerId].styleMap = styleMap;
			map.layers[layerId].redraw();
		}
	}

	fastaExport = function (taxon) {
		var idslist = document.getElementById('idslist').innerHTML,
			file_error = bol_js.sentences('taxon_details','file_error');
		$.ajax({
			url: "/static/fastaExport",
			type: 'POST',
			data: {taxon: taxon, idslist: idslist},
			dataType: 'json',
			traditional: true,
			success: function (data) {
				if (!data.success) {
					alert(data.text);
				} else {
					console.log("populate iframe");
					populateIframe("frame1", data.filename)
				}
			},
			error: function (xhr, textStatus, errorThrown) {
				alert(file_error)
			}
		});
	};

	csvExport = function (paramslist) {
		var file_error = bol_js.sentences('taxon_details','file_error');
		
		if (paramslist == undefined) {
			paramslist = [];
			paramslist = facets.readSearchParams();
		}
		
		console.log('paramslist: ', paramslist);
		paramslist.push({name: 'source',value : 'csvExport'});
		
		
		bol_js.loadingOverlay($('#content'), true);
		$.ajax({
			url: "/static/getSpecimenGeoInfo",
			type: 'POST',
			dataType: 'json',
			data: paramslist
		}).done(function(data){
			if (!data.success) {
				alert(data.text);
			}
			if (data['idslist'].length !== 0) {
				$.ajax({
					url: "/static/csvExport",
					type: 'POST',
					data: {"specimen_ids": data['idslist']},
					dataType: 'json',
					success: function (data) {
						if (!data.success) {
							alert(data.text);
						} else {
							populateIframe("frame1", data.filename);
						}
						bol_js.loadingOverlay($('#content'), false);
					},
					error: function (xhr, textStatus, errorThrown) {
						bol_js.loadingOverlay($('#content'), false);
						alert(file_error);
					}
				});
			}
		});
	};


	// this is used to generate download TODO: remove
	function populateIframe(id, path) {
		var ifrm = document.getElementById(id);
		ifrm.src = "/download?results=1&fileName=" + path;
	}


	function setPageSizeEvent() {
		$('#pagesize_selector').change( function () {
			startSearch();
		})
	}


	function checkInputInTaxa(page, inputval, data) {
	for (var i = 0; i < data.length; i++) {
			if (data[i]['value'] == inputval) {
			$('#choiceTaxa' + page + '_value').text(data[i]['id']);
		return data[i]['id'];
			}
	}
	$('#choiceTaxa' + page + '_value').text('not_chosen_ta');
	return false;
	}


})();


