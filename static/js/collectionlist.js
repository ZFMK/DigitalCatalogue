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
		taxontree = new TaxonTree(facets);
		taxondetails = new TaxonDetails(bol_js, facets, resultloader);
		specimendetails = new SpecimenDetails(bol_js, facets, resultloader);
		
		/*
		$(document).ajaxStart(function() {
			showLoadingAnimation();
		}).ajaxComplete(function() {
			hideLoadingAnimation();
		}).ajaxError(function( event, jqxhr, settings, thrownError ) {
			alert(thrownError);
			hideLoadingAnimation();
		});
		*/

		bol_js.set_lang($(document.body).attr('data-lang'));
		init_searchbox();
		startSearch();
		//map_init();
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
			pagesize = 1000;
		}
		
		// TODO: move it into globally available method
		$('.detail_overlay').empty();
		$('#detail_navigation').remove();
		$( window ).off('resize');
		growResultTable();
		
		
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


	function checkSearchAvailable(page) {
		// check if taxon is set and BL is selected
		if ((page == 'BL') && ($("#choiceStateBL").val() == "None")) {
			$('#op' + page).prop("disabled", true);
			return false;
		}
		// check if taxon is set
		if ($('#choiceTaxa' + page + '_value').text() == 'not_chosen_ta') {
			$('#op'+ page).prop("disabled", true);
			return false;
		}
		else {
			$('#op' + page).prop("disabled", false);
			return true;
		}
	}

	hideButton = function (page) {
		$("#op" + page).prop("disabled", true);
		$('select').change(
			function () {
				if (page == "DE") {
					if ($("div.choiceTaxaDE_value").text() == "not_chosen_ta") {
						$("#opDE").prop("disabled", true);
					}
					else {
						$("#opDE").prop("disabled", false);
					}
				} else if (page == "BL") {
					if ($("div.choiceTaxaBL_value").text() == "not_chosen_ta" || $("#choiceStateBL").val() == "None") {
						$("#opBL").prop("disabled", true);
					}
					else {
						$("#opBL").prop("disabled", false);
						checkSearchAvailable(page);
					}
				} else if (page == "MI") {
					if ($("div.choiceTaxaMI_value").text() == "not_chosen_ta") {
						$("#opMI").prop("disabled", true);
					}
					else {
						$("#opMI").prop("disabled", false);
					}
				}
			}
		);
	};

	/* ============ Statistics Germany ============== */

	autocomplete = function (page) {
		// set different div ids for statsitics and missing page
		var pageprefix;
		if (page == 'MI') {
			pageprefix = '#Missing';
		}
		else {
			pageprefix = '#Statistics' + page;
		}
		$.ajax({
			url: "/static/autocomplete_statistics",
			dataType: "json",
			success: function (response) {
				var data = $(response).map(function () {
					return {value: this.taxon, id: this.id + ";" + this.lft + ";" + this.rgt};
				}).get();

				var selectflag = false;
				$(pageprefix + " #choiceTaxa" + page).autocomplete({
					source: data,
					minLength: 0,
					select: function (event, ui) {
						$('#choiceTaxa' + page + '_value').text(ui.item.id);
						selectflag = true;
					},
					close: function (event, ui) {
					// check if text in input field matches with one taxon
					// if no option from autocomplete list was selected
						if (selectflag == false) {
							var taxonid = checkInputInTaxa(page, $('#choiceTaxa' + page).val(), data);
						}
						checkSearchAvailable(page);
						selectflag = false;
					}
				});

			}
		});
	};

	ajaxDataRendererDE = function(taxon) {
		var choiceTaxaDE = $('#choiceTaxaDE_value').text(),
			table_struct,
			table_data,
			table_data_all_pivot = [],
			language, input, restable_DE,
			overview = bol_js.sentences('datarenderer','overview'),
			in_the_states = bol_js.sentences('datarenderer','in_the_states'),
			species = bol_js.sentences('datarenderer','species');
		table_struct = [['<div><h2>'] + overview + taxon + in_the_states + ['</h2></div>' +
			'<table id="datatableDE" class="display compact" cellspacing="0" width="100%">' +
			'<thead><tr><th>'] + species + ['</th><th>EU</th><th>BW</th><th>BY</th><th>BE</th><th>BB</th><th>HB</th><th>HH</th>' +
			'<th>HE</th><th>MV</th><th>NI</th><th>NW</th><th>RP</th><th>SL</th><th>SN</th><th>ST</th>' +
			'<th>SH</th><th>TH</th></tr></thead><tfoot><tr><th>'] + species + ['</th><th>EU</th><th>BW</th><th>BY</th>' +
			'<th>BE</th><th>BB</th><th>HB</th><th>HH</th><th>HE</th><th>MV</th><th>NI</th><th>NW</th><th>RP</th>' +
			'<th>SL</th><th>SN</th><th>ST</th><th>SH</th><th>TH</th></tr></tfoot><tbody></tbody></table>']];
		$('#opDE').prop("disabled", true);
		/*showLoadingAnimation();*/
		$.ajax({
			async: false,
			url: "/static/get_statisticsDE",
			dataType: "json",
			type: 'POST',
			data: {choiceTaxaDE: choiceTaxaDE, lang: lang},
			success: function (json) {
				if (choiceTaxaDE == "not_chosen_ta") {
					$('#choose_taxon_first_warning_DE').removeClass('hidden');
				} else {
					$('#choose_taxon_first_warning_DE').addClass('hidden');
				}
				dataDE = json.data;
				//Datatables
				$('#PromptArea').empty();
				$.each(json.data2, function (id, taxa) {
					var EU = "", BW = "", BY = "", BE = "", BB = "", HB = "", HH = "", HE = "", MV = "", NI = "", NW = "",
						RP = "", SL = "", SN = "", ST = "", SH = "", TH = "";
					input = taxa[3];
					input = input.toLowerCase();
					if (input.match("europa")) {
						EU = "+"
					}
					if (input.match("baden-württemberg")) {
						BW = "+"
					}
					if (input.match("bayern")) {
						BY = "+"
					}
					if (input.match("berlin")) {
						BE = "+"
					}
					if (input.match("brandenburg")) {
						BB = "+"
					}
					if (input.match("bremen")) {
						HB = "+"
					}
					if (input.match("hamburg")) {
						HH = "+"
					}
					if (input.match("hessen")) {
						HE = "+"
					}
					if (input.match("mecklenburg-vorpommern")) {
						MV = "+"
					}
					if (input.match("niedersachsen")) {
						NI = "+"
					}
					if (input.match("nordrhein-westfalen")) {
						NW = "+"
					}
					if (input.match("rheinland-pfalz")) {
						RP = "+"
					}
					if (input.match("saarland")) {
						SL = "+"
					}
					if (input.match("sachsen")) {
						SN = "+"
					}
					if (input.match("sachsen-anhalt")) {
						ST = "+"
					}
					if (input.match("schleswig-holstein")) {
						SH = "+"
					}
					if (input.match("thüringen")) {
						TH = "+"
					}
					table_data = [taxa[2], EU, BW, BY, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH];
					table_data_all_pivot.push(table_data);
				});

				$('#TableAreaDE').empty().append(table_struct);
				var taxon = $('#choiceTaxaDE').val();
				if (lang == 'de') {
					language = {
						"sEmptyTable": "Keine Daten in der Tabelle vorhanden",
						"sInfo": "_START_ bis _END_ von _TOTAL_ Einträgen",
						"sInfoEmpty": "0 bis 0 von 0 Einträgen",
						"sInfoFiltered": "(gefiltert von _MAX_ Einträgen)",
						"sInfoPostFix": "",
						"sInfoThousands": ".",
						"sLengthMenu": "_MENU_ Einträge anzeigen",
						"sLoadingRecords": "Wird geladen...",
						"sProcessing": "Bitte warten...",
						"sSearch": "Suchen",
						"sZeroRecords": "Keine Einträge vorhanden.",
						"oPaginate": {
							"sFirst": "Erste",
							"sPrevious": "Zurück",
							"sNext": "Nächste",
							"sLast": "Letzte"
						},
						"oAria": {
							"sSortAscending": ": aktivieren, um Spalte aufsteigend zu sortieren",
							"sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
						}
					}
				} else {
					language = {}
				}
				
				var export_title = bol_js.sentences('title_on_export','results_DE');
				restable_DE = $('#datatableDE').DataTable({
					"data": table_data_all_pivot,
					"bJQueryUI": true,
					"language": language,
					dom: 'T<"clear">lfrtip',
					'buttons': [
						{
							extend: 'csv', title: export_title + taxon
						}, 
						{
							extend: 'excel', title: export_title + taxon
						}, 
						{
							extend: 'pdf', title: export_title + taxon
						} 
					]
				});
				restable_DE.columns.adjust().draw();
				// put the export buttons into the filter fields container
				restable_DE.buttons().container().appendTo( $('#datatableDE_filter') );
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert(errorThrown);
				$("#opDE").prop("disabled", false);
			}
		});
	};

	getValuesdrawPies = function() {
		var div1, div2, div3 = '', count, l = 0, i = 0, choiceTaxaDE = $("#choiceTaxaDE_value").text(),
			taxon = $('#choiceTaxaDE').val();

		ajaxDataRendererDE(taxon);

		count = Object.keys(dataDE).length;

		if (choiceTaxaDE == "not_chosen_ta") {
			$('#TableAreaDE').empty()
		} else {
			if (count > 0) {
				if (taxon == "Alle Taxa") {
					div1 = "<div id='chart";
					div2 = "' class='chart left'></div>";
				} else {
					div1 = "<div id='chart";
					div2 = "' class='chart'></div>";
				}
				for (l; l < count; l++) {
					div3 += div1 + l + div2;
				}
				$('#ChartArea').html(div3);

				$.each(dataDE, function (taxon, numbers) {
					var total = 0;

					$(numbers).map(function () {
						total += this[1];
					});

					var myLabels = $.makeArray($(numbers).map(function () {
						return this[0] + " " + Math.round(this[1] / total * 100) + "%";
					}));

					var labels = [numbers[0][0] + ": " + numbers[0][1]];
					labels.push(numbers[1][0] + ": " + numbers[1][1]);
					labels.push(numbers[2][0] + ": " + numbers[2][1]);
					$('#chart' + i).jqplot([numbers], {
						title: taxon,
						seriesColors: ['#FF0000', '#FF8F35', '#008000'],
						seriesDefaults: {
							renderer: jQuery.jqplot.PieRenderer,
							rendererOptions: {
								showDataLabels: true,
								highlightMouseOver: true,
								dataLabels: myLabels,
								sliceMargin: 3
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
							location: 'e',
							labels: labels
						}
					});
					i++;
				});
			} else {
				$('#ChartArea').html('<div id="messageBox">Keine Daten vorhanden</div>');
			}
		}
	};

	/* ============ Statistics States ============== */

	ajaxDataRendererBL = function() {
		var language,
			choiceTaxaBL = $('#choiceTaxaBL_value').text(),
			choiceStateBL = $("#choiceStateBL").val(),
			dataBL,
			taxon = $('#choiceTaxaBL').val(),
			bland = $("#choiceStateBL").children("option").filter(":selected").text(),
			table_struct,
			table_data,
			table_data_all = [],
			page;
		var lang=bol_js.get_lang();

		if (lang == 'de') {
			table_struct = [['<h2>&Uuml;bersicht der '] + taxon + [' in '] + bland +
			['</h2><p>Die nicht gesammelten Arten beziehen sich auf die Taxonliste für ganz Deutschland. ' +
			'Dies bedeutet nicht automatisch, dass diese Art in diesem Bundesland vorkommt.</p>' +
			'<table id="datatableBL" class="display" cellspacing="0" width="100%"><thead><tr><th>Familie</th>' +
			'<th>Art</th><th>Anzahl gesammelt</th><th>Anzahl Barcodes</th></tr></thead><tfoot><tr><th>Familie</th>' +
			'<th>Art</th><th>Anzahl gesammelt</th><th>Anzahl Barcodes</th></tr></tfoot><tbody>']];
		} else {
			table_struct = [['<h2>List of the '] + taxon + [' collected in '] + bland +
			['</h2><p>"Not collected species" refers to the full taxon-list for Germany and does not ' +
			'necessarily mean that this particular species occurs in this federal state.</p>' +
			'<table id="datatableBL" class="display" cellspacing="0" width="100%"><thead><tr><th>Family</th>' +
			'<th>Species</th><th>Number collected</th><th>Number barcodes</th></tr></thead><tfoot><tr><th>Family</th>' +
			'<th>Species</th><th>Number collected</th><th>Number barcodes</th></tr></tfoot><tbody>']];
		}

		$("#opBL").prop("disabled", true);
		/*showLoadingAnimation();*/
		$.ajax({
			async: false,
			url: "/static/get_statisticsBL",
			dataType: "json",
			type: 'POST',
			data: {choiceTaxaBL: choiceTaxaBL, choiceStateBL: choiceStateBL},
			success: function (json) {
				dataBL = json.data;
				//Datatables
				if (choiceTaxaBL == "None" || choiceTaxaBL.slice(0, choiceTaxaBL.indexOf(";")) == "0") {
					$('#choose_taxon_first_warning_BL').removeClass('hidden');
				} else {
					$('#choose_taxon_first_warning_BL').addClass('hidden');
					$.each(json.data2, function (id, taxa) {
						table_data =  [taxa[1], taxa[2], taxa[3], taxa[4]];
						table_data_all.push(table_data);
					});

					$('#TableAreaBL').empty().append(table_struct);
					var state = $('#choiceStateBL').find(':selected').text();
					var taxon = $('#choiceTaxaBL').val();
					if (lang == 'de') {
						language = {
							"sEmptyTable": "Keine Daten in der Tabelle vorhanden",
							"sInfo": "_START_ bis _END_ von _TOTAL_ Einträgen",
							"sInfoEmpty": "0 bis 0 von 0 Einträgen",
							"sInfoFiltered": "(gefiltert von _MAX_ Einträgen)",
							"sInfoPostFix": "",
							"sInfoThousands": ".",
							"sLengthMenu": "_MENU_ Einträge anzeigen",
							"sLoadingRecords": "Wird geladen...",
							"sProcessing": "Bitte warten...",
							"sSearch": "Suchen",
							"sZeroRecords": "Keine Einträge vorhanden.",
							"oPaginate": {
								"sFirst": "Erste",
								"sPrevious": "Zurück",
								"sNext": "Nächste",
								"sLast": "Letzte"
							},
							"oAria": {
								"sSortAscending": ": aktivieren, um Spalte aufsteigend zu sortieren",
								"sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
							}
						}
					} else {
							language = {}
						}
					
					var export_title = bol_js.sentences('title_on_export','results_BL');
					var restable_BL = $('#datatableBL').DataTable({
						"data": table_data_all,
						"bJQueryUI": true,
						"language": language,
						dom: 'T<"clear">lfrtip',
						"order": [[2, "desc"]],
						'buttons': [
							{
								extend: 'csv', title: export_title + taxon + " in " + state
							}, 
							{
								extend: 'excel', title: export_title + taxon + " in " + state
							}, 
							{
								extend: 'pdf', title: export_title + taxon + " in " + state
							} 
						]
					});
					restable_BL.columns.adjust().draw();
					// put the export buttons into the filter fields container
					restable_BL.buttons().container().appendTo( $('#datatableBL_filter') );

					// where to put the adapted css definitions for dataTables.buttons?
					// this is a bad solution by applying css styles via jquery
					// set the buttons to the right side of the search field
					restable_BL.buttons().container().css({'float': 'right', 'margin-left': '4px'});
					// set the font-size, padding and border-radius for each of te buttons
					restable_BL.buttons().container().find('.dt-button').css({'padding': '0.2em 1em', 'font-size': '0.8em', 'border-radius': '4px'});
					
				}
				/*hideLoadingAnimation();*/
				$("#opBL").prop("disabled", false);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert(errorThrown);
				/*hideLoadingAnimation();*/
			}
		});
	};

	/* ============ Statistics Missing ============== */

	ajaxDataRendererMI = function() {
		var language,
			choiceTaxaMI = $('#choiceTaxaMI_value').text(),
			dataMI,
			taxon = $('#choiceTaxaMI').val(),
			table_data,
			table_data_all,
			page;
		var lang=bol_js.get_lang();
		if (lang == 'de') {
			table_data_all = [['<h2>&Uuml;bersicht der fehlenden '] + taxon +
			['</h2>' +
			'<table id="datatableMI" class="display" cellspacing="0" width="100%"><thead><tr><th>Familie</th>' +
			'<th>Art</th><th>BOLD-Suche</th></tr></thead><tfoot><tr><th>Familie</th><th>Art</th>' +
			'<th>BOLD-Suche</th></tr></tfoot><tbody>']];
		} else {
			table_data_all = [['<h2>List of the missing '] + taxon +
			['</h2>' +
			'<table id="datatableMI" class="display" cellspacing="0" width="100%"><thead><tr><th>Family</th>' +
			'<th>Species</th><th>BOLD-Search</th></tr></thead><tfoot><tr><th>Family</th><th>Species</th>' +
			'<th>BOLD-Search</th></tr></tfoot><tbody>']];
		}

		$("#opMI").prop("disabled", true);
		/*showLoadingAnimation();*/
		$.ajax({
			async: false,
			url: "/static/get_statisticsMI",
			dataType: "json",
			type: 'POST',
			data: {choiceTaxaMI: choiceTaxaMI},
			success: function (json) {
				dataMI = json.data;
				//Datatables
				if (choiceTaxaMI == "not_chosen_taxa") {
					$('#choose_taxon_first_warning_MI').removeClass('hidden');
				} else {
					$('#choose_taxon_first_warning_MI').addClass('hidden');
					$.each(json.data, function (id, taxa) {
						var i = taxa[2].indexOf(' ');
						var genus = taxa[2].substring(0, i);
						var epithet = taxa[2].substring(i).replace(/^\s+|\s+$/g,'');
						if (lang == 'de') {
							table_data = '<tr><td>' + taxa[1] + '</td><td>' + taxa[2] + '</td>' +
								'<td><a href="http://v4.boldsystems.org/index.php/Taxbrowser_Taxonpage?taxon='
								+ genus + '+' + epithet +'&searchTax=Search+Taxonomy" target="_blank" class="ext"</a>' +
								'BOLD-Suche nach ' + taxa[2] + '</td></tr>';
						} else {
							table_data = '<tr><td>' + taxa[1] + '</td><td>' + taxa[2] + '</td>' +
								'<td><a href="http://v4.boldsystems.org/index.php/Taxbrowser_Taxonpage?taxon='
								+ genus + '+' + epithet +'&searchTax=Search+Taxonomy" target="_blank" class="ext"</a>' +
								'Search BOLD for ' + taxa[2] + '</td></tr>';
						}
						table_data_all.push(table_data);
					});
					$('#TableAreaMI').empty().append(table_data_all.join(' '));
					if (lang == 'de') {
						language = {
							"sEmptyTable": "Keine Daten in der Tabelle vorhanden",
							"sInfo": "_START_ bis _END_ von _TOTAL_ Einträgen",
							"sInfoEmpty": "0 bis 0 von 0 Einträgen",
							"sInfoFiltered": "(gefiltert von _MAX_ Einträgen)",
							"sInfoPostFix": "",
							"sInfoThousands": ".",
							"sLengthMenu": "_MENU_ Einträge anzeigen",
							"sLoadingRecords": "Wird geladen...",
							"sProcessing": "Bitte warten...",
							"sSearch": "Suchen",
							"sZeroRecords": "Keine Einträge vorhanden.",
							"oPaginate": {
								"sFirst": "Erste",
								"sPrevious": "Zurück",
								"sNext": "Nächste",
								"sLast": "Letzte"
							},
							"oAria": {
								"sSortAscending": ": aktivieren, um Spalte aufsteigend zu sortieren",
								"sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
							}
						}
					} else {
							language = {}
						}
					
					var export_title = bol_js.sentences('title_on_export','results_MI');
					var restable_MI = $('#datatableMI').DataTable({
						"bJQueryUI": true,
						dom: 'T<"clear">lfrtip',
						language: language,
						'buttons': [
							{
								extend: 'csv', title: export_title + taxon
							}, 
							{
								extend: 'excel', title: export_title + taxon
							}, 
							{
								extend: 'pdf', title: export_title + taxon
							} 
						]
					});
					restable_MI.columns.adjust().draw();
					// put the export buttons into the filter fields container
					restable_MI.buttons().container().appendTo( $('#datatableMI_filter') );

					// where to put the adapted css definitions for dataTables.buttons?
					// this is a bad solution by applying css styles via jquery
					// set the buttons to the right side of the search field
					restable_MI.buttons().container().css({'float': 'right', 'margin-left': '4px'});
					// set the font-size, padding and border-radius for each of te buttons
					restable_MI.buttons().container().find('.dt-button').css({'padding': '0.2em 1em', 'font-size': '0.8em', 'border-radius': '4px'});
				}
				/*hideLoadingAnimation();*/
				$("#opMI").prop("disabled", false);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert(errorThrown);
				/*hideLoadingAnimation();*/
			}
		});
	};

})();


