(function() {
	// autocomplete user in MaskUser-input
	$('#MasqUserList').autocomplete({
		source: function(term, response){
			try { xhr.abort(); } catch(e){}
			xhr = $.getJSON('/admin/masq_user_list', { q: term.term }, function(data){
				response(data); 
			});
		},
		minLength: 1,
		select: function( event, ui ) {
			if (ui.item) {
				$('#MasqUserList').val(ui.item.label);
				$('#MasqUserList_ID').val(ui.item.value);
			} else {
				$('#MasqUserList_ID').val('');
				$("#masq-user-form").submit(function(e) {
					e.preventDefault();
				});
			}
			return false;
		}
	});
})();


