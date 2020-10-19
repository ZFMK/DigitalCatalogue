
function OSDViewerLists() {
	this.viewerlists = [];
}


OSDViewerLists.prototype.addViewerList = function(viewerlist) {
	var self = this;
	console.log('adding a list of osd viewers');
	self.viewerlists.push(viewerlist)
};


OSDViewerLists.prototype.removeOldViewerLists = function() {
	var self = this;
	var newlists = []
	var lastlist = null;
	if (self.viewerlists.length > 0) {
		lastlist = self.viewerlists.pop();
		while (self.viewerlists.length > 0) {
			var viewerlist = self.viewerlists.pop();
			if (viewerlist.getLoadComplete() === true) {
				viewerlist.removeOldViewers();
				delete viewerlist;
			}
			else {
				newlists.push(viewerlist);
			}
		}
		newlists.push(lastlist);
		self.viewerlists = newlists;
	}
};




