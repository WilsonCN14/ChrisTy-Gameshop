// This function uses the address_id from the row clicked on, to delete that row from the table

function deleteButton(c_row) {
	try {
		var table = document.getElementById('addressTable');
		var req = new XMLHttpRequest();
		var url = '/delete?address_id=' + c_row.parentNode.parentNode.cells[0].innerHTML; 
		
		req.open('GET', url, true);
		req.addEventListener('load', function(){
			if(req.status >= 200 && req.status < 400){
				window.location.reload();
			} else {
				console.log("Error in network request: " + req.statusText);
			}});
	    req.send(null);
	    event.preventDefault();
		} catch(e) {
		alert(e);
	}
}