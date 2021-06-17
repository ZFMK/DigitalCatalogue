


function ResultMap(bol_js, id_prefix, no_init) {
	this.bol_js = bol_js;
	this.target = "map";
	this.id_prefix = '';
	if (id_prefix != undefined) {
		this.id_prefix = id_prefix;
		this.target = this.id_prefix + 'map';
	}
	this.colors = ['rgba(255, 143, 53, 0.68)',
					'rgba(52, 253, 78, 0.68)',
					'rgba(52, 136, 253, 0.68)',
					'rgba(132, 52, 253, 0.68)',
					'rgba(253, 52, 55, 0.68)'];
	this.clusterSource = {};
	this.vectorLayer = {};
	this.selected_color = 0;
	this.number_of_searches = 0;
	this.raster = {};
	this.map = {};
	this.layerSwitcher = {};
	this.featureOverlay = {};
	var extent = [-180, -90, 180, 90];
	this.featureextent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:4326'), ol.proj.get('EPSG:3857'));
	if (no_init != true) {
		this.initMap();
	}
}



ResultMap.prototype.initMap = function() {
	var self = this;

	self.raster = new ol.layer.Tile({
		source: new ol.source.OSM()
	});

	self.map = new ol.Map({
		target: self.target,
		renderer: 'canvas',
		layers: [self.raster],
		view: new ol.View({
			center: self.transform(10.2, 49.6),
			zoom: 4
		}),
	});

	self.bol_js.set_lang($(document.body).attr('data-lang'));
	//console.log('target: ', self.target);
	//console.log($('#' + self.target).length);
	
	// removed the layer control, as it is not needed as long as stored queries are not available
	/*
	self.layerSwitcher = new ol.control.LayerSwitcher(
		{
			collapsed : false
		}
	);
	self.map.addControl(self.layerSwitcher);
	*/
	
	$('#' + self.id_prefix + 'map_hint').html(self.bol_js.sentences('map','click_datapoint'));
	
	self.setFeatureOverlay();
	

};


ResultMap.prototype.createFundstellenLayers = function(data, source, searchterm) {
	var self = this;
	//console.log('createFundstellen');
	// always delete the clicked taxon points when reloading the map
	$('#' + self.id_prefix +'map_hint').html(self.bol_js.sentences('map','click_datapoint'));
	
	// if source is not addto or first_search delete existing layers
	if (source !== 'addto' && source !== 'first_search') {
		self.map.getLayers().forEach(function(layer) {
		//If this is actually a group, we need to create an inner loop to go through its individual layers
		if(layer instanceof ol.layer.Group) {
			layer.getLayers().forEach(function() {
				self.map.removeLayer(layer);
			});
		}
		else if(layer instanceof ol.layer.Vector)
			self.map.removeLayer(layer);
		});
	}
	if (data.result_docs.length > 0) {
		self.number_of_searches+= 1;
		if ((searchterm === undefined) || (searchterm == '')) {
			searchterm = "Search " + (self.number_of_searches);
		}
		self.polygonLayer(data.result_docs, searchterm);
		if (self.selected_color >= 4) {
			self.selected_color = 0;
		}
		self.selected_color += 1;
	}
};


ResultMap.prototype.transform = function (lat, lon) {
	return ol.proj.transform([lat, lon], 'EPSG:4326', 'EPSG:3857');
};


ResultMap.prototype.polygonLayer = function(result_docs, searchterm) {
	var self = this;
	
	var styleCache = {};
	var c, e, i;
	var features = [];


	for (i = 0; i < result_docs.length; i++) {
		e = result_docs[i];
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

	if (features.length <= 0) {
		return;
	}

	source = new ol.source.Vector({
		features: features
	});

	self.clusterSource = new ol.source.Cluster({
		distance: 40,
		source: source
		//projection: ....
		//extend: ...
	});
	
	vectorLayer = new ol.layer.Vector({
		title: searchterm,
		source: self.clusterSource,
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
							color: self.colors[self.selected_color]
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

	self.map.addLayer(vectorLayer);
	self.setFeatureExtent(features);
	self.map.getView().fit(self.featureextent);

	$(self.map.getViewport()).on('click', function (evt) {
		var pixel = self.map.getEventPixel(evt.originalEvent);
		self.displayFeatureInfo(pixel);
	});
}


ResultMap.prototype.setFeatureExtent = function(features) {
	var self = this;
	if (features.length > 0) {
		var extent = features[0].getGeometry().getExtent().slice(0);
		if (features.length == 1) {
			extent = [extent[0] -200000, extent[1] -200000, extent[2] +200000, extent[3] +200000];
		}
		if (features.length > 1) {
			features.forEach( function(feature) {
				ol.extent.extend(extent, feature.getGeometry().getExtent());
			});
			extent = [extent[0] -20000, extent[1] -20000, extent[2] +20000, extent[3] +20000];
		}
		self.featureextent = extent;
	}
}



ResultMap.prototype.setFeatureOverlay = function() {
	var self = this;
	var highlightStyleCache = {};
	var text;
	
	self.featureOverlay = new ol.layer.Vector({
		source: new ol.source.Vector(),
		map: self.map,
		style: function (feature) {
			var size = feature.get('features').length;
			// hightlight does not really work
			/*
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
			*/
		}
	});
};





ResultMap.prototype.displayFeatureInfo = function (pixel) {
	var self = this;
	var highlight;
	var features = [];
	var info = {};
	var f, i, j, n, t = [];
	
	self.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
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
			t.push('&nbsp;<div id="details' + i + '" class="popupbutton" onclick="taxondetails.setTaxonDetails(\'' + key + '\');"></div>&nbsp;' + key + ': ' + value);
		});
	}
	if (t.length > 0) {
		$('#' + self.id_prefix +'map_hint').html(t.join(', ') || '(unknown)');
		/*
		if (features[0] != highlight) {
			if (highlight) {
				self.featureOverlay.getSource().removeFeature(highlight);
			}
			if (features[0]) {
				self.featureOverlay.getSource().addFeature(features[0]);
			}
			highlight = features[0];
		}
		*/
	} else {
		$('#' + self.id_prefix +'map_hint').html(self.bol_js.sentences('map','click_datapoint'));
	}
	// features = [], info = {};
};
 

/*
// there is no event for css display none, block etc. changes, thus this does not work
ResultMap.prototype.eventUpdateResultMap = function() {
	var self = this;
	$('#results_map').show( function () {
		self.map.updateSize();
	});
}
*/
