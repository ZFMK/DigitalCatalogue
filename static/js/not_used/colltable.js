// the reference to the datattables-object
var table;

// flag that can be sent viewsCollTable.py to set up pudb.set_trace()
var debug = 0;
var xhrcount = 0;

// array storing cell properties used for validation, sorted by row and column numbers used for validation
var tablecells = [];

// cell id of the last edited cell. important for function getNextInvalidCell the next invalid cell
var lasteditedcell = null;

// flag that the handlers for save and reset exists and must not set again
var saveresethandler = false;

// definiton of input fields for table cells, their format and validation patterns
var inputfields = {
	's_text': {
		'in': '<input class="tc_input" type="text" value="',
		'out': '" />',
		'regexconverter': false,
		'validate': false
	},
	'unsigned_int': {
		'in': '<input class="tc_input" type="text" value="', //type="number" style="width: 2em;" min="0" step = "1" value="',
		'out': '" />',
		'regexconverter': false,
		'validate': /^\d+$/
	},
	'int': {
		'in': '<input class="tc_input" type="text" value="', //type="number" style="width: 2em;" min="0" step = "1" value="',
		'out': '" />',
		'regexconverter': false,
		'validate': /^[\+\-\~]?\d+$/
	},
	'unsigned_float': {
		'in': '<input class="tc_input" type="text" value="', //type="number" style="width: 2em;" min="0" step = "0.001" value="',
		'out': '" />',
		'regexconverter': false,
		'validate': /^\d+\.\d+$/
	},
	'float': {
		'in': '<input class="tc_input" type="text" value="', //type="number" style="width: 8em;" step = "0.01" value="',
		'out': '" />',
		'regexconverter': false,
		'validate': /^[\+\-]?\d+\.\d+$/
	},
	'text': {
		'in': '<textarea class="tc_input">',
		'out': '</textarea>',
		'regexconverter': false,
		'validate': false
	},
	'date': {
		'in': '<input class="tc_input" type="text" value="',
		'out': '" />',
		'regexconverter': [/(\d+)\-(\d+)\-(\d+)\W.*/, "$3.$2.$1"],
		'validate': /^(31|30|0[1-9]|[12][0-9]|[1-9])\.(0[1-9]|1[012]|[1-9])\.((16|17|18|19|20)\d{2}|\d{2})$/
	}
};


$(document).ready(function() {
	setup();
});


// map datatypes and formats available from spread sheet to field types for input validation
function typeMapper (datatype, typeformat) {
	var fieldtype = 'text';
	if (datatype == 'TEXT') {
		fieldtype = 'text';
	}
	if (datatype == 'FLOAT') {
		fieldtype = 'float';
		if (typeformat == '0') {
			fieldtype = 'int';
		} 
	}
	if (datatype == 'DATETIME') {
		fieldtype = 'date';
	}
	return fieldtype;
};

// convert data representations comming from spread sheets to representations used in tableeditor: e. g. date caoes as MM/DD/YYYY, is converted to DD.MM.YYYY 
function formatConvert(fieldtype, content) {
	if (inputfields[fieldtype]['regexconverter'] != false) {
		var newcontent
		newcontent = content.replace(inputfields[fieldtype]['regexconverter'][0], inputfields[fieldtype]['regexconverter'][1]);
		//console.log(content + ", ", inputfields[fieldtype]['regexconverter'] + ", ", newcontent)
		return newcontent;
	}
	else {
		return content;
	} 
};

// checks if data in field are in valid format, sets css class on selector to show user validity via red or green color
function isValid (selector, tempcontent, pattern) {
	if (pattern) {
		testregex = new RegExp(pattern);
		// console.log(selector, tempcontent, pattern);
		if (testregex.test(tempcontent)) {
			$(selector).removeClass('invalid').addClass('valid');
			// console.log('handler pattern matched');
			return true;
		}
		else {
			$(selector).removeClass('valid').addClass('invalid');
			// console.log('handler pattern not matched');
			return false;
		}
	}
	else {
		// console.log('handler pattern == false');
		$(selector).removeClass('invalid').addClass('valid');
		return true;
	}
};


// $.fn.makeEditable
// code from: http://stackoverflow.com/questions/1224729/using-jquery-to-edit-individual-table-cells
$.fn.makeEditable = function(table, typeslist, formatslist) {
	//console.log(table);
	$(this).on('click',function(event){
		// just return this if table cell is active and has input field
		if($(this).find('.tc_input').is(':focus')) return this;

		// otherwise get cell and cells content
		lasteditedcell = $(this).attr('id');
		$('.selected_cells').removeClass('selected_cells');
		$('#' + lasteditedcell).addClass('selected_cells');
		console.log('lasteditedcell', lasteditedcell);
		var cell = $(this);
		var datatype = typeslist[cell.index()];
		// if cell is in key column do not cativate editing
		if (datatype == 'blocked') {
			//console.log('found blocked?');
			return this;
		}
		var typeformat = formatslist[cell.index()];
		var fieldtype = typeMapper(datatype, typeformat);
		
		// console.log ($(this), 'bahs', cell.index(), datatype, typeformat, fieldtype);
		var content = $(this).html();
		//add input field to cell
		var inputtype = "text";

		var xcursor = event.pageX -50;
		var ycursor = event.pageY -10;

		if ($('#edittableframe').hasClass('overlaymode') === true) {
			xcursor -= 20;
			ycursor -= 40;
		}
		
		//console.log (event.pageX, ycursor);
		var inputoverlay = $('#inputoverlay');
		inputoverlay.html('<div style="position: absolute; z-index: 1199; left: '+ xcursor +'px; top: '+ ycursor +'px">' + inputfields[fieldtype]['in'] + $(this).html() + inputfields[fieldtype]['out'] + '</div>');

		// validate when opening a field
		var tempcontent = inputoverlay.find('.tc_input').val();
		console.log(tempcontent, 'key_down');
		isValid('.tc_input', tempcontent, pattern = inputfields[fieldtype]['validate']);

		// bock the enter key when shift is pressed to allow linefeeds
		var shiftpressed = false;
		inputoverlay.find('.tc_input')
			.trigger('focus')
			.on({
			'blur': function(){
			  $(this).trigger('closeEditTable');
			},
			// fetch enter with keydown event to prevent insertion of \n in cell
			'keydown': function(e){
				if (e.which == '16') { // shift
					console.log('shift pressed')
					shiftpressed = true;
				}
				else {
					if((e.which == '13') && (shiftpressed === false)) { // enter
						$(this).trigger('saveEditTable');
					}
				}
			},
			'keyup': function(e){
				var tempcontent = $(this).val();
				//console.log(fieldtype, inputfields[fieldtype]['validate']);
				isValid('.tc_input', tempcontent, pattern = inputfields[fieldtype]['validate']);
				//if(e.which == '13'){ // enter
				//	$(this).trigger('saveEditTable');
				//} else
				// release blockade of trigger for saveEditTable when shift key is released
				if (e.which == '16') { // shift
					console.log('shift pressed')
					shiftpressed = false;
				}
				if(e.which == '27'){ // escape
					$(this).trigger('closeEditTable');
				}
			},
			'closeEditTable':function(){
				$('#inputoverlay').html('');
				cell.html(content);
			},
			'saveEditTable':function(){
				content = $(this).val();
				$(this).trigger('closeEditTable');
				// put new value into DataTables cell object to keep columns sortable
				var tcell = table.cell( cell );
				tcell.data( content ); //.draw( false ); // do not redraw on the fly
				isValid(cell, content, pattern = inputfields[fieldtype]['validate']);
			}
		});
	});
	return this;
};


function setup() {
	//console.log('here1');
	var transactionid = $('#option-transactionid').val();
	var uid = $('#option-user').val();
	//console.log(transactionid, uid);

	displaytable(transactionid, uid, debug);
	
	// add handler to toggle fullscreen mode
	$('#overlaybutton').click(function () {
			$('#edittableframe').toggleClass('overlaymode');
			if ($('#overlaybutton img').attr('src') == '/static/images/plus.png') {
				$('#overlaybutton img').attr('src', '/static/images/minus.png');
			}
			else {
				$('#overlaybutton img').attr('src', '/static/images/plus.png');
			}
		});
	
	// handler for 'go to previous|next invalid value'-buttons
	$('#previousinvalidbutton').click(function () {
		var cellid = getPreviousInvalidCell(tablecells, lasteditedcell);
		centerInvalidCell(cellid);
	});
	
	$('#nextinvalidbutton').click(function () {
		var cellid = getNextInvalidCell(tablecells, lasteditedcell);
		centerInvalidCell(cellid);
	});
	
	// handler for slider to change font-size in table
	$('#fontsizeslider').change(function () {
		console.log($(this).val());
		$('td,thead').css('font-size', $(this).val() + '%');
		//$('td,thead').css('line-height', '1.5em');
		table.columns.adjust().draw();
	});
	
	$('#closebutton').click(function () {
		window.location.href = "/sammeln/dashboard";
	});

};



function addSaveResetHandlers(tablecells, data, transactionid, uid) {
	// handlers for save and reset buttons
	// saveTable function must be called after data are loaded into data object by 
	// getTableData()
	$('#saveexcelbutton').click(function () {
		saveTable(tablecells, data, transactionid, uid);
	});
	
	$('#resetexcelbutton').click(function () {
		resetTable(transactionid, uid);
	});
	saveresethandler = true;
	return saveresethandler
}

function displaytable(transactionid, uid, debug) {
	//console.log('here2');
	getTableData(transactionid, uid, debug);
};


function writeExcelFile(exceldata, transactionid, uid) {
	showLoadingAnimation();
	// console.log('###########', exceldata);
	$.ajax({
		url: "/colltable/writedata",
		type: 'POST',
		contentType: 'application/json; charset=utf-8',
		//dataType: 'json',
		data: JSON.stringify({
			'transaction_id': transactionid, 
			'user_id': uid,
			'debug': debug,
			'datatypes': exceldata['datatypes'],
			'valuelists': exceldata['datarows']
			}),
		success: function (data) {

			hideLoadingAnimation();
			// rewrite the message in the message box
			$('#messageBox').html('Excel file has been saved')

		},
		error: function (xhr, textStatus, errorThrown) {
			error_response = xhr.responseJSON;
			hideLoadingAnimation();
			alert('Error saving the Excel file');
		}
	});
}


function getTableData(transactionid, uid, debug) {
	// get all the master categories but do not split tables into sub tables. 
	// use head categories to jump to the specific column in a table

	showLoadingAnimation();
	
	if (debug != 0) {
		// log how many times /colltable/getdata is called
		xhrcount++;
		console.log('number xhrcalls', xhrcount);
	}
	
	/* get the data from /colltable/getdata view */
	$.ajax({
		url: "/colltable/getdata",
		type: 'POST',
		dataType: 'json',
		data: {
			'transaction_id': transactionid, 
			'user_id': uid,
			'debug': debug
		},
		success: function (data) {
			if (!data.datarows) {
				alert('no data found');
			}
			//console.log(data['headerrows']);
			//console.log('here5');
			var tableheaders = data['headerrows'];
			var typeslist = data['datatypes'];
			var formatslist = data['dataformats'];
			var columns = [];
			for (var i = 0; i < tableheaders.length; i++){
				columns.push({title: tableheaders[i]});
			}
			
			var startx = 0;
			var endx = 0;
			$('#edittableframe').append('<table id="edittable"></table>');
			$('#edittableframe').css('margin', '10px');


			/* generate the html tables, first the head with categories as colspan fields */
			var lasthead = ''; 
			$('<thead></thead>').appendTo('#edittable');
			for (var r = 0; r < tableheaders.length; r++){ // start in the first row
				$('#edittable thead').append('<tr id=\'etableheadrow'+r+'\'></tr>');
				var lastx = 0;
				for (var c = 0; c < tableheaders[r].length; c++) {
					if ((c > 0) && (lasthead == tableheaders[r][c]) && tableheaders[r][c] != '') {
						$('#edittable #etableheadcell_'+r+'_'+lastx).attr('colspan', function () {
							var colspan = parseInt($('#edittable #etableheadcell_'+r+'_'+lastx).attr('colspan'));
							//console.log ('The set colspan is',colspan +1);
							return colspan +1;
						});
					}
					else {
						$('<th id="etableheadcell_'+r+'_'+c+'" colspan="1">'+tableheaders[r][c]+'</th>').appendTo('#edittable #etableheadrow'+r);
						//console.log('inserted ', tableheaders[r][y], $('#edittable'+i+' #etableheadcell_'+r+'_'+y).attr('colspan'))
						lasthead = tableheaders[r][c];
						lastx = c;
					}
				}
			}
				
			//console.log('head done')
			//$('<tfoot></tfoot>').appendTo('#edittable');
			
			// create dictionary for 

			/* generate the html table, second the data cells */
			$('<tbody></tbody>').appendTo('#edittable');
			var tabledata = data['datarows'];
			for (var r = 0; r < tabledata.length; r++) {
				$('#edittable tbody').append('<tr id=\'etablerow_'+r+'\'></tr>');
				//console.log(i);
				tablecells[r] = [];
				for (var c = 0; c < tabledata[r].length; c++) {
					//console.log(r, c, tabledata[r][c]);
					// convert data values according to formats defined in inputfields[fieldtype]['regexconverter']
					var cellvalue;
					var datatype = typeslist[c];
					var typeformat = formatslist[c];
					var fieldtype = typeMapper(datatype, typeformat);
					if (inputfields[fieldtype]['regexconverter'] != false) {
						cellvalue = formatConvert(fieldtype, tabledata[r][c]);
					}
					else {
						cellvalue = tabledata[r][c];
					}
					if (cellvalue == 'None') {
						cellvalue = '';
					}
					$('#etablerow_'+r).append('<td id=\'etablecell_'+r+'_'+c+'\'>'+cellvalue+'</td>');
					var cellid = 'etablecell_'+r+'_'+c;
					// generate dict of dict if it needs to be extended later
					var tablecell = {
						'cellid': cellid,
						'fieldtype': fieldtype,
						'valid': true
					};
					tablecells[r][c] = tablecell;
				}
			}
			//console.log(tablecells);
			// enable Validate All button
			$('#previousinvalidbutton').prop( "disabled", false );
			
			validateAll(tablecells);
			$('#nextinvalidbutton').prop( "disabled", false );

			/* use DataTables to design the table */
			
			// the list of tables was used when splitting the table according to the main categories, a long time ago
			table = $('#edittable').DataTable(
				{
					"scrollX": true,
					"scrollCollapse": true,
					"scrollY": "600px",
					"scrollCollapse": false,
					"paging": false,
					"scroller": false
				}
			);
			table.page.len(-1);

			$('#edittable').addClass('viewTable');
			/* call the makeEditable and refine some settings */
			$('#edittable td').makeEditable(table, typeslist, formatslist);

			
			hideLoadingAnimation();
			
			// add the event handlers for save and reset button
			// but only if it does not exist
			if (saveresethandler === false) {
				addSaveResetHandlers(tablecells, data, transactionid, uid);
			}
		},
		error: function (xhr, textStatus, errorThrown) {
			error_response = xhr.responseJSON;
			hideLoadingAnimation();
			alert(error_response.message);
			//return ('')
		}
	});
};


function validateAll(tablecells) {
	// get the length of the array in row and column direction to turn the array round
	var rows = tablecells.length;
	var columns = tablecells[0].length;
	for (var c = 0; c < columns; c++) {
		for (var r = 0; r < rows; r++) {
			var cellid = '#' + tablecells[r][c]['cellid'];
			var cellcontent = $('#' + tablecells[r][c]['cellid']).html();
			// set background of cell
			isValid(cellid, cellcontent, pattern = inputfields[tablecells[r][c]['fieldtype']]['validate']);
		}
	}
}



function getNextInvalidCell(tablecells, lasteditedcell) {
	// the check whether a cell is valid is done by getting the class of the cell via jquery in order to prevent overhead in tablecells structure
	// console.log('startcell', cellid);
	
	var rows = tablecells.length;
	var columns = tablecells[0].length;


	for (r = 0; r < rows; r++) {
		for (c = 0; c < columns; c++) {
			if (lasteditedcell == tablecells[r][c]['cellid']) {
				console.log(c, 'hepp1', lasteditedcell);
				lasteditedcell = null;
				c++; // to go to the next cell if the last cell is invalid
			}
			//console.log (tablecells[r][c]['cellid'], $('#' + tablecells[r][c]['cellid']).hasClass('invalid'));
			if ((lasteditedcell == null) && $('#' + tablecells[r][c]['cellid']).hasClass('invalid')) {
				console.log(c, tablecells[r][c]['cellid'], lasteditedcell);
				return tablecells[r][c]['cellid'];
			}
		}
	}

	return null;
};


function getPreviousInvalidCell(tablecells, lasteditedcell) {
	// the check whether a cell is valid is done by getting the class of the cell via jquery in order to prevent overhead in tablecells structure
	// console.log('startcell', cellid);
	
	var rows = tablecells.length;
	var columns = tablecells[0].length;


	for (r = rows-1; r >= 0; r--) {
		for (c = columns-1; c >= 0; c--) {
			if (lasteditedcell == tablecells[r][c]['cellid']) {
				console.log(c, 'hepp12', lasteditedcell);
				lasteditedcell = null;
				c--; // to go to the next cell if the last cell is invalid
			}
			//console.log (tablecells[r][c]['cellid'], $('#' + tablecells[r][c]['cellid']).hasClass('invalid'));
			if ((lasteditedcell == null) && $('#' + tablecells[r][c]['cellid']).hasClass('invalid')) {
				console.log(c, tablecells[r][c]['cellid'], lasteditedcell);
				return tablecells[r][c]['cellid'];
			}
		}
	}

	return null;
};


function centerInvalidCell(cellid) {
	if (cellid != null) {
		console.log(cellid, $('#edittableframe').offset());
		console.log($('#edittableframe').innerWidth());
		$('.selected_cells').removeClass('selected_cells');
		$('#' + cellid).addClass('selected_cells');
		lasteditedcell = cellid;
		$('div.dataTables_scrollBody').scrollLeft(0);
		$('div.dataTables_scrollBody').scrollTop(0);
		//$('div.dataTables_scrollBody').scrollLeft($('#' + cellid).offset().left - 800);
		//$('div.dataTables_scrollBody').scrollTop($('#' + cellid).offset().top - 800);
		$('div.dataTables_scrollBody').scrollLeft($('#' + cellid).offset().left - ($('div.dataTables_scrollBody').offset().left + 50));
		$('div.dataTables_scrollBody').scrollTop($('#' + cellid).offset().top - ($('div.dataTables_scrollBody').offset().top + 50));
		
	}
}


function getDataAsJSON() {
	
};


function saveTable(tablecells, data, transactionid, uid) {
	for (var r = 0; r < tablecells.length; r++) {
		for (var c = 0; c < tablecells[r].length; c++) {
			data['datarows'][r][c] = $('#' + tablecells[r][c]['cellid']).html();
		}
		//console.log(data['datarows'][r]);
	}
	writeExcelFile(data, transactionid, uid);
};

function deleteDataTables() {
	table.destroy(true);
};

function resetTable(transactionid, uid, debug) {
	deleteDataTables();
	getTableData(transactionid, uid, debug);
	$('#messageBox').html('Data have been resetted')
};



// show animated gif while table is loading
function showLoadingAnimation() {
	$("#loadingETable").removeClass('hidden');
};

function hideLoadingAnimation() {
	$("#loadingETable").addClass('hidden');
};



