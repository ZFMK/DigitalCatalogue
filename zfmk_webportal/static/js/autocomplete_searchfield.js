$(document).ready(setupautocompletion);


var host = window.location.host;
var protocol = window.location.protocol;

var facets = new Facets();


function setupautocompletion() {
	var inputfield = new InputField ();
	var categoryselector = new CategorySelector(inputfield);
} 


function CategorySelector(inputfield) {
	this.inputfield = inputfield;
	this.jq_selector = $('#search_category');
	this.allowedcategories = {
		'10' : 'taxon',
		'4': 'location'
	};
	this.catname = null;
	
	this.setAutoCompletionEvent();
	var self = this;
	this.jq_selector.change( function() {
		self.setAutoCompletionEvent();
	});
}


CategorySelector.prototype = {
	getSearchCategory: function() {
		var self = this;
		var category = self.jq_selector.val();
		category = category.toString();
		return category; 
	},
	
	setAutoCompletionEvent: function() {
		var self = this;
		var category = self.getSearchCategory();
		if (category in self.allowedcategories) {
			self.catname = self.allowedcategories[category];
		}
		else {
			self.catname = null;
		}
		self.inputfield.setAutoComplete(self.catname)
	}
}



function InputField (categoryselector) {
	var self = this;
	self.jq_input = $('#search_term');
	self.jq_input.on("autocompleteselect", function(event, ui) {
		//submitTextBox();
		// set the value in input field before calling startSearch() and loadFiltersForm()
		// because the input field is not filled when on("autocompleteselect") is called on autocomplete element
		self.jq_input.val(ui.item.value);
		console.log('value', ui.item.value)
		startSearch();
		facets.loadFiltersForm();
	});
	self.jq_input.keypress(function(event) {
		// close the autocomplete list if the user presses enter in input field
		if ( event.which == 13 ) {
			self.jq_input.autocomplete("close");
		}
	});
}

InputField.prototype = {
	
	setAutoComplete: function(category) {
		var self = this;
		console.log(category);
		if (category == 'taxon' || category == 'location') {
			// use parameters here not this, as this will be overwritten
			$( function() {
				$( self.jq_input ).autocomplete({
					source: function( request, response ) {
						var data = {
								'field': category,
								'search': request.term
							};
						$.getJSON(protocol + '//' + host + '/autocomplete/getNamesList', data)
						.done(function( json ) {
							var datalist = [];
							datalist = json['names'];
							response(datalist);
						})
						.fail(function( jqxhr, textStatus, error ) {
							var err = textStatus + ", " + error;
						});
					},
					minLength: 3
				});
			});
		}
		else { 
			self.jq_input.autocomplete("destroy");
			console.log('destroying it', category);
		}
	}
}





