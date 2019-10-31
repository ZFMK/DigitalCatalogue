



function TaxonDetails(facets) {
	this.facets = facets;
	console.log('I am here, taxondetails.js');
}


TaxonDetails.prototype.setTaxonDetails = function(taxon) {
	var self = this;
	console.log('setTaxonDetails', taxon);
	self.facets.clearFacets(reload_filters = false);
	self.facets.setSearchInput('"' + taxon + '"', '10');
	startSearch();
	console.log('calling loadFiltersForm');
	self.facets.loadFiltersForm();

	return false;
};




TaxonDetails.prototype.setTaxonomy = function() {
	var self = this;
	//$('#taxonomy').empty().append("<h2>" + tax + ": " + data['taxonomy'] + "</h2>");
	
}


