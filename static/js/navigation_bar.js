
NavigationBar = function(bol_js, element_id, is_overlay) {
	this.bol_js = bol_js;
	// element_id is the id of the div with the sub-containers the navigation bar should point to
	// this.overlay_id is filled, when a close button should be available
	if (element_id != undefined) {
		this.element_id = element_id;
	}
	else {
		this.element_id = '#content';
	}
	// this.is_overlay must be true, when a close button should be available
	this.is_overlay = is_overlay;
	//console.log('I am here, navigation_bar.js');
}


// TODO: put the handling of the navigation bar according to the size into css @media code
NavigationBar.prototype.initNavigationBarHandler = function() {
	var self = this;
	var detaildiv = $(self.element_id);
	$( window ).resize(function () {
		if (detaildiv.width() <= 1000) {
			//console.log("smaller", detaildiv.width());
			self.setNavigationBar();
		}
		if (detaildiv.width() > 1000) {
			self.removeNavigationBar();
		}
	});
	
}

NavigationBar.prototype.setNavigationBar = function() {
	var self = this;
	if ($('#detail_navigation').length < 1) {
		$('#result_box').prepend('<div id="detail_navigation"></div>');
		if (self.is_overlay == true) {
			$('#detail_navigation').append('<span><a href="#" id="navibar_close_button">' + self.bol_js.sentences('closebutton', 'close') + '</a></span>')
			$('#navibar_close_button').click( function () {self.close_overlay();});
		}
		$('.navigation_target').each( function () {
			var headline_id = $(this).attr('id');
			if (headline_id != undefined) {
				if (!$(this).hasClass('hidden')) {
					$('#detail_navigation').append('<span><a href="#' + headline_id + '">' + $(this).data('anchor') + '</a></span>');
				}
			}
		});
	}
}

NavigationBar.prototype.removeNavigationBar = function() {
	var self = this;
	//$( window ).off('resize');
	if ($('#detail_navigation').length > 0) {
		$('#detail_navigation').remove();
	}
}

NavigationBar.prototype.close_overlay = function() {
	var self = this;
	self.removeNavigationBar();
	$( window ).off('resize');
	$(self.element_id).empty();
}


