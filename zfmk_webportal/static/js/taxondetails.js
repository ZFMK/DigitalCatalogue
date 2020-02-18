



function TaxonDetails(bol_js, facets, resultloader) {
	this.bol_js = bol_js;
	this.facets = facets;
	this.resultloader = resultloader;
	this.osdviewer = new OSDViewer();
	this.navigationbar = new NavigationBar(this.bol_js, '#taxon_overlay', false);
	//console.log('I am here, taxondetails.js');
}


TaxonDetails.prototype.setTaxonDetails = function(taxon) {
	var self = this;
	
	// hide the map and statistics from search page
	shrinkResultTable();
	
	var url = '/taxondetail/' + taxon;
	var request = $.ajax({
		url: url,
		method: "GET"
	}).done(function( htmlfragment ) {
		self.close_taxon_overlay();
		self.fillDetailDiv(htmlfragment);
		console.log('setTaxonDetails', taxon);
		//self.resultloader.setDivIDPrefix('taxon_');
		
		// need a new resultloader here because the old one caries the map and table of the main page
		// it must be set after the html-fragment is loaded to have the div for taxon_map available
		var querylist = new QueryList();
		self.resultloader = new ResultLoader(self.bol_js, self.facets, querylist, 'taxon_');
		self.resultloader.setRequestParams({'search_term': '"' + taxon + '"', 'search_category': '10'});
		self.resultloader.loadHtmlTable(1, 1000);
		
		self.resultloader.setTaxonInfo(taxon);
		
		$('#taxon_exportButton').click(function() {
			csvExport([{'name': 'search_term', 'value': '"' + taxon + '"'}, {'name': 'search_category', 'value': '10'}]);
		});
	}).fail(function( jqXHR, textStatus ) {
		console.log("################ request to " + url + " failed");
		return "";
	});
	return false;
};


TaxonDetails.prototype.fillDetailDiv = function(htmlfragment) {
	var self = this;
	var detaildiv = $('#taxon_overlay');
	detaildiv.html(htmlfragment);
	detaildiv.removeClass('hidden');
	//initNavigationBarHandler(); must be called every time an overlay is set up because it contains the $( window ).resize() handler 
	// that is deleted when the overlay is closed
	self.navigationbar.initNavigationBarHandler();
	$('#taxon_overlay #backbutton').click( function() {
		self.close_taxon_overlay();
		growResultTable();
	});
	if (detaildiv.width() <= 1000) {
		self.navigationbar.setNavigationBar();
	}
	self.osdviewer.getImageUrl();
	init_galleries();
	//$(document).scrollTop($('#taxondetails').offset().top -20);
}


TaxonDetails.prototype.close_taxon_overlay = function() {
	var self = this;
	// close all overlays to prevent a stack of overlays
	var detaildiv = $('.detail_overlay');
	self.navigationbar.removeNavigationBar();
	$( window ).off('resize');
	detaildiv.empty();
}



