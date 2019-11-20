


function TaxonTree(facets) {
	this.rows = [];
	this.facets = facets;
	//this.resultloader = resultloader;
};




TaxonTree.prototype.createTreeView = function(rows) {
	var self = this;
	self.rows = rows;
	for (var i = 0; i < self.rows.length; i++) {
		self.addNode(self.rows[i]);
	}
}

TaxonTree.prototype.loadTreeview = function (element) {
	var self = this;
	var childid = ".ParentNode_" + $(element).attr('node');
	if ($(childid).css("display") == "none") {
		$(childid).css("display", "block");
	} else {
		$(childid).css("display", "none");
	}

	var prefix = document.getElementById("prefix_" + $(element).attr('node'));
	if ($(prefix).hasClass("closed")) {
		prefix.innerHTML = " - ";
		prefix.className = "expanded";
	} else if ($(prefix).hasClass("expanded")) {
		prefix.innerHTML = " + ";
		prefix.className = "closed";
	}

	if ($(element).hasClass("clicked")) {
		return;
	}
	$.ajax({
		url: "/static/loadTreeView",
		type: 'POST',
		dataType: 'json',
		data: {nodeid: $(element).attr('taxon_id')}
	}).done(function(data){
		if (!data.success) {
			alert(data.text);
		} else {
			self.createTreeView(data.entries);
		}
	}).fail(function(xhr, textStatus, errorThrown){
		alert(textStatus);
	});
	$(element).addClass("clicked");
};



TaxonTree.prototype.addNode = function(row) {
	var self = this;
	// ["Animalia",  1,		 2,	 3,		 4,	  5,					  6,				   7,	8, 9]
	// taxon	  , id, parent_id, known, collected, barcode, collected_individuals, barcode_individuals, rank, vernacular
	var rootNodeId, newNode = new Array(), newNodeId, newNodeValue, nodePrefix, nodeClass, arrNode = '',
		collInd = '', barInd = '',
		taxon_id, vernacular;
	if (row[2] == 1) {
		rootNodeId = "Node_Root";
	} else {
		rootNodeId = "Node_" + row[2];
	}
	newNodeId = "Node_" + row[1];
	if (row[4] > 0) {
		collInd = '('.concat(String(row[6]), ') ');
	}
	if (row[7] > 0) {
		barInd = '('.concat(String(row[7]), ') ');
	}
	taxon_id = row[1];
	if (row[9]) {
		vernacular = '('.concat(String(row[9]), ') ');
	} else {
		vernacular = '';
	}
	var newNodeValueClass = '';
	if (row[8] != 1) {
		newNodeValueClass = "clr_red";
	}
	newNodeValue = '<span'.concat(' class="', newNodeValueClass, '">', row[0], '</span> ', '</span> / <span class="treeview-orange">', String(row[4]), ' ', collInd, '</span> / ' +
		'<span class="treeview-green">', String(row[5]), ' ', barInd, '</span>');
	newNode = ['<ul id="' + newNodeId + '"'];
	if (row[2] > 1) {
		newNode.push('class="ParentNode_'.concat(rootNodeId, ' childNode"'));
	}
	newNode.push('>');
	newNode.push('<li>');

	nodePrefix = " ", nodeClass = "no_child";
	if (row[8] != 1) {  // rank: 1=leaf node
		nodePrefix = " +  ";
		nodeClass = "closed clr_red";
	}
	newNode.push('<a node="'.concat(newNodeId, '" taxon_id="', taxon_id, '" id="tn_', taxon_id, '"')); //, '" onclick="loadTreeview(this)"'));
	

	if (row[4]) {
		newNode.push(' class="taxa_known"');
		if ((row[4] < 10000) && (taxon_id > 5)) {
			arrNode = '<a taxon_id="'.concat(taxon_id, '" id="tn_arrow_' + taxon_id + '" caption="', row[0], '" class="taxon_arrow taxa_known" title="Search for the taxon"> &#8594</a>');
		}
	}
	newNode.push('>');
	newNode.push('<span id="prefix_'.concat(newNodeId, '" class="', nodeClass, '">', nodePrefix, "</span>", newNodeValue));
	newNode.push('</a>'.concat(arrNode, '</li>'));
	newNode.push('</ul>');
	$rootNode = $('#' + rootNodeId).append(newNode.join(""));
	
	
	// add the event handler to open a tree part after the <a> element is complete
	$('#tn_' + taxon_id).click( function () {
		self.loadTreeview($(this));
	});
	
	$('#tn_arrow_' + taxon_id).off('click');
	$('#tn_arrow_' + taxon_id).click( function () {
		self.facets.clearFacets(reload_filters = false);
		var taxon_name = $(this).attr('caption');
		self.facets.setSearchInput('"' + taxon_name + '"', '10');
		startSearch();
		self.facets.loadFiltersForm();
	});
	
};





