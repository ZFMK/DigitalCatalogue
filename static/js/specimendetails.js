


function SpecimenDetails(bol_js, facets, resultloader) {
	this.bol_js = bol_js;
	this.facets = facets;
	this.resultloader = resultloader;
	this.osdviewer = new OSDViewer();
	this.navigationbar = new NavigationBar(this.bol_js, '#specimen_overlay', false);
	//console.log('I am here, specimendetails.js');
}


SpecimenDetails.prototype.setSpecimenDetails = function(specimen_id) {
	var self = this;
	
	// hide the map and statistics from search page
	shrinkCollectionList();
	
	var url = '/specimendetail/' + specimen_id;
	var request = $.ajax({
		url: url,
		method: "GET"
	}).done(function( htmlfragment ) {
		self.close_specimen_overlay();
		self.fillDetailDiv(htmlfragment);
		console.log('setSpecimenDetails', specimen_id);
		
		// need a new resultloader here because the old one caries the map and table of the main page
		// it must be set after the html-fragment is loaded to have the div for taxon_map available
		var querylist = new QueryList();
		self.resultloader = new ResultLoader(self.bol_js, self.facets, querylist, 'specimen_');
		self.resultloader.setRequestParams({'search_term': '"' + specimen_id + '"', 'search_category': '99'});
		
		var taxon = $("#specimen_id").data("taxon");
		self.resultloader.setSpecimenInfo(specimen_id, taxon);
		
	}).fail(function( jqXHR, textStatus ) {
		console.log("################ request to " + url + " failed");
		return "";
	});
	return false;
};


SpecimenDetails.prototype.fillDetailDiv = function(htmlfragment) {
	var self = this;
	var detaildiv = $('#specimen_overlay');
	detaildiv.html(htmlfragment);
	detaildiv.removeClass('hidden');
	//initNavigationBarHandler(); must be called every time an overlay is set up because it contains the $( window ).resize() handler 
	// that is deleted when the overlay is closed
	self.navigationbar.initNavigationBarHandler();
	$('#specimen_overlay #backbutton').click( function() {
		$('#specimen_overlay .osdviewer').remove();
		self.close_specimen_overlay();
		// TODO: move it into globally available method
		growCollectionList();
	});
	if (detaildiv.width() <= 1000) {
		self.navigationbar.setNavigationBar();
	}
	self.osdviewer.getImageUrl();
	init_galleries();
	//$(document).scrollTop($('#specimendetails').offset().top -20);
}


SpecimenDetails.prototype.close_specimen_overlay = function() {
	var self = this;
	// close all overlays to prevent a stack of overlays
	var detaildiv = $('.detail_overlay');
	self.navigationbar.removeNavigationBar();
	$( window ).off('resize');
	detaildiv.empty();
}



/*
SpecimenDetails.prototype.initNavigationBarHandler = function() {
	var self = this;
	var detaildiv = $('#specimen_overlay');
	$( window ).resize(function () {
		if (detaildiv.width() <= 1400) {
			//console.log("smaller", detaildiv.width());
			self.setNavigationBar();
		}
		if (detaildiv.width() > 1400) {
			self.removeNavigationBar();
		}
	});
	
}

SpecimenDetails.prototype.setNavigationBar = function() {
	var self = this;
	if ($('#specimen_detail_navigation').length < 1) {
		$('#main').prepend('<div id="specimen_detail_navigation"></div>');
		$('#specimen_detail_navigation').append('<span><a href="#" id="navibar_close_button">' + self.bol_js.sentences('closebutton', 'close') + '</a></span>')
		$('#navibar_close_button').click( function () {self.close_specimen_overlay();});
		$('#specimendetails .detailbox').each( function () {
			console.log('here');
			var headline_id = $(this).attr('id');
			if (headline_id != undefined) {
				if (!$(this).hasClass('hidden')) {
					$('#specimen_detail_navigation').append('<span><a href="#' + headline_id + '">' + headline_id + '</a></span>');
				}
			}
		});
	}
}

SpecimenDetails.prototype.removeNavigationBar = function() {
	var self = this;
	//$( window ).off('resize');
	if ($('#specimen_detail_navigation').length > 0) {
		$('#specimen_detail_navigation').remove();
	}
}
*/
