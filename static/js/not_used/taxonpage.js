"use strict";



$(document).ready( function () {
	var bol_js = new BOL($(document.body).attr('data-lang'));
	var resulttable = new ResultTable(bol_js);
	var resultmap = new ResultMap(bol_js);
	var taxon = $('#taxon_name').data("taxon");
	setTaxonPage(bol_js, resulttable, resultmap, taxon);
	console.log('I am here, taxonpage.js');
});



function setTaxonPage(bol_js, resulttable, resultmap, taxon) {
	console.log('setTaxonPage', taxon);
	
	// called by taxondetail.pt to set map and some details for the TaxonDetailPage
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
			data['facets'] = data.entries.facet_counts;
			data['result_docs'] = data.entries.response.docs;
			var ol_title = "";
			if (data['result_docs'][0]['tax_species']) {
				ol_title = data['result_docs'][0]['tax_species'];
			}
			resultmap.createFundstellenLayers(data, '', ol_title);
			var tax = bol_js.sentences('taxon_details','tax');
			$('#taxonomy').empty().append("<h2>" + tax + ": " + data['taxonomy'] + "</h2>");
			resulttable.createAnzeige(data, "setTaxonPage"); // source must not be undefined
			//resulttable.createResultTableWithPages(data); // div for page buttons is missing
			if ((data['facets'] != 0) && (data['facets'] != undefined)) {
				self.taxonDetailsdrawPies(bol_js, data['facets']['facet_fields']);
			}
		}
	});
	return false;
};

function taxonDetailsdrawPies(bol_js, data) {
	var div1, div2, div3 = '', count, l = 0, i = 0, k = 0, pie, arr = [], lang, messages = {};
	messages['collection_facet'] = {'de': "Sammlung", 'en': "Collection"};
	messages['country_facet'] = {'de': "Land", 'en': "Country"};
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




