
/* === Facet object === */

/* Object that reads the selected filters from list under #chosenfacets
 * Provides overlays to select facets when "more" link is clicked
 * sets the facets form when list is updated 
 */


/* === Facet object === */
Facets = function() {
	// the object that maintains the entries in the list of chosen facets
	this.chosenfacets = new AppliedFacets(this);
	
	this.bol_js = new BOL($(document.body).attr('data-lang'));
	
	// form containig all filters is first loaded by viewsCollectionList, that gathers the filter data and load them with filter.pt template
	// therefore it is not loaded via loadFiltersForm here (should it be changed to have the same pathway all the time?)
	this.addEventUpdateFilters();
	this.addEventStartSearch();
};


Facets.prototype.readSearchParams = function() {
	console.log('readSearchParams');
	var self = this;
	// read all data from input fields in form #search_form
	// serializeArray() reads all input fields that have a name attribute, 
	// the result is a list with dictionaries: {name: 'a', value: 'b'}, {name: 'b', value: 'c'}
	// the array contains the inputs for search_term and search_category, too
	searchparams = [];
	searchparams = $('#search_form').serializeArray();
	console.log('serializedArray ', self.elements);
	
	// read the data from #chosen_facets list and put them into a json string
	var facetsstring = self.chosenfacets.getFacetsJSONString();
	if (facetsstring && facetsstring.length > 3) {
		searchparams.push({'name': 'filters', 'value': facetsstring});
	}
	return searchparams;
};

Facets.prototype.loadFiltersForm = function() {
	var self=this;
	var form_elements;

	form_elements = self.readSearchParams();
	console.log('loadFiltersForm: ', form_elements);

	$.ajax({
		url: "/static/load_facet_form",
		type: 'POST',
		dataType: 'html',
		data: form_elements
	}).done(function(data){
		$('#filter_wrapper').html(data);
		self.addEventUpdateFilters();
		self.addEventStartSearch();
	});
};

Facets.prototype.addEventUpdateFilters = function() {
	// adding the event handlers to facets in lists for different filters
	var self = this;
	console.log('addEventUpdateFilters');

	$('#filter ul li.facetdiv').off('click');
	$('#filter ul li.facetdiv').on('click', function(event){
		self.chosenfacets.addFacet($(this).closest('div').data('key'), $(this).closest('div').data('title'), $(this).data('value'));
		self.loadFiltersForm();
	});
	
	$('#filter ul li.opener').off('click');
	$('#filter ul li.opener').on('click', function(event){
		self.get_more({'key': $(this).closest('div').data('key'),'title': $(this).closest('div').data('title')})
	});
};


Facets.prototype.addEventStartSearch = function() {
	// adding the event handlers to facets in lists for different filters
	var self = this;
	// do not call startSearch when the 'more' link is pressed in a filter box
	$('#filter ul li ').not('.opener').click(function () {
		startSearch();
	});
	$('#search_button').off('click');
	$('#search_button').click(function () {
		self.loadFiltersForm();
	});
};


Facets.prototype.clearFacets = function (reload_filters) {
	if (reload_filters == undefined) {
		reload_filters = true;
	}
	var self = this;
	self.chosenfacets.setFacets([]);
	if (reload_filters == true) {
		self.loadFiltersForm();
	}
}


Facets.prototype.clearSearchTerm = function (reload_filters) {
	if (reload_filters == undefined) {
		reload_filters = true;
	}
	var self = this;
	$('#search_term').val('');
	if (reload_filters == true) {
		self.loadFiltersForm();
	}
}

Facets.prototype.setSearchInput = function(search_term, search_category) {
	$('#search_term').val(search_term);
	$('#search_category').val(search_category);
}

Facets.prototype.get_more = function (facetdict) {
	var self=this,
		form_elements=self.readSearchParams(),
		key = facetdict['key'],
		title = facetdict['title'],
		$dialog;
	form_elements.push({'name': 'facet_field', 'value': key});

	$.ajax({
		url: "/static/facet_get_more",
		type: 'POST',
		dataType: 'html',
		data: form_elements
	}).done(function (text) {
		if (text.length>0) {
			$dialog = $(text).dialog({
				width: 700,
				modal: true,
				dialogClass: 'facet-dialog',
				closeText: false,
				title: title,
				clickOutside: true, // clicking outside the dialog will close it
				clickOutsideTrigger: ".opener",  // Element (id or class) that triggers the dialog opening
				open:function(event) {
					$(this).css("max-height", "300px");
				},
				close: function() {
					self.addEventStartSearch();
					startSearch();
				}
			});
			$('ul', $dialog).on('click', function(event){
				if (event.target.tagName=='LI') {
					self.chosenfacets.addFacet(key, title, $(event.target).data('value'));
					self.loadFiltersForm();
				}
			});
			$('button.sort-button.alpha', $dialog).on('click', function(event){
				self.alphSort(this);
			});
			$('button.sort-button.number', $dialog).on('click', function(event){
				self.numSort(this);
			});
		}
	});
};

Facets.prototype.numSort = function (el) {
	var $parent = $(el).closest('div.morefacets').find('ul'),
		$entries = $parent.find("li.facetdivol");
	var sorted = $entries.sort(function(a, b) {
		return parseInt($(b).data("count"),10) - parseInt($(a).data("count"),10);
	});
	$parent.html(sorted);
};

Facets.prototype.alphSort = function (el) {
	var $parent = $(el).closest('div.morefacets').find('ul'),
		$entries = $parent.find("li.facetdivol");
	var sorted = $entries.sort(function (a, b) {
		return (b.innerHTML) < (a.innerHTML) ? 1 : -1;
	});
	$parent.html(sorted);
};



