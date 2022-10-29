exports.fetchBirdNames = function (req, res){
	
	var birdgroup = req.body.birdgroup;
	console.log ("birdgroup " + birdgroup);
	
		
	
	var mysql = require('mysql'); 
	var db_config = { host : 'localhost', user : 'root', password : 'dbpassword', database : 'birds',};
	var sqlcon = mysql.createConnection(db_config);
	
	var query_stmt = "select CommonName from X_birds where Classification ='" + birdgroup+"'";
	
	sqlcon.query(query_stmt, function (err, result, fields){
	
		if (err)
			throw err;
		else if (result.length > 0)
		{
			var data = Array();
			for (var i = 0; i < result.length ; i++ )
			{
				data[i] = result[i].CommonName;
				
			}
            console.log("Birds by classification: " + data);
			
			res.type('text/plain');
            res.end(JSON.stringify(result));
		
		}
	});
	
}

//Function for Browse birds
exports.fetchBirdsClassification = function (request, response, sqlcon) {

	var query_stmt = "select distinct Classification from X_birds;";
	
		sqlcon.query(query_stmt, function (err, result, fields){ //result stands for DB resultset
	
		if (err)
			throw err;
		else if (result.length > 0)
		{
			var data = Array();
			for (var i = 0; i < result.length ; i++ )
			{
				data[i] = result[i].Classification;
			}


			response.type('text/plain');
            response.end(JSON.stringify(result));
			
		}
		else 
		{
			console.log ("fetchBirdsClassification: No record found");
			res.send("Database is empty, no Classifications found :-(");
		}
	});


}
