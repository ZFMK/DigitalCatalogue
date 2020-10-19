
function OSDViewer() {
	this.serviceUrl = "https://fredie.eu/deepzoom/api/getDzi?imageUrl=";
	//this.serviceUrl = "https://physalia.evolution.uni-bonn.de/deepzoom/api/getDzi?imageUrl=";
	this.callbackString = "&callback=?";
	this.parallelrequests = 4;
	this.requestcount = 0;
	this.imageindex = 0;
	this.urllist = [];
	this.intervaltime = 50;
	this.loadrequesttimer = null;
	this.loadcomplete = false;
	//console.log('I am here, osdviewer.js');
	this.viewerslist = [];
}


OSDViewer.prototype.removeOldViewers = function() {
	var self = this;
	console.log('########### Try to remove', self.viewerslist.length);
	for (i=0; i<self.viewerslist.length; i++) {
		console.log('remove a viewer');
		self.viewerslist[i].destroy();
	}
	self.viewerslist = [];
};


OSDViewer.prototype.getLoadComplete = function() {
	var self = this;
	return self.loadcomplete;
}



OSDViewer.prototype.getImageUrl = function(){
	var self = this;
	var viewer_id = "osd";
	var imageUrl = "https://physalia.evolution.uni-bonn.de/dumping/ZFMK/ZFMK_3.jpg";
	
	
	//self.removeOldViewers();
	console.log('############## OSDViewer.getImageUrl');

	$("a.dz_image_url").each(function(){
		imageUrl = $(this).attr("href");

		if (imageUrl.substr(0, 28) == "https://media.zfmk.de/eaurls") {
			// add an url parameter that requests the biggest format in 8bit
			// this is another hack, eaurls now looks for the available images in sizes 'small', 
			imageUrl = imageUrl + "?preferredsize=biggest"
		}
		
		viewer_id = $(this).prev(".osdviewer").attr("id");
		
		self.urllist.push([imageUrl, viewer_id]); 
	});
	
	self.loadrequesttimer = setInterval(function () { self.parallelLoader()}, self.intervaltime);
}


OSDViewer.prototype.parallelLoader = function() {
	var self = this;
	self.loadcomplete = false;
	//console.log(self.imageindex, self.requestcount);
	if ((self.imageindex < self.urllist.length) && (self.requestcount < self.parallelrequests)) {
		self.requestcount++;
		imageUrl = encodeURIComponent(self.urllist[self.imageindex][0]);
		viewer_id = self.urllist[self.imageindex][1];
		self.deepZoomService(viewer_id, imageUrl);
		self.imageindex++;
	}
	else if (self.imageindex == self.urllist.length) {
		clearInterval(self.loadrequesttimer);
		self.imageindex = 0;
		self.requestcount = 0;
		self.urllist = [];
		self.loadcomplete = true;
		//console.log('request timer stopped');
	}
	
}


OSDViewer.prototype.deepZoomService = function(viewer_id, imageUrl){
	var self = this;
	var url = self.serviceUrl + imageUrl + self.callbackString;
	var base_url = window.location.origin;
	var viewer = null;
	var tileSourcesFn;
	//console.log(url);

	$.getJSON(url, function(json){
		tileSourcesFn = json;
		// test if the image has been found and read
		if (tileSourcesFn.Size != undefined) {
			viewer = OpenSeadragon({
				id: viewer_id,
				prefixUrl: base_url + "/static/js/openseadragon-bin-2.3.1/images/",
				defaultZoomLevel: 0,
				minZoomLevel: 0.4,
				maxZoomLevel: 8,
				tileSources: {
					Image: {
						xmlns: "http://schemas.microsoft.com/deepzoom/2008",
						Url: tileSourcesFn.Url + "/",
						Format:   tileSourcesFn.Format, 
						Overlap:  tileSourcesFn.Overlap, 
						TileSize: tileSourcesFn.TileSize,
						Size: {
							Height: tileSourcesFn.Size.Height,
							Width:  tileSourcesFn.Size.Width
						}
					}
				},
				showNavigator: false,
			});
			self.viewerslist.push(viewer);
			//console.log('####### viewer added', self.viewerslist.length);
		}
	})
	.complete (function () {
		self.requestcount--;
		//console.log('request complete');
	});
	/*
	.fail (function () {
		self.requestcount--;
	});
	*/
}

