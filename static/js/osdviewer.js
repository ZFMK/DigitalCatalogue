
function OSDViewer() {
	//this.serviceUrl = "https://fredie.eu/deepzoom/api/getDzi?imageUrl=";
	this.serviceUrl = "https://physalia.evolution.uni-bonn.de/deepzoom/api/getDzi?imageUrl=";
	this.callbackString = "&callback=?";
	//console.log('I am here, osdviewer.js');
}


OSDViewer.prototype.getImageUrl = function(){
	var self = this;
	var viewer_id = "osd";
	var imageUrl = "https://physalia.evolution.uni-bonn.de/dumping/ZFMK/ZFMK_3.jpg";

	$("a.dz_image_url").each(function(){
		imageUrl = $(this).attr("href");

		if (imageUrl.substr(0, 28) == "https://media.zfmk.de/eaurls") {
			// add an url parameter that requests the biggest format in 8bit
			// this is another hack, eaurls now looks for the available images in sizes 'small', 
			imageUrl = imageUrl + "?preferredsize=biggest"
		}

		imageUrl = encodeURIComponent(imageUrl);
		// TODO: selecting the previous element requires that the .osdviewer div is exactly before the link to the image
		// needs to be changed
		viewer_id = $(this).prev(".osdviewer").attr("id");
		//console.log($(this).attr("class"), viewer_id)
		self.deepZoomService(viewer_id, imageUrl);
		//return false;
	});
}


OSDViewer.prototype.deepZoomService = function(viewer_id, imageUrl){
	var self = this;
	var url = self.serviceUrl + imageUrl + self.callbackString;
	var base_url = window.location.origin;
	var viewer = null;
	var tileSourcesFn;
	console.log(url);

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
		}
	});
}

