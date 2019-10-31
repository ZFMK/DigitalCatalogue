var galleries = [];


function init_galleries() {
	// do this only if on news - page
	if ($('#news').length) {
		getSetGalleries();
		$(".slider_outer").each(function (index, jqthis) {
			var gallery = new Gallery(index, jqthis);
			console.log('timer');
			setup(gallery);
			galleries.push(gallery);
		});
	}

	else {
		// wait until all images are loaded in documents fragment do not wait in news as it stops news working
		//$( ".gallery_item img" ).on("load", function() {
			console.log('count images');
			$(".slider_outer").each(function (index, jqthis) {
				console.log('timer_doc ', index, jqthis);
				var gallery = new Gallery(index, jqthis);		
				setup(gallery);
				galleries.push(gallery);
			});
		//});
	}

}

function getSetGalleries () {
	var i = 0;
	//$("#news figure").each(function (index, jqthis) {
	$("#news figure").each(function (index, jqthis) {
		if ($(jqthis).siblings().length > 0) {
			//console.log($(jqthis), $(jqthis).siblings().length);
			$(jqthis).wrap("<div class='gallery_item_test'></div>");
		}
	});
	
	$("#news figure").parent().each(function (index, jqthis) {
		$(jqthis).addClass("gallery_item_test");
	});
	
	$("#news p>img").parent().each(function (index, jqthis) {
		if ($(jqthis).siblings().length > 0) {
			//console.log($(jqthis), $(jqthis).siblings().children("img").length);
			$(jqthis).wrap("<div class='gallery_item_test'></div>");
		}
	});
	
	// check if elements are part of a gallery:
	// put all elements of class gallery_item_test that have adjacent elements of the same class into class gallery_item
	$(".gallery_item_test").prev(".gallery_item_test").addClass("gallery_item");
	$(".gallery_item_test").next(".gallery_item_test").addClass("gallery_item");

	
	/*
	// check other way to select first and last
	// does not work
	$(".gallery_item").siblings(".gallery_item").each(function (index, gal_items) {
		$(gal_items).siblings(".gallery_item").first().addClass('new_start');
		console.log ($(gal_items).siblings(".gallery_item").length);
		//console.log ($(gal_items));
		//}
	});
	*/

	// first select elements of class .gallery_item than filter if it is the first of type div. Is this really errorfree? have not found other way
	$(".gallery_item:first-of-type").each(function (index, gal_start) {
		$(gal_start).before("<div class='gal_start" +index + "'></div>");
		// if element is not first child of this element type
		// $(element).prev(":not('.gallery_item')").next().before("<div class='gal_start" +index + "'></div>");
	});
	
	var galnum = -1;
	$(".gallery_item:last-of-type").each(function (index, gal_end) {
		$(gal_end).after("<div class='gal_end" +index + "'></div>");
		galnum = index;
	});
	
	
	if (galnum > -1) {
			for (var i = 0; i <= galnum ; i++) {
			var gal_idx = "gal_" + i;
			var gal_elements = $(".gal_start" + i).nextUntil(".gal_end" + i);
			$(gal_elements).wrapAll("<div class='slider_outer " + gal_idx + "'></div>");
			$(gal_elements).wrapAll("<div class='slider_inner'></div>");
			$(".slider_outer." + gal_idx).append("<div class = 'slider_lbutton'><img src='/static/images/buttons/left_arrow.png'></div>");
			$(".slider_outer." + gal_idx).append("<div class = 'slider_rbutton'><img src='/static/images/buttons/right_arrow.png'></div>");
			//$(".slider_outer." + gal_idx + " .slider_inner p").remove();
		}
	}
		//$(jqthis).prev(this).addClass("gallery_item_test");

	/*
	var gal_elements = $("p img").each(function (index, jqthis) {
		$(jqthis).next(jqthis).addClass("gallery_item_test");
	});
	*/
}




function Gallery (index, jqthis) {
	this.slider_outer = jqthis; // put the reference to .slider_outer selector into the object
	this.index = index;
	this.lbutton = $(this.slider_outer).find(".slider_lbutton");
	this.rbutton = $(this.slider_outer).find(".slider_rbutton");
	this.content = $(this.slider_outer).find(".slider_inner");
	this.scroll = false;
	this.show_lbutton = false;
	this.show_rbutton = false;
	this.maskwidth = $(this.slider_outer).parent().outerWidth(true);
	this.itemwidth = 400;
	this.itemouterwidth = 400;
	this.itemheight = 400;
	this.itemouterheight = 400;
	this.contentwidth = this.content.outerWidth(true);
	this.setSliderSize();
	this.timer = false;
	this.id = $(this.slider_outer).attr('id');
}


Gallery.prototype = {
	// calculate the shift in pixels
	offset: function () {
		// parseInt (- 0.5) (i.e. round) for opera because it calculates real numbers for pixels
		var left = parseInt(this.content.position().left - 0.5);

		// set flag for showing or hiding buttons
		this.show_lbutton = true;
		this.show_rbutton = true;
		if (left >= 0) {
			this.show_lbutton = false;
		}
		if (left <  ((this.contentwidth * -1) + this.maskwidth + this.itemouterwidth)) {
			this.show_rbutton = false;
		}
		// calculate if shift should be done and the value to shift
		if (this.scroll == '>') {
			if (left < 0) {
				left +=this.itemouterwidth;
				//console.log('left', left);
			}
		} else {
			if (left >= ((this.contentwidth * -1) + this.maskwidth + this.itemouterwidth)) {
				left -= this.itemouterwidth;
			}
		}
		return left + 'px';
	},
	
	
	// do the sliding
	slide: function () {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		if (this.scroll) {
			$(this.content).bind(this)
				.stop(true, true)
				.animate({left: this.offset()}, 500);
			// wait a second before requesting a new slide-action
			this.timer = setTimeout(this.slide.bind(this), 1000);
		}
		setbuttons(this);
	},
	
	// get size and number of elements and set slide_outer size
	setSliderSize: function () {
		var sumwidth = 0;
		var maxwidth = 0;
		var maxouterwidth = 0;
		var maxheight = 0;
		var maxouterheight = 0;
		var itemnum = 0;
		var maskwidth = this.maskwidth;

		// reduce the size of images that are wider than the max size of the mask (= cutting window) 
		$(this.content).find('.gallery_item img').each(function (index, imthis) {
			//console.log($(imthis).parent().outerWidth( true ));
			if ($(imthis).parent().outerWidth( true ) > maskwidth) {
				var outdif = $(imthis).parent().outerWidth( true ) - $(imthis).width();

				var ofactor = (maskwidth -outdif) / $(imthis).width(); // -20 for margin on class .gallery_item 
				$(imthis).width((parseInt($(imthis).width() * ofactor)));
				$(imthis).height((parseInt($(imthis).height() * ofactor)));
			} 
		}).bind(this);
		
		// now calculate all sizes
		$(this.content).find('.gallery_item').each(function (index, lithis) {

			// set the width to the max width of the items
			// use width without margin
			var width = $(lithis).width();
			if (width > maxwidth) {
				maxwidth = width;
			}
			var outerwidth = $(lithis).outerWidth( true );
			if (outerwidth > maxouterwidth) {
				maxouterwidth = outerwidth;
			}
			// set the height to the max height of the items
			var height = $(lithis).height();
			if (height > maxheight) {
				maxheight = height;
			}
			
			var outerheight = $(lithis).outerHeight( true );
			if (outerheight > maxouterheight) {
				maxouterheight = outerheight;
			}
			
			//console.log(lithis, maxwidth, maxheight)
			itemnum++;
			//console.log ('calculating size ############', $(lithis).outerWidth( true ), $(lithis).outerWidth(), $(lithis).width());
		}).bind(this);
		
		// set the objects width value
		this.itemwidth = maxwidth;
		this.itemouterwidth = maxouterwidth;
		
		this.itemheight = maxheight;
		this.itemouterheight = maxouterheight;
		
		// set the buttons to the middle of the items height 
		$(this.slider_outer).find('.slider_lbutton, .slider_rbutton').css('top', parseInt(maxouterheight / 2)).bind(this);
		
		// set the cutting window to the width of max nummber of items fitting into it
		// is this needed or should it just be the maskwidth-value?
		var itemsinmasknum = parseInt(this.maskwidth / maxouterwidth);
		if (itemsinmasknum <= itemnum) {
			if (itemsinmasknum < 1) { // in case the single item is larger than the mask (errors in outerWidth calculation)
				itemsinmasknum = 1;
			}
			this.maskwidth = maxouterwidth * itemsinmasknum;
		}
		else {
			this.maskwidth = maxouterwidth * itemnum;
		}
		$(this.slider_outer).width(this.maskwidth).bind(this);
		
		// set the width of each item to the width of the widest item
		$(this.content).find('.gallery_item').each(function (index, lithis) {
			$(lithis).width(maxwidth);
		}).bind(this);
		
		// set the base window to the width of of all items together
		sumwidth = itemnum * (maxouterwidth); // margin 
		this.contentwidth = sumwidth;
		// set width and height to this.content (i.e. slider_inner-class)
		$(this.content).width(sumwidth).bind(this);
		
		// set the maxheight
		$(this.slider_outer).height(maxouterheight).bind(this);
		
		//console.log(this.contentwidth, this.maskwidth, maxwidth, maxheight);
		//console.log('the old this? ', this);
	},
	
	dummy: function () {
		console.log("i am the dummy");
	}
};



// set the buttons on or off
function setbuttons (gallery) {
	gallery.offset();
	if (gallery.show_lbutton) {
		$(gallery.slider_outer).find('.slider_lbutton').css({'visibility': 'visible'});
	}
	else {
		$(gallery.slider_outer).find('.slider_lbutton').css({'visibility': 'hidden'});
	}
	if (gallery.show_rbutton) {
		$(gallery.slider_outer).find('.slider_rbutton').css({'visibility': 'visible'});
	}
	else {
		$(gallery.slider_outer).find('.slider_rbutton').css({'visibility': 'hidden'});
	}
}



// initialize the gallery functions
function setup (gallery) {
	
	$(gallery.slider_outer).find('.slider_lbutton, .slider_rbutton').css({'visibility': 'hidden'});
	if (gallery.contentwidth > gallery.maskwidth) {
		gallery.offset();
		if (gallery.show_lbutton) {
			$(gallery.slider_outer).find('.slider_lbutton').css({'visibility': 'visible'});
		}
		if (gallery.show_rbutton) {
			$(gallery.slider_outer).find('.slider_rbutton').css({'visibility': 'visible'});
		}

		$(gallery.lbutton)
			.mouseout(function() {
				gallery.scroll = false;
				setbuttons(gallery);
				})
			.click(function(e) {
				gallery.scroll = '>';
				gallery.slide();
				setbuttons(gallery);
				gallery.scroll = false;
			});
		$(gallery.rbutton)
			.mouseout(function() {
				gallery.scroll = false;
				setbuttons(gallery);
				})
			.click(function(e) {
				gallery.scroll = '<';
				gallery.slide();
				setbuttons(gallery);
				gallery.scroll = false;
			});
	}
	
	// hide everything outside the cutting window
	$(gallery.slider_outer).css('overflow', 'hidden');
}



// the call of the main program must be here at the end of the script, otherwise it runs into errors
// timeout is needed to allow the complete load of the images
$(document).ready(function() {
	setTimeout( function() {
		init_galleries();
	}, 200);
});

