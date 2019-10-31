"use strict";

/*
 * Store the filters and queries a user have done in the browsers local storage
 */



function QueryList() {
	this.queries = [];
	if (!window.localStorage) {
		alert('can not save queries in browsers local storage')
	}
}


QueryList.prototype.push = function(form_elements) {
	var self = this;
	if (form_elements !== undefined) {
		// unpack the stored string first, as it contains the complete list
		// then add an item and pack the list into a string again
		// store the complete list to localStorage
		// this is needed because localStorage can only store one string per key
		self.queries = JSON.parse(localStorage.getItem("querylist"));
		// form_elements is a list, push appends all list items, thus i need to append the form_elements list of a single
		// query as list of lists 
		self.queries.push([form_elements]);
		localStorage.setItem("querylist" , JSON.stringify(self.queries));
	}
	else {
		// do nothing?
	}
}

QueryList.prototype.getQueries = function() {
	var self = this;
	self.queries = JSON.parse(localStorage.getItem("querylist"));
	var form_elements_list = [];
	var i;
	if (self.queries.length > 0) {
		for (i = 0; i < self.queries.length; i++) {
			// console.log(self.queries[i]);
			form_elements_list.push(self.queries[i]);
		}
		return form_elements_list;
	}
}

/*
QueryList.prototype.pull = function() {
	var self = this;
	self.queries = JSON.parse(localStorage.getItem("querylist"));
	if (self.queries.length > 0) {
		var form_elements = self.queries.pull();
		// write the shortened list back to the local storage
		localStorage.setItem("querylist" , JSON.stringify(self.queries));
		return form_elements;
	}
	else {
		return null;
	}
}
*/

QueryList.prototype.emptyList = function() {
	self.queries = [];
	localStorage.setItem("querylist" , JSON.stringify(self.queries));
}




