exports.copyMediaFiles = function (file, dir, fs) {
	if (file)
	{
		var len = 1;
		if (file.length)
			len = file.length;
		for (var i = 0; i < len; i++)
		{
			var sampleFile = len==1?file:file[i];
			var phDir = dir;
			!fs.existsSync(phDir) && fs.mkdirSync(phDir);
			console.log("Final path: "+phDir+sampleFile.name);

			sampleFile.mv(phDir+sampleFile.name, function(err) {
			if (err)
			  console.log ("error in "+sampleFile.name);
			});
		}
	}
};

exports.insertData = function (req, res, con, mediaDir) {
	var name = req.body.Name;
	var sciName = req.body.SciName;
	var classification = req.body.Classification;
	var behaviour = 0;
	for (var i = 0; i < req.body.Behaviour.length; i++ )
		behaviour += parseInt(req.body.Behaviour[i], 10);
	var plumage = 0;
	for (var i = 0; i < req.body.Plumage.length; i++ )
		plumage += parseInt(req.body.Plumage[i], 10);
	var size = req.body.Size;
	var desc = req.body.Description;

	//first check if record exists
	var query_stmt = "select ScientificName from X_birds where ScientificName='"+sciName+"'";
	var insert_stmt = "";
	con.query(query_stmt, function (err, result, fields) 
	{
		if (err)
			throw err;
		if (result.length == 0)//entry is absent
		{
				var len = 0;
				var pictures = "";

				if (req.files.Photo.length)
				{
					len = req.files.Photo.length;
					for (var i = 0; i < len; i++)
					{
						var photo = len==1?req.files.Photo:req.files.Photo[i];
						var info = len==1?req.body.Info:req.body.Info[i];
						pictures += mediaDir+"Photos/"+photo.name+"|"+info+",";
					}
					console.log("\n Pictures column: " +pictures);
				}

				var sounds = "";
				if (req.files.Sounds) 
				{    				
					console.log("req.files.Sounds:" + req.files.Sounds);
					var snd ="";
					
					if (req.files.Sounds.length > 0)
					{
					 console.log("req.files.Sounds.length:" + req.files.Sounds.length);
					 len = req.files.Sounds.length;
					  for (var i = 0; i < len; i++)
					    {
						snd = len==1?req.files.Sounds:req.files.Sounds[i];
						sounds += mediaDir+"Sounds/"+snd.name+",";
						}
					}
					else
						{
						snd = req.files.Sounds.name;
						sounds += mediaDir+"Sounds/"+snd;
						}
						
					console.log("\n Sounds Column: " +sounds);
				}

				
				var map = "";
				if (req.files.DistributionMap)
				{

					var _map ="";
					
					if (req.files.DistributionMap.length > 0)
					{
					 console.log("req.files.DistributionMap.length:" + req.files.DistributionMap.length);
					 len = req.files.DistributionMap.length;
					  for (var i = 0; i < len; i++)
					    {
						_map = len==1?req.files.DistributionMap:req.files.DistributionMap[i];
						map += mediaDir+"DistributionMap/"+_map.name+",";
						}
					}
					else
						{
						_map = req.files.DistributionMap.name;
						map += mediaDir+"DistributionMap/"+_map;
						}
					console.log("\n DistributionMap Column: " +map);
				}

				/*Inserting rows in x_birds*/

				var	escaped_name = name.replace(/'/g,"\\'");
				insert_stmt = "insert into X_birds (CommonName, ScientificName, Classification, Behaviour, Plumage, Size) values ('"+escaped_name+"','"+sciName+"','"+classification+"',"+behaviour+","+plumage+","+size+")"; 
				console.log("\n: Insert in x_birds:" + insert_stmt);

				con.query(insert_stmt, function (err, result, fields)
			    {
					if (err) 
					{
						//throw err;
						console.log ("Row entry in to x_Birds failed for birdId"+birdId +" Please check log for error");

					}
					else
					{
						var birdId = result.insertId;
						console.log ("X_birds Successfully returned Index "+birdId );
				
							/*Inserting rows in x_birdDescription*/

							    var escaped_pictures= pictures.replace(/'/g,"\\'");
							    var escaped_sounds= sounds.replace(/'/g,"\\'");
							    var escaped_map= map.replace(/'/g,"\\'");
								var escaped_desc = desc.replace(/'/g,"\\'");
								insert_stmt = "insert into X_birdDescription (birdId, Description, Pictures, Sounds, DistributionMap) values ('"+birdId+"','"+escaped_desc+"','"+escaped_pictures+"','"+escaped_sounds+"','"+escaped_map+"')";
	
								var delete_stmt = "Delete from x_Birds where birdId='"+ birdId +"'";

								console.log("\n: Insert in X_birdDescription:" + insert_stmt);
								con.query(insert_stmt, function (err, result, fields)
								{
									if (err) 
									{
										console.log("\n: Deleting row from x_Birds:" + delete_stmt);
										con.query(delete_stmt,function (del_err, del_result, del_fields)
										{
										if (del_err) 
										{
											throw del_err;
										}
									console.log ("Successfully deleted row from x_Birds due to FAILURE in insertion to x_birdDescription "+birdId );
									/*Need to be handled gracefully, without shutting down the server.*/
									res.send('<p> Input Data incompatible with database. Please check log for error description</p>');
							     //throw err;
								       });
						            }

							
						           var birdDescId = result.insertId;
            						console.log ("X_birdDescription Successfully returned Index "+birdDescId );
			            			res.redirect ("/");
					            });
					}//else when x_Birds got inserted successfully
				});
		}
		else //entry is present. 
		{
			console.log ("Entry already present for "+sciName);
			res.send ("<p> Entry already present in Database </p>");
		}
	});
}

exports.checkIfExists = function (req, res, con) {
	var query_stmt = "select * from X_birds where CommonName='"+req.query.cname+"'";
	con.query(query_stmt, function (err, result, fields) 
	{
		var msg;
		if (err)
			throw err;
		if (result.length > 0)
		{
			console.log ("checkIfExists: Record Exists for "+req.query.cname);
			msg = "Record Exist for '"+req.query.cname+"'";
			res.send(msg);
			//res.sendFile(__dirname + '/feedBirds.html');
		}
		else
		{
			console.log ("checkIfExists: Record Does not Exists for "+req.query.cname);
			msg = "Record Does not Exist for '"+req.query.cname+"'";
			res.send(msg);
		}
	});
}
