

// the only reason for this script is to set the open layers map
// and to set the taxonomy string
// needs to get the data for map


$(document).ready(function() {
	var bol_js = new BOL($(document.body).attr('data-lang'));
	var resultmap = new ResultMap(bol_js);
	var osdviewer = new OSDViewer();
	var id = $("#specimen_id").data("specimen_id");
	var taxon = $("#specimen_id").data("taxon");
	setSpecimenPage(resultmap, bol_js, id, taxon);
	osdviewer.getImageUrl();
});



setSpecimenPage = function(resultmap, bol_js, id, taxon) {
	// called by specimendetail.pt to set map and some details for the SpecimenDetailPage
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
			data['result_docs'] = data.entries.response.docs;
			var ol_title = "";
			if (data['result_docs'][0]['tax_species']) {
				ol_title = data['result_docs'][0]['tax_species'];
			}
			resultmap.createFundstellenLayers(data, '', ol_title);
			var tax = bol_js.sentences('taxon_details','tax');
			$('#taxonomy').empty().append("<h2>" + tax + ": " + data['taxonomy'] + "</h2>");
		}
	});
	return false;
};




