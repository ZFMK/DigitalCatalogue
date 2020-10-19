BOL = function(lang){
	/* set the default parameter compatible with javascript before 2015 */
	lang = typeof lang !== 'undefined' ? lang : 'de';
	this.lang = lang;
	this.max_images = 5; /* no. images in diashow */
	this.results = {};
};


BOL.prototype.set_lang = function(lang) {
	this.lang = lang;
};

BOL.prototype.get_lang = function() {
	return this.lang;
};

BOL.prototype.is_lang = function(lang) {
	return this.lang==lang;
};

BOL.prototype.sentences = function (section, text_no) {
	/* set the default parameter compatible with javascript before 2015 */
	section = typeof section !== 'undefined' ? section : 'map';
	var s = {'map': {
		'de': {'no_specimens': 'Anzahl gefundene Individuen: ',
			'show_points': 'Fundorte des Taxons auf der Karte zeigen',
			'click_datapoint': 'Auf Datenpunkt klicken, um die Arten anzuzeigen',
			'new_search': 'Neue Suche'},
		'en': {'no_specimens': 'Number of specimens found: ',
			'show_points': 'Display locations of the taxon in the map',
			'click_datapoint': 'Click on datapoint to display the species names',
			'new_search': 'New search'}
		},
		'no_specimens_found': {
			'de': {'msg': 'Keine passenden Specimen gefunden'},
			'en': {'msg': 'No matching specimens found'}
		},
		'pwd_strength': {
			'de': {'strong': 'stark', 'fair': 'mittel', 'good': 'befriedigend', 'weak': 'schwach'},
			'en': {'strong': 'strong', 'fair': 'fair', 'good': 'good', 'weak': 'weak'}
		},
		'facet_filter': {
			'de':{'del_filter':'Wollen Sie diesen Filter dauerhaft löschen?',
				'del_filter_sccss':'Filter erfolgreich gelöscht!',
				'filter_save':'Bitte Namen eingeben, unter dem der Filter gespeichert wird',
				'filter_save_sccss':'Filter erfolgreich gespeichert!'},
			'en':{'del_filter':'Do you really want to permanently delete this filter?',
				'del_filter_sccss':'Filter was deleted successfully!',
				'filter_save':'Please enter name to save filter as',
				'filter_save_sccss':'Filter saved successfully!'}
		},
		'title_on_export': {
			'de':{
				'results_DE':'Übersicht der gesammelten ',
				'results_BL':'Übersicht der gesammelten ',
				'results_MI':'Übersicht der fehlenden '
			},
			'en':{
				'results_DE':'List of collected ',
				'results_BL':'List of collected ',
				'results_MI':'List of missing '
			}
		},
		'taxon_details': {
			'de':{
				'tax':'Taxonomie',
				'taxdetail':'Das Taxon im Detail',
				'specdetail':'Der Specimen im Detail',
				'file_error':'Fehler beim Erstellen der Datei'
			},
			'en':{
				'tax':'Taxonomy',
				'taxdetail':'Details on this taxon',
				'specdetail':'Details on this specimen',
				'file_error':'Error during file creation'
			}
		},
		'datarenderer': {
			'de':{
				'overview':'&Uuml;bersicht der gesammelten ',
				'in_the_states':' in den Bundesl&auml;ndern',
				'species':'Art'
			},
			'en':{
				'overview':'List of collected ',
				'in_the_states':' in the federal states of Germany',
				'species':'Species'
			}
		},
		'resultslice':
		{
			'de': {
				'0': 'Individuen ',
				'1': ' bis ',
				'2': ' von '
			},
			'en': {
				'0': 'Specimens ',
				'1': ' to ',
				'2': ' of '
			}
		},
		'closebutton': {
			'en': {'close': 'Close'},
			'de': {'close':'Schlie&szlig;en'}
		}
	};
	return s[section][this.lang][text_no];
};


BOL.prototype.loadingOverlay=function($target, mode, text) {
	/* set the default parameters compatible with javascript before 2015 */
	mode = typeof mode !== 'undefined' ? mode : false;
	text = typeof text !== 'undefined' ? text : false;
	
	if(mode) {
		var loading = '<div id="loading_gif" class="loading-overlay"/>'

		if(document.getElementById("overlay")==null) {
			if (text.length>0){
				var div = '<div id="overlay" class="loading-overlay" /><div id="overlay_msg">'+text+loading+'</div>';
			} else {
				var div = '<div id="overlay" />'+loading;
			}
			$target.prepend(div);
		}
	} else {
		$("#overlay").remove();
		$("#overlay_msg").remove();
		$("#loading_gif").remove();
	}
};


BOL.prototype.pwd_suggestion=function(suggestion_box, pwd_field) {
	var self = this,
		$suggestion_box = $('#'+suggestion_box),
		$pwd_field = $('#'+pwd_field);
	$pwd_field.on({
		keyup: function() {
			self.checkStrength();
		}, focus: function() {
			$suggestion_box.show();
		}
	});

	this.checkStrength = function() {
		var bar = document.getElementById("password-bar"),
			strength = 0,
			input_len = $pwd_field.val().length,
			key, i=0,
			bigLetterFlag = false,
			smallLetterFlag = false,
			numberLetterFlag = false,
			specialLetterFlag = false;
		if (input_len >= 6) {
			document.getElementById("sixLetter").style.display = "none";
			strength = strength + 1;
		} else {
			document.getElementById("sixLetter").style.display = "";
		}
		for (i; i < input_len; i++) {
			key = $pwd_field.val().charCodeAt(i);
			if (key >= 65 && key <= 90) {
				bigLetterFlag = true;
			} else if (key >= 97 && key <= 122) {
				smallLetterFlag = true;
			} else if (key >= 48 && key <= 57) {
				numberLetterFlag = true;
			} else if (key >= 33 && key <= 126) {
				specialLetterFlag = true;
			}
		}
		if (bigLetterFlag) {
			document.getElementById("bigLetter").style.display = "none";
			strength = strength + 1;
		} else {
			document.getElementById("bigLetter").style.display = "";
		}
		if (smallLetterFlag) {
			document.getElementById("smallLetter").style.display = "none";
			strength = strength + 1;
		} else {
			document.getElementById("smallLetter").style.display = "";
		}
		if (numberLetterFlag) {
			document.getElementById("numberLetter").style.display = "none";
			strength = strength + 1;
		} else {
			document.getElementById("numberLetter").style.display = "";
		}
		if (specialLetterFlag) {
			document.getElementById("specialLetter").style.display = "none";
			strength = strength + 1;
		}
		else {
			document.getElementById("specialLetter").style.display = "";
		}
		if (strength > 4) {
			$suggestion_box.hide();
			document.getElementById("password-text").innerHTML = self.sentences('pwd_strength', 'strong');
		} else {
			$suggestion_box.show();
			if (strength == 3) {
				document.getElementById("password-text").innerHTML = self.sentences('pwd_strength', 'fair');
			}
			else if (strength == 4) {
				document.getElementById("password-text").innerHTML = self.sentences('pwd_strength', 'good');
			}
			else {
				document.getElementById("password-text").innerHTML = self.sentences('pwd_strength', 'weak');
			}
		}
		bar.style.width = (0 + strength * 20).toString() + "%";
	};
}

toggleField = function(t, hide) {
	var $el = $(t), 
		$btn = $('.toggleButton', $el);
	if (hide==undefined) {
		if ($el.hasClass("hide")) {
			var hide=false;
		} else {
			var hide=true;
		}
	}
	if (!hide) {
		$el.removeClass("hide");
		$btn.each(function(){
			$(this).removeClass('plus').addClass('minus');
		});
	} else {
		$el.addClass("hide");
		$btn.each(function(){
			$(this).removeClass('minus').addClass('plus');
		});
	}
	hide = !hide;
	return false;
};

