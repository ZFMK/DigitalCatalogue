'use strict';

/* handle the list of applied filters in #chosenfacets
 * use it to get the facets for requests and to maintain the facets that have been clicked in the list of 
 * available filters (#filter_box) or by url parameters
*/

function AppliedFacets(searchformhandler) {
	this.searchformhandler = searchformhandler;
	this.facetslist = [];
	console.log('AppliedFacets!!');
	this.readFacetsList();
	this.writeFacetsList();
	this.updateChosenFacetsEvents();
}

AppliedFacets.prototype.readFacetsList = function () {
	var self = this;
	self.facetslist = [];
	$('#chosenfacets li.select-item').each( function () {
		var name = $(this).data('facetname');
		var title = $(this).data('facettitle');
		var value = $(this).data('facetvalue');
		self.facetslist.push({'name': name, 'title': title, 'value': value});
	});
}

AppliedFacets.prototype.getFacetsList = function () {
	var self = this;
	self.readFacetsList();
	return self.facetslist;
}

AppliedFacets.prototype.getFacetsJSONString = function () {
	// get the json string used for ajax request in startSearch()
	var self = this;
	self.readFacetsList();
	var facetsdict = {};
	for (var i=0; i<self.facetslist.length; i++) {
		var name = self.facetslist[i]['name'];
		var value = self.facetslist[i]['value'];
		if (facetsdict[name] == undefined) {
			facetsdict[name] = [];
		}
		facetsdict[name].push(value);
	}
	
	var facetsstring = '{}';
	try {
		facetsstring = JSON.stringify(facetsdict);
	}
	catch(error) {
		// do nothing
	}
	console.log(facetsstring);
	return facetsstring;
}

AppliedFacets.prototype.addFacet = function (name, title, value) {
	var self = this;
	var facetdict = {'name': name, 'title': title, 'value': value};
	if (!self.facetExists(name, value)) {
		self.facetslist.push(facetdict);
	}
	console.log('addFacet', self.facetslist);
	self.writeFacetsList();
}

AppliedFacets.prototype.setFacets = function (facetslist) {
	var self = this;
	self.facetslist = [];
	for (var i=0; i<facetslist.length; i++) {
		if (facetslist[i]['name'] && facetslist[i]['title'] && facetslist[i]['value']) {
			if (!self.facetExists(facetslist[i]['name'], facetslist[i]['value'])) {
				self.facetslist.push(facetslist[i]);
			}
		}
	}
	self.writeFacetsList();
}

AppliedFacets.prototype.facetExists = function (name, value) {
	// shouldn't there be a dictionary that can be easily searched for existing facets? 
	// but this will result in doubled structures for holding the facet data again
	var self = this;
	var exists = false;
	for (var i=0; i<self.facetslist.length; i++) {
		if (self.facetslist[i]['name'] == name && self.facetslist[i]['value'] == value) {
			exists = true;
		}
	}
	return exists;
}


AppliedFacets.prototype.writeFacetsList = function () {
	var self = this;
	$('#chosenfacets').empty();
	for (var i=0; i<self.facetslist.length; i++) {
		var name = self.facetslist[i]['name'];
		var title = self.facetslist[i]['title'];
		var value = self.facetslist[i]['value'];
		$('#chosenfacets').append('<li class="select-item ' + name + '" data-facetname="' + name + '" data-facettitle="' + title + '" data-facetvalue="' + value + '">' + title + ': ' + value + '</li>');
	}
	if (self.facetslist.length > 0) {
		$('#applied_filters>p.warning').hide();
	}
	else {
		$('#applied_filters>p.warning').show();
	}
	self.updateChosenFacetsEvents();
}




AppliedFacets.prototype.updateChosenFacetsEvents = function () {
	var self = this;
	var name;
	var value
	$("#chosenfacets li.select-item").each( function () {
		$(this).off('click');
		$(this).click( function(event){
			name = $(this).data('facetname');
			value = $(this).data('facetvalue');
			console.log('facet name, value: ', name, value);
			self.removeFacet(event, name, value);
			startSearch();
			self.searchformhandler.loadFiltersForm();
		});
	});
}



AppliedFacets.prototype.removeFacet = function(event, name, value) {
	var self = this;
	
	$(event.target).remove();
	self.readFacetsList();
	self.writeFacetsList();
	
	if ($('#chosenfacets li.select-item').length < 1) {
		$('#applied_filters>p.warning').show();
	}
};

