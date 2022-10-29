//
// API to fetch region codes of INDIA
// https://ebird.org/ws1.1/ref/location/list?rtype=subnational2&fmt=xml&countryCode=IN

const https = require('https');
var fs = require('fs');

exports.search = function (req, res, con) {
	console.log (req.body);

	var cnt = 1;
	var cname = "";
	var id = "";
	var lat;
	var lng;
	var url;
	if (req.body.mapCityDropDown)
	{
		console.log ("Region Selected: " + req.body.loc.toString());
		url = '/ws2.0/data/obs/'+req.body.loc.toString()+'/recent';
	}
	else
	{
		var result = req.body.loc.split(",");
		var lat = result[0];
		var lng = result[1];
		console.log ("Coord Selected: " + req.body.loc.toString());
		url = '/ws2.0/data/obs/geo/recent?dist=5&lat='+lat+'&lng='+lng;
	}
	//ebird data fetch
	{
		const options = {
			hostname: 'ebird.org',
			port: 443,
			path: url,
			method: 'GET',
			json:true,
			headers:
			{
				'X-eBirdApiToken': 'kuhjj9d4naag'
			}
		}

		const ebirdreq = https.request(options, function(ebirdres) 
		{
			console.log("statusCode: "+ebirdres.statusCode);
			if (ebirdres.statusCode != 200)
			{
				ebirdreq.end();
				res.send("Error from Ebird fetch API");
				return;
			}
			var jsondata = '';
			ebirdres.on('data', function(d) {
				jsondata += d;
			});
			ebirdres.on('end', function() 
			{
				fs.writeFileSync('ebird.json', jsondata)
				var obj = JSON.parse(jsondata);
				var sciNames = '';
				for (var j = 0; j < obj.length; j++)
				{
					sciNames += "'"+obj[j].sciName+"'";
					if (obj.length - j != 1)
					{
						sciNames += ",";
					}
				}
				console.log ("SciNames from Ebird: "+sciNames);
				if (sciNames == '')
				{
					ebirdreq.end();
					res.send("No Result from Ebird fetch API");
					return;
				}
				// Data reception is done, do whatever with it!
				var plumage = 0;
				if (req.body.Plumage)
				{
					for (var j = 0; j < req.body.Plumage.length; j++)
						plumage += parseInt(req.body.Plumage[j], 10);
				}
				var behaviour = 0;
				behaviour = parseInt(req.body.Behaviour, 10);
				
				var habitat = 0;
				if (req.body.Habitat)
				{
					for (var j = 0; j < req.body.Habitat.length; j++)
						habitat += parseInt(req.body.Habitat[j], 10);
				}
				
				if (req.body.Size)
				{
					var size = req.body.Size;
					var query_stmt = "select * from X_birdsizes where sizeId='"+parseInt(size, 10)+"';";
					con.query(query_stmt, function (err, initialresult, initialfields) 
					{
						if (err)
							throw err;
						if (initialresult.length == 1)
						{
							var lower = initialresult[0].lowerLimit;
							var upper = initialresult[0].upperLimit;
							var query_stmt = "select * from X_birds A where A.ScientificName IN ("+sciNames+");";
							con.query(query_stmt, function (err, result, fields) 
							{
								if (err)
									throw err;
								if (result.length > 0)
								{
									for (var i = 0; i < result.length ; i++ )
									{
										if (result[i].Size > lower)
										{
											if (result[i].Size < upper)
											{
												console.log ("Result set based on Size:    "+result[i].CommonName);
												//now we have zeroed in to the number of birds matching the size criteria
												//now match the colors in the constricted result set
												if ((result[i].Plumage & plumage) == plumage)
												{
													console.log ("Result set based on Plumage: "+result[i].CommonName);
													if ((result[i].Behaviour & behaviour) == behaviour)
													{
														console.log ("Result set based on Behaviour: "+result[i].CommonName);
													    if ((result[i].Habitat & habitat) == habitat)
														{
														  console.log ("Result set based on Habitat: "+result[i].CommonName);
														  cname += cnt+". "+result[i].CommonName+"\n";
														  cnt = cnt + 1;
														  if ((cnt > 2))
														  {
															id += ",";
														  }
														  id += result[i].birdId;
	
														}															
																											}
												}
											}
										}
									}
								}
								if (cname == '')
								{
									res.send("No Match Found");
									return;
								}
								console.log("searchBirdNames: Size "+cname);
								//send images path comma separated
								{
									var str = id.substring(0, id.length - 1);
									var stmt = "select * from X_birdDescription where birdId IN ("+id+");";
									con.query(stmt, function (err, result, fields)
									{
										if (err) 
											throw err;
										var birdimages = "";
										var img;
										for (var i = 0; i < result.length ; i++ )
										{
											birdimages += result[i].Pictures;
											//img = fs.readFileSync(result[i].Pictures);
											if (result.length - i != 1)
											{
												birdimages += ",";
											}
										}
										console.log ("Returning "+birdimages);
										res.send(birdimages);
									});
								}
							});
						}
					});
				}
			});
		});
		ebirdreq.on('error', (error) => {
			console.error(error);
			res.send("Error from Ebird fetch API");
		});

		ebirdreq.end();
	}
}