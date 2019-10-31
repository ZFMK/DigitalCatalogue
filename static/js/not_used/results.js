(function() {
	var bol_js = new BOL($(document.body).attr('data-lang')), facets, map, form;
	
	String.prototype.format = function () {
		var i = 0, args = arguments;
		return this.replace(/{}/g, function () {
			return typeof args[i] != 'undefined' ? args[i++] : '';
		});
	};

	after_load = function () {
		form = new Form('#search_form');
		$(document).ajaxStart(function() {
			showLoadingAnimation();
		}).ajaxComplete(function() {
			hideLoadingAnimation();
		}).ajaxError(function( event, jqxhr, settings, thrownError ) {
			alert(thrownError);
			hideLoadingAnimation();
		});

		bol_js.set_lang($(document.body).attr('data-lang'));
		init_tabs();
		map_init();
	};

	$(document).ready(function() {
		bol_js.set_lang($(document.body).attr('data-lang'));
	});

	function init_tabs() {
		function check_main(selector) {
			if (selector == "#Checklist" ) {
				$('#nested_tabs').tabs({
					cache: true,
					activate: function(event, ui) {
						check_nested(ui.newPanel.selector)
					},
					create: function(event, ui) {
						check_nested(ui.panel.selector)
					}
				});
				$('#checklist_tabs').tabs({
					cache: true,
					activate: function(event, ui) {
						check_nested(ui.newPanel.selector)
					},
					create: function(event, ui) {
						check_nested(ui.panel.selector)
					}
				});
			} else if (selector == "#StatisticsDE" ) {
				if($('#StatisticsDE').html().length>0) return true;
				$(selector).load('/ergebnisse/fragments/stats_country', function() {
					autocomplete(page='DE');
					getValuesdrawPies();
					hideButton(page='DE');
				});
			} else if (selector == "#StatisticsBL" ) {
				if($('#StatisticsBL').html().length>0) return true;
				$(selector).load('/ergebnisse/fragments/stats_state', function() {
					autocomplete(page='BL');
					hideButton(page='BL');
				});
			} else if (selector == "#Missing" ) {
				if($('#Missing').html().length>0) return true;
				$(selector).load('/ergebnisse/fragments/stats_missing', function() {
					autocomplete(page='MI');
					hideButton(page='MI');
				});
			}
		}
		function check_nested(selector) {
			// check wich type of search was selected under Fundstellen
			// if #search_pane was clicked set up Facets object
			// else set up treeview
			if (selector == "#search_pane" ) {
				if(facets) return true;
				facets = new Facets(form);
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
						createTreeView(data.entries);
					}
				}).fail(function(xhr, textStatus, errorThrown){
					alert(textStatus);
				});
			}
		}
		$('#main').tabs({
			cache: false,
			activate: function(event, ui) {
				check_main(ui.newPanel.selector)
			},
			create: function(event, ui) {
				check_main(ui.panel.selector)
			}
		});
	}

/*
	loadSpecimenTableData = function(source) {
		// this is the first call of the search, therefore, the filters must be set from the form
		var form_elements = form.process_search();
		// explicitely store the search elements
		form.store_search_elements();
		// reset the list of combined searches if it was set before
		form.reset_combined_search();
		$('#exportButton').hide();
		$('#fastaButton').hide();
		
		$.ajax({
			url: "/static/getSpecimenGeoInfo",
			type: 'POST',
			dataType: 'json',
			data: form_elements
		}).done(function(data){
			if (!data.success) {
				alert(data.text);
			}
			toggleField(document.getElementById('nested_tabs'), true);
			if (data['entries'].length !== 0) {
				data['entries'] = data.entries.response.docs;
				createFundstellenLayers(data, source, form.elements[1].value);
				createAnzeige(data, source);
				$("#search_button_add").removeClass('hidden');
				$("#search_button").val(bol_js.sentences('map','new_search'));
			}
		}).always(function(){
			var filter = $("#choiceFilters").val();
			facets.reload(filter);
		});
	}
*/

/*
	startSearch = function() {
		var source = '';
		if ($("#search_button").val() !== bol_js.sentences('map','new_search')) {
			source = 'first_search'
		}
		loadSpecimenTableData(source);
		return false;
	};

	addToSearch = function() {
		var source = 'addto';
		loadSpecimenTableData(source);
		return false;
	};
*/

	setTaxonPage = function(search_str) {
		// called by ergebnisse/fragments/taxondetail.pt to set map and some details for the TaxonDetailPage
		showLoadingAnimation();
		$.ajax({
			url: "/static/getSpecimenGeoInfo",
			type: 'POST',
			dataType: 'json',
			data: {search_term: search_str, source: "taxasearch"}
		}).always(function(data){
			if (!data.success) {
				alert(data.text);
			}
			if (data['entries']) {
				data['entries'] = data.entries.response.docs;
				var ol_title = "";
				if (data['entries'][0]['tax_species']) {
					ol_title = data['entries'][0]['tax_species'];
				}
				createFundstellenLayers(data, '', ol_title);
				var tax = bol_js.sentences('taxon_details','tax');
				$('#taxonomy').empty().append("<h2>" + tax + ": " + data['taxonomy'] + "</h2>");
				createAnzeige(data, source="setTaxonPage"); // must not be undefined
				speciesDetailsdrawPies(data['facets']['facet_counts']['facet_fields']);
			}
			hideLoadingAnimation();
		});
		return false;
	};

/*
	setSpecimenPage = function(id, taxon) {
		// called by ergebnisse/fragments/specimendetail.pt to set map and some details for the SpecimenDetailPage
		showLoadingAnimation();
		$.ajax({
			url: "/static/getSpecimenGeoInfo",
			type: 'POST',
			dataType: 'json',
			data: {search_term: id, source: "specimensearch", taxon: taxon} // change search_term to specimenid here
		}).always(function(data){
			if (!data.success) {
				alert(data.text);
			}
			if (data['entries']) {
				data['entries'] = data.entries.response.docs;
				// bad fix for iframed detail pages:
				// form is not defined because the detail pages do not have a #search_form element
				var ol_title = "";
				if (data['entries'][0]['tax_species']) {
					ol_title = data['entries'][0]['tax_species'];
				}
				createFundstellenLayers(data, '', ol_title);
				var tax = bol_js.sentences('taxon_details','tax');
				$('#taxonomy').empty().append("<h2>" + tax + ": " + data['taxonomy'] + "</h2>");
				var taxon_id = data['entries'][0]['taxon_id'];
				$.ajax({
					url: "/static/getRedList",
					type: 'POST',
					dataType: 'json',
					data: {taxon_id: taxon_id}
				}).always(function(data){
					if (!data.success) {
						$('#redlist_list').empty().append(data.text);
					}
					if (data['entries'].length !== 0) {
						$('#redlist_list').empty().append(data.entries);
					}
				});
			}
			hideLoadingAnimation();
		});
		return false;
	};
*/

	showdetails = function() {
		var CheckBoxes = document.getElementsByClassName('barcode');
		for (var i = 0; i < CheckBoxes.length; i++) {
			CheckBoxes[i].checked = true;
		}
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

	function createTreeView(rows) {
		for (var i = 0; i < rows.length; i++) {
			addNode(rows[i]);
		}
	}

	loadTreeview = function (element) {
		var childid = ".ParentNode_" + $(element).attr('node');
		if ($(childid).css("display") == "none") {
			$(childid).css("display", "block");
		} else {
			$(childid).css("display", "none");
		}

		var prefix = document.getElementById("prefix_" + $(element).attr('node'));
		if ($(prefix).hasClass("closed")) {
			prefix.innerHTML = " - ";
			prefix.className = "expanded";
		} else if ($(prefix).hasClass("expanded")) {
			prefix.innerHTML = " + ";
			prefix.className = "closed";
		}

		if ($(element).hasClass("clicked")) {
			return;
		}
		$.ajax({
			url: "/static/loadTreeView",
			type: 'POST',
			dataType: 'json',
			data: {nodeid: $(element).attr('taxa')}
		}).done(function(data){
			if (!data.success) {
				alert(data.text);
			} else {
				createTreeView(data.entries);
			}
		}).fail(function(xhr, textStatus, errorThrown){
			alert(textStatus);
		});
		$(element).addClass("clicked");
	};

	searchTaxa = function (element) {
		// this function is called from treeview page when clicking on the arrow behind a taxon
		// it uses form.add_entry to define the filter here
		// unclear whether it should communicate with the filters in Search
		$("#anzeige-content").empty();
		$('#exportButton').hide();
		$('#fastaButton').hide();
		// do we need form_elements = form.process_search(); here in any way?
		//form_elements = form.process_search();
		form.add_entry('source', 'treeview');
		form.add_entry('taxon_id', $(element).attr('taxa'));
		$.ajax({
			url: "/static/getSpecimenGeoInfo",
			type: 'POST',
			dataType: 'json',
			data: form.elements
		}).done(function(data){
			if (!data.success) {
				alert(data.text);
				createFundstellenLayers(data.entries.response.docs, '', form.elements[1].value);
			} else {
				data['entries'] = data.entries.response.docs;
				createFundstellenLayers(data, '', form.elements[1].value);
				createAnzeige(data);
			}
		});
	};

	function addNode(row) {
		// ["Animalia",  1,		 2,	 3,		 4,	  5,					  6,				   7,	8, 9]
		// taxon	  , id, parent_id, known, collected, barcode, collected_individuals, barcode_individuals, rank, vernacular
		var rootNodeId, newNode = new Array(), newNodeId, newNodeValue, nodePrefix, nodeClass, arrNode = '',
			collInd = '', barInd = '',
			taxon_id, vernacular;
		if (row[2] == 1) {
			rootNodeId = "Node_Root";
		} else {
			rootNodeId = "Node_" + row[2];
		}
		newNodeId = "Node_" + row[1];
		if (row[4] > 0) {
			collInd = '('.concat(String(row[6]), ') ');
		}
		if (row[7] > 0) {
			barInd = '('.concat(String(row[7]), ') ');
		}
		taxon_id = row[1];
		if (row[9]) {
			vernacular = '('.concat(String(row[9]), ') ');
		} else {
			vernacular = '';
		}
		var newNodeValueClass = '';
		if (row[8] != 1) {
			newNodeValueClass = "clr_red";
		}
		newNodeValue = '<span'.concat(' class="', newNodeValueClass, '">', row[0], '</span> ', vernacular, ' <span class="treeview-red">',
			String(row[3]), '</span> / <span class="treeview-orange">', String(row[4]), ' ', collInd, '</span> / ' +
			'<span class="treeview-green">', String(row[5]), ' ', barInd, '</span>');
		newNode = ['<ul id="' + newNodeId + '"'];
		if (row[2] > 1) {
			newNode.push('class="ParentNode_'.concat(rootNodeId, ' childNode"'));
		}
		newNode.push('>');
		newNode.push('<li>');

		nodePrefix = " ", nodeClass = "no_child";
		if (row[8] != 1) {  // rank: 1=leaf node
			nodePrefix = " +  ";
			nodeClass = "closed clr_red";
		}
		newNode.push('<a node="'.concat(newNodeId, '" taxa="', taxon_id, '" onclick="loadTreeview(this)"'));

		if (row[4]) {
			newNode.push(' class="taxa_known"');
			if (row[4] < 9000) {
				arrNode = '<a taxa="'.concat(taxon_id, '" onclick="searchTaxa(this)" caption="', row[0], '" class="taxon_arrow taxa_known" title="Display locations of the taxon in the map"> &#8594</a>');
			}
		}
		newNode.push('>');
		newNode.push('<span id="prefix_'.concat(newNodeId, '" class="', nodeClass, '">', nodePrefix, "</span>", newNodeValue));
		newNode.push('</a>'.concat(arrNode, '</li>'));
		newNode.push('</ul>');
		$rootNode = $('#' + rootNodeId).append(newNode.join(""));
	}

	function showLoadingAnimation() {
		bol_js.loadingOverlay($('#content'), true);
	}

	function hideLoadingAnimation() {
		bol_js.loadingOverlay($('#content'), false);
	}

	/* ============ MAP ============== */
	var source, clusterSource, vectorLayer, selected_color = 0;
	var colors = ['rgba(255, 143, 53, 0.68)', 'rgba(52, 253, 78, 0.68)', 'rgba(52, 136, 253, 0.68)', 'rgba(132, 52, 253, 0.68)', 'rgba(253, 52, 55, 0.68)']

	createFundstellenLayers = function(data, source, searchterm) {
		//console.log("fundstellen set up begin");
		// if source is not addto or first_search delete existing layers
		if (source !== 'addto' && source !== 'first_search') {
		map.getLayers().forEach(function(layer) {
			//If this is actually a group, we need to create an inner loop to go through its individual layers
			if(layer instanceof ol.layer.Group) {
				layer.getLayers().forEach(function() {
					map.removeLayer(layer);
				});
			}
			else if(layer instanceof ol.layer.Vector)
				map.removeLayer(layer);
			});
		}
		if (data.entries.length > 0) {
			console.log('searchterm ', searchterm);
			if ((searchterm === undefined) || (searchterm == '')) {
				console.log('searchterm ', searchterm);
				searchterm = "Search " + (selected_color + 1);
			}
			polygonLayer(data.entries, searchterm);
			selected_color += 1;
		}
		//console.log("fundstellen set up end");
	};

	function transform(lat, lon) {
		//return [lat, lon]
		return ol.proj.transform([lat, lon], 'EPSG:4326', 'EPSG:3857');
	}

	function calc_extend(bounds) {
		var bottomLeft = transform(bounds[1], bounds[0]),
			topRight = transform(bounds[3], bounds[2]);
		return new ol.extent.boundingExtent([bottomLeft, topRight]);
	}

	var raster = new ol.layer.Tile({
		source: new ol.source.OSM()
	});

	map_init =function() {
		var boundsWelt = [-180, -90, 180, 90],
			boundsD = [5.5, 47.0, 15.0, 55.5],
			boundsE = [-10.19, 27.59, 62.93, 74.69];

		map = new ol.Map({
			target: 'map',
			renderer: 'canvas',
			layers: [raster],
			view: new ol.View({
				center: transform(10.2, 49.6),
				zoom: 4
			}),
		});

		bol_js.set_lang($(document.body).attr('data-lang'));
		var layerSwitcher = new ol.control.LayerSwitcher(
			{
				collapsed : false
			}
		);
		map.addControl(layerSwitcher);
		document.getElementById('map_hint').innerHTML = bol_js.sentences('map','click_datapoint');
	};

	function polygonLayer(entries, searchterm) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, "")
		};

		if (entries.length <= 0) {
			return;
		}

		var styleCache = {},
			c, e, i,
			count = entries.length,
			features = [];

		for (i = 0; i < count; i++) {
			e = entries[i];
			if (e.geo_point && e.geo_point.length > 0)
				c = e.geo_point.split(',').map(function(n) {
					return parseFloat(n);
				});
			else
				continue;
			features.push(new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.transform([c[1], c[0]], 'EPSG:4326', 'EPSG:3857')),
				name: e.taxon,
				id: e.id
			}));
		}

		if (features.length === 0) {
			return;
		}

		source = new ol.source.Vector({
			features: features
		});

		clusterSource = new ol.source.Cluster({
			distance: 40,
			source: source
			//projection: ....
			//extend: ...
		});
		vectorLayer = new ol.layer.Vector({
			title: searchterm,
			source: clusterSource,
			style: function (feature) {
				var size = feature.get('features').length;
				var style = styleCache[size];
				if (!style) {
					style = [new ol.style.Style({
						image: new ol.style.Circle({
							radius: 10,
							stroke: new ol.style.Stroke({
								color: '#222',
								width: 1
							}),
							fill: new ol.style.Fill({
								color: colors[selected_color]
							})
						}),
						text: new ol.style.Text({
							text: size.toString(),
							fill: new ol.style.Fill({
								color: '#fff'
							})
						})
					})];
					styleCache[size] = style;
				}
				return style;
			}
		});

		map.addLayer(vectorLayer);

		//var extent = calc_extend(bounds);

		//function calc_extend(bounds) {
		//	var bottomLeft = transform(bounds[1], bounds[0]),
		//		topRight = transform(bounds[3], bounds[2]);
		//	return new ol.extent.boundingExtent([bottomLeft, topRight]);
		//}
		//const vectorLayer = new source.Vector();
		//var extent = vectorLayer.getExtent();
		//extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
		//extent = ol.extent.extend(extent, vectorLayer.getSource().getExtent());
		//extent = vectorLayer.getSource().getExtent();
		//map.getView().fit(extent,{size:map.getSize(), maxZoom:16});
		//map.getView().fit(vectorLayer.getExtent());

		$(map.getViewport()).on('click', function (evt) {
			var pixel = map.getEventPixel(evt.originalEvent);
			displayFeatureInfo(pixel);
		});
	}

	var highlightStyleCache = {};
	var featureOverlay = new ol.layer.Vector({
		source: new ol.source.Vector(),
		map: map,
		style: function (feature) {
			var size = feature.get('features').length;
			if (!highlightStyleCache[text]) {
				highlightStyleCache[text] = [new ol.style.Style({
					image: new ol.style.Circle({
						radius: 10,
						stroke: new ol.style.Stroke({
							color: '#f00',
							width: 1
						}),
						fill: new ol.style.Fill({
							color: 'rgba(255,0,0,0.1)'
						})
					}),
					text: new ol.style.Text({
						text: size.toString(),
						fill: new ol.style.Fill({
							color: '#000'
						}),
						stroke: new ol.style.Stroke({
							color: '#f00',
							width: 3
						})
					})
				})];
			}
			return highlightStyleCache[text];
		}
	});

	var highlight;
	var displayFeatureInfo = function (pixel) {
		var features = [],
			info = {}, f, i, j, n, t = [];
		map.forEachFeatureAtPixel(pixel, function (feature, layer) {
			features.push(feature);
		});
		if (features.length > 0) {
			f = features[0].get('features');  // first layer = datapoints
			for (j = 0; j < f.length; j++) {
				n = f[j].get('name');
				if (!info[n]) {
					info[n] = 0;
				}
				info[n] = info[n] + 1;
			}
			$.each(info, function (key, value) {
				t.push('&nbsp;<div id="details' + i + '" class="popupbutton" onclick="fill_taxondetails_iframe(\'taxondetail\', \'' + key + '\');"></div>&nbsp;' + key + ': ' + value);
			});
		}
		if (t.length > 0) {
			document.getElementById('map_hint').innerHTML = t.join(', ') || '(unknown)';
			if (features[0] != highlight) {
				if (highlight) {
					featureOverlay.getSource().removeFeature(highlight);
				}
				if (features[0]) {
					featureOverlay.getSource().addFeature(features[0]);
				}
				highlight = features[0];
			}
		} else {
			document.getElementById('map_hint').innerHTML = bol_js.sentences('map','click_datapoint');
		}
		features = [], info = {}
	};

	/* ============ Search results ============== */

	createAnzeige = function(data, source) {
		var e, i, j, l = data.tablerowdicts.length,
			id, colname, pagelen = 50, resulttable,
			tabledata = [], tablecolumns = [], tablerow = {},
			idslist = [];

		if (source !== "addto") {
			createTableHeader(data.fields);
		}

		//console.log("data prep begin");
		for (i=0 ; i<l; i++) {
			e = data.tablerowdicts[i];
			tablerow = e;
			tabledata.push(tablerow);
		}
		var idslist = data.idslist
		if (source === 'addto') {
			$('#idslist').append(idslist);
		} else {
			$('#idslist').empty().append(idslist);
		}
		//console.log("data prep end");
		//console.log("table set up begin");

		if (source !== 'addto') {
			//$('#popupdivs').empty().append(popupdivs);
			for ( j=0; j < data.fields.length; j++) {
				// generate array of {data: 'name of column'} objects
				tablecolumns.push({'data': data.fields[j][1]})
			}
		}

		if (source === "addto") {
			i += parseInt($('#viewCounter').text().replace(/[^0-9.]/g, ''), 10);
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
				resulttable = $('#viewTable').DataTable();
				if (paging == true) {
					resulttable.page.len(pagelen).draw();
				}
				resulttable.rows.add(tabledata).draw();
			} else {
				resulttable = $('#viewTable').DataTable({
					'data': tabledata,
					'columns': tablecolumns,
					"deferRender": defrender,
					"pagingType": "full_numbers",
					"scrollX": true,
					"scrollY": 300,
					"scrollCollapse": false,
					"paging": paging,
					"lengthMenu": [10, 50, 100, 500, 1000],
					//wait 800ms before starting a search when something is entered into search field
					"searchDelay": 800,
					"defaultContent": "<i>None</i>",
					'stateSave': true,
					"language": {
						"url": "/static/js/DataTables/" + bol_js.get_lang() + ".txt"
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
			//console.log("table set up end");

			$("#exportButton").show();
			$("#fastaButton").show();
			$("#viewCounter").html(bol_js.sentences('map','no_specimens') + i);
		}
	};

	function createTableHeader(fields) {
		var id, name, j,
			t = '<h2 id="viewCounter">' + bol_js.sentences('map','no_specimens') + '0</h2><div id="resultArea"><table id="viewTable" class="display"><thead><tr>';
		for (j = 0; j < fields.length; j++) {
			id = fields[j][0];
			name = fields[j][1];
			if (id == 27) {  // species name
				t += '<th class="headCol1">' + name + '</th>'
			} else {
				t += '<th class="headCol2">' + name + '</th>'
			}
		}
		t += '</tr></thead><tbody id="viewTableData"></tbody></table></div>';
		document.getElementById("anzeige-content").innerHTML = t
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
					populateIframe("frame1", data.filename)
				}
			},
			error: function (xhr, textStatus, errorThrown) {
				alert(file_error)
			}
		});
	};

	csvExport = function () {
		var file_error = bol_js.sentences('taxon_details','file_error');
		var datadict = {};
		// is there a hidden idslist element?
		var idslist = document.getElementById('idslist').innerHTML;
		if (idslist !== null) {
			datadict = {specimen_ids: idslist};
		}
		else {
			datadict = form.process_search();
		}
		$.ajax({
			url: "/static/csvExport",
			type: 'POST',
			data: datadict,
			dataType: 'json',
			success: function (data) {
				if (!data.success) {
					alert(data.text);
				} else {
					populateIframe("frame1", data.filename)
				}
			},
			error: function (xhr, textStatus, errorThrown) {
				alert(file_error)
			}
		});
	};

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

	speciesDetailsdrawPies = function(data) {
		var div1, div2, div3 = '', count, l = 0, i = 0, k = 0, pie, arr = [], lang, messages = {};
		messages['institute_facet'] = {'de': "Institut", 'en': "Institute"};
		messages['state_facet'] = {'de': "Bundesland", 'en': "State"};
		lang=bol_js.get_lang();
		count = Object.keys(data).length;

		if (count > 0) {
			div1 = "<div id='chart";
			div2 = "' class='chart'></div>";
			for (l; l < count; l++) {
				div3 += div1 + l + div2;
			}
			$('#ChartArea').html(div3);

			for (pie in data) {
				arr = [];
				k = 0;
				for (k; k <= data[pie].length; k=k+2) {
					var temp = [data[pie][k], data[pie][k+1]];
					arr.push(temp);
				}
				$('#chart' + i).jqplot([arr], {
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
				i++;
			}
		} else {
			$('#ChartArea').html('<div id="messageBox">Keine Daten vorhanden</div>');
		}
	};
})();


