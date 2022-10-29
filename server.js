//Mysql

//Using a Relational DB
var mysql = require('mysql'); 
var db_config = { host : 'localhost', user : 'root', password : 'dbpassword', database : 'birds',};
var sqlcon = mysql.createConnection(db_config);
sqlcon.connect(function(err) 
{
	if (err) 
		throw err;
	console.log(timestamp('DD-MM-YYYY hh:mm:ss:iii'),"DB Connected!");
});
//Mysql



//Media folder
var fs = require('fs'); // set the FS- filesystem

var globalDir =  "./Media/";
!fs.existsSync(globalDir) && fs.mkdirSync(globalDir);

var bodyParser = require('body-parser')


var timestamp = require('console-timestamp');

var fileupload = require("express-fileupload");

const url = require('url');


var feedData = require('./feedData.js');
var browseBirds = require('./browseBirds.js');
var searchBird = require('./searchBird.js');



const express = require('express');
const app = express();


app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(fileupload());


app.use('/Media', express.static(__dirname + '/Media'));
app.use(express.static('public'));

var server = app.listen(2000, function () 
{
	var host = server.address().address;
	var port = server.address().port;
	console.log(timestamp('DD-MM-YYYY hh:mm:ss:iii'),"GoBirder app listening at http://"+host+":"+port);
})

app.get('/', function(req,res) 
{
	res.sendFile(__dirname + '/index.html');
});

app.get('/fetchBirdsbyGrp', (req, res) => 
{
	browseBirds.fetchBirdNames(req, res);
	
});

app.get('/fetchBirdGroups', (req, res) => 
{
	browseBirds.fetchBirdsClassification(req, res, sqlcon);
	
});

app.get('/browseBirds', (req, res) => 
{

res.sendFile(__dirname + '/browseBirds.html');

});

app.get('/feedBirds', (req, res) => 
{
	//serve the html page
    res.sendFile(__dirname + '/feedBirds.html');

});


app.get('/checkIfExists', (req, res) => 
{
	feedData.checkIfExists(req, res, sqlcon);
});


app.post('/feedData', (req, res) => 
{
	//submit request from html page
	console.log(req.body);
	if (!req.files)
		return res.status(400).send('No files were uploaded.');
	var name = req.body.Name;
	var mediaDir = globalDir+name+"/";	
	!fs.existsSync(mediaDir) && fs.mkdirSync(mediaDir);

	//handle Media files
	feedData.copyMediaFiles(req.files.Photo, mediaDir+"Photos/", fs);
	feedData.copyMediaFiles(req.files.Sounds, mediaDir+"Sounds/", fs);
	feedData.copyMediaFiles(req.files.Map, mediaDir+"DistributionMap/", fs);

	//handle rest of the text data
	feedData.insertData (req, res, sqlcon, mediaDir);

}); 

//First getthe html and then worry about the result 

app.get('/Bird-Identifier', (req, res) => 
{
	//fetch the CommonNames and populate a drop down
	res.sendFile(__dirname + '/Bird-Identifier.html');
});

app.post('/Bird-Identifier', (req, res) => 
{
	//fetch the CommonNames and populate a drop down
	searchBird.search(req, res, sqlcon);
});



