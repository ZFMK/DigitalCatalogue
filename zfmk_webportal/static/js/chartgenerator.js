function ChartGenerator() {
	this.messages = {
		'collection_facet': {'de': "Sammlung", 'en': "Collection"},
		'country_facet': {'de': "Land", 'en': "Country"},
		'completeness_level': {'de': "Vollständigkeit der Datensätze [%]", 'en': "Completeness of data records [%]"},
		'media_types':{'de': "Vorhandene Medien", 'en': "Available media"}
	};
}


ChartGenerator.prototype.createPieChart = function(data, pie, lang, i) {
	var self = this;
	var k; 
	var arr = [];
	
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
	
	$('#' + self.id_prefix + 'ChartArea' + ' #' + self.id_prefix + 'chart' + i).jqplot([arr], {
		title: self.messages[pie][lang],
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




