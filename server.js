var express = require('express');
var app = express();
var mongojs = require('mongojs');
var db = mongojs('studentlist',['studentlist']);
var bodyParser = require('body-parser');

var dbName = 'studentlist';
var collectionName = 'studentlist';

//			+++++ Upload File to Server +++++ 
var multer = require('multer'); 
var dbFile = mongojs('filelist',['filelist']);
//			+++++ Import File to MongoDB +++++
const exec = require('child_process').exec;

var pathImport = '/uploads/filelist/'
var filePath = './public' + pathImport;

var url = 'http://localhost:8080';

var timestampstamp = '';

var fileExport = '';
var pathExport ='/exports/';
var pathProject = '/home/jaa/Documents/Barcode-Reader/Barcode-Reader-App-Ver1.2/public';


var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {		//directory /public/uploads/studentlist
            cb(null, filePath)
        },
        filename: function (req, file, cb) {
            
            timestamp = new Date();
			day = timestamp.getDate();
			month = timestamp.getMonth();
			year = timestamp.getFullYear();
			hour = timestamp.getHours();
			min = timestamp.getMinutes();
			sec = timestamp.getSeconds();			

			datetimestamp = [year,month,day,hour,min,sec].join('-');

            cb(null, file.originalname.split('.',1) + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
            
        }
    });

var upload = multer({ //multer settings
                storage: storage,
                fileFilter : function(req, file, callback) { //file filter
                    if (['csv'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
                        return callback(new Error('Wrong extension type'));
                    }
                    callback(null, true);
                }
            }).single('file');


app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

app.get('/studentlist', function (req, res){
	console.log("I recieve a GET request")

 	db.studentlist.find(function (err, docs){
 		console.log(docs);
 		res.json(docs);
 	});
});

app.post('/studentlist',function (req,res){
	console.log(req.body);
	db.studentlist.insert(req.body, function(err,doc){
		res.json(doc);
	});
});

app.delete('/studentlist/:id', function (req, res){
	var id = req.params.id;
	console.log(id);
	db.studentlist.remove({_id: mongojs.ObjectId(id)}, function (err,doc){
		res.json(doc);
	});
});

app.get('/studentlist/:id', function (req, res){
	var id = req.params.id;
	console.log(id);
	db.studentlist.findOne({_id: mongojs.ObjectId(id)}, function (err, doc){
		res.json(doc);
	});
});

app.put('/studentlist/:id', function (req, res) {
	var id = req.params.id;
	console.log(req.body.student_id);
	db.studentlist.findAndModify({query: {_id: mongojs.ObjectId(id)}, 
		update: {$set: {student_id: req.body.student_id, id_code: req.body.id_code, rfid_code: req.body.rfid_code}},
		new: true}, function (err, doc) {
			res.json(doc);		
	});
});

app.get('/studentlist/search/:text', function (req,res) {
	var text= req.params.text;
 	console.log(text);
 	db.studentlist.createIndex({ "$**": "text" },{ name: "TextIndex" });
 	db.studentlist.find({"$text": {"$search": text}}, function(err, doc) {
 		console.log(doc); 
 		res.json(doc);
 	});
});

app.post('/uploadfiles', function(req, res) {
	console.log('Recieve request to Import File from controller.js')
     
    upload(req,res,function(err){
        if(err){
             res.json({error_code:1,err_desc:err});
             return;
        }
        /** Multer gives us file info in req.file object */
        if(!req.file){
            res.json({error_code:1,err_desc:"No file passed"});
            return;
        }
        

        console.log(req.file.originalname.split('.',1))
        console.log(req.file.path);

        fileImport = '/home/jaa/Documents/Barcode-Reader/Barcode-Reader-App-Ver1.2/' + req.file.path;

        // child process to import csv file to MongoDB
        exec('mongoimport -d ' + dbName + ' -c ' + collectionName + ' --type csv --file ' + fileImport + ' --headerline', (error, stdout, stderr) => {
		  if (error) {
		    console.error(`exec error: ${error}`);
		    return;
		  }
		  console.log(`stdout: ${stdout}`);
		  console.log(`stderr: ${stderr}`);
		  res.json(`${stderr}`);
		});

        dbFile.filelist.insert({
	    	upload_time: datetimestamp,
	    	filename: req.file.filename,
	    	path: req.file.path,
	    	url: url + pathImport + req.file.filename
    	},function(err,doc){
    		console.log('Import Success');
    	});
        // res.json('Success');             
    });


       
});


app.get('/export',function(req,res){
	fileExport = '';
	var datetime = new Date();
			day = datetime.getDate();
			month = datetime.getMonth();
			year = datetime.getFullYear();
			hour = datetime.getHours();
			min = datetime.getMinutes();
			sec = datetime.getSeconds();			

			extime= [year,month,day,hour,min,sec].join('-');
	fileExport = 'studentlist-' + extime + '.csv';
	// pathProject = '/home/jaa/Documents/Barcode-Reader/Barcode-Reader-App-Ver1.2/public'
	
	exec('mongoexport --db '+ dbName + ' --collection ' + collectionName + ' --out '+ pathProject + pathExport + fileExport, (error, stdout, stderr) => {
  		if (error) {
    		console.error(`exec error: ${error}`);
    		return;
  		}
  		console.log(`stdout: ${stdout}`);
  		console.log(`stderr: ${stderr}`);
  		res.json(`stderr: ${stderr}`);
	});
});

app.get('/download',function(req,res){
	var file = url + pathExport + fileExport;
	res.json(file);
	console.log(file);	
	//fileExport = '';
	// res.download(pathProject+pathExport+fileExport,fileExport);
	//res.json(fileExport);
});

app.get('/download/clear',function(req,res){
	fileExport = '';
	exec('rm -f ' + pathProject + pathExport + '*', (error, stdout, stderr) => {
  		if (error) {
    		console.error(`exec error: ${error}`);
    		return;
  		}
  		console.log(`stdout: ${stdout}`);
  		console.log(`stderr: ${stderr}`);
  		res.json(`stderr: ${stderr}`);
	});
});




app.listen(8080);
console.log("Server running on port 8080");