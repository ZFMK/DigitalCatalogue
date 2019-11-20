/* Javascript to handle the overlay for taxon and specimen details
*/



fill_taxondetails_iframe = function(source, taxon) {
	// empty the iframe first, bad to use jquery here and javascript below
	var detaildiv = $('#Detaildiv');
	detaildiv.html('<iframe id="Detail" scrolling="no"></iframe>');
	
	
	var iframediv = document.getElementById('Detaildiv');
	var iframe = document.getElementById('Detail');
	// when the event handler was called from within the taxonDetailPage 
	// there is no Detaildiv at this level but on the result page it was called from
	if (iframe === null) {
		iframediv = window.parent.document.getElementById('Detaildiv');
		iframe = window.parent.document.getElementById('Detail');
	}
	iframe.src = '/' + source + '/' + taxon + "?viewtarget=iframe";
	iframediv.classList.remove("hidden");
	iframediv.style.zIndex='999';
	
	
			// recalculate the size of the iframe
			var myiframe = $('html');
			console.log(myiframe);
			var newheight = myiframe.prop("scrollHeight");
			console.log("height: ", newheight);
			var myiframediv = $('#Detail');
			myiframediv.css("height", newheight + 200);
			//console.log("height: ", newheight);
	
	
};

close_iframe = function() {
	var iframediv = parent.document.getElementById('Detaildiv');
	iframediv.classList.add("hidden");
	//iframediv.style.zIndex='-1';
	
};

