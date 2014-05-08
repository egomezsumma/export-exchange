// TO INSTALL
// sudo apt-get install mongodb-server
// npm install express
// npm install mongodb
// npm install mongoose

//===========================================================================//
// REQUIRED                                                                  //
//===========================================================================//
var http     = require('http');
var express  = require('express');
var request  = require('request');
var fs       = require('fs');
var mongoose = require('mongoose');

//===========================================================================//
// GLOBALS VAR                                                               //
//===========================================================================//

// DB                                                                        //
var dbname = 'mongodb://127.0.0.1:27017/dbtest';
var schema = { from: String, to: String, rate : Number, date : { type: Date, default: Date.now }};
var dbconected = false;
var CurrencyClass;

// Miscelaneous
var apiCurrency   = 'http://rate-exchange.appspot.com/currency';
var file          = __dirname + '/currencys.json';
var currencyCodes = eval('(' + fs.readFileSync(file).toString() +')');
var app           = express();

//Descomentar para correr desde consola la tarea
//main();

//===========================================================================//
// SERVICES                                                                  //
//===========================================================================//
app.get('/', function(req, res) 
{
	getAllExchangesAndSave(currencyCodes, res);
	/*getAllCurrencyChange(
		currencyCodes, 
		function(changes)
		{
			saveInDB(changes);
			
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(JSON.stringify(changes));			
		}
	)*/
});

app.get('/:from/:to', function(req, res) 
{
	getOneChangeFromRequest(
		req,
		function(aChange)
		{
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write(JSON.stringify(aChange));
			res.end();
		}
	);
}); 

app.get('/:from/:to/:amount', function(req, res) 
{
	getOneChangeFromRequest(
		req,
		function(aChange)
		{
			res.writeHead(200, {'Content-Type': 'text/plain'});
    		aChange.amount = aChange.rate * req.params.amount;
    		res.write(JSON.stringify(aChange));
    		res.end();
		}
	);
}); 


function getAllExchangesAndSave(currencyCodes, res)
{
	getAllCurrencyChange(
		currencyCodes, 
		function(changes)
		{
			saveInDB(changes);
			
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(JSON.stringify(changes));			
		}
	)
}

function main()
{
	var doNothing = function () {};
	var res = {}
	res.writeHead = doNothing;
	res.end = doNothing;
	getAllExchangesAndSave(currencyCodes,res);
}

//===========================================================================//
// FUNCTIONS                                                                 //
//===========================================================================//
function getOneChangeFromRequest(req, callback)
{
//	var changes = [];
	getCurrencyConverted(
		req.params.from, 
		req.params.to, 
		function(changes)
		{
			callback(changes);
		}
	);
}

function getAllCurrencyChange(codes, onFinish)
{
	var changes = [];
	asyncForEachMatrixWithoutDiagonal(
		currencyCodes,
		function(from,to,callback)
		{
			getCurrencyConverted(from, to, function(aChange) { changes.push(aChange); callback() });
		},
		function(){onFinish(changes);}
	);
}

/**
*	Iterate the combination of arr x arr and call the onFinish callback 
*   when the last combination was processed.
*       
*/
function asyncForEachMatrixWithoutDiagonal(arr, process, onFinish)
{
	var len = arr.length;
	var cantLoops = len*(len-1);
	for(var i = 0; i < len; i++)
		for(var j = 0; j < len; j++)
		{
			var callback = function(){ 
				cantLoops--; 
				if(cantLoops==0)
					onFinish(); // last in arrive call the finish handler
			};
			
			if(i!=j)
				process(arr[i], arr[j], callback);
		}
}

function asyncForEach(arr, process, onFinish)
{
	var len = arr.length;
	var cantLoops = len;
	for(var j = 0; j < len; j++)
	{
		var callback = function(){ 
			cantLoops--; 
			if(cantLoops==0)
				onFinish(); // last in arrive call the finish handler
		};
		
		if(i!=j)
			process(arr[j], callback);
	}
}


function getCurrencyConverted(from, to, callback)
{
	var fromto='from='+from+'&to=' + to;

	request.get(
		apiCurrency + "?" + fromto,
		{json: true}, 
		function(err, resp, body) 
		{
			if (err) 
				return console.error(err);

			callback(body);
			//if(body.hasOwnProperty("err"))	console.error(fromto);
		}
	);
}

function saveInDB(changes)
{
	tryToConnectDb(fixParams(onDbConectSucces,changes));
}

function tryToConnectDb(onSucces, onFail)
{
	onFail = onFail ? onFail : function (error) {console.log(error);};

	if(!dbconected) 
		mongoose.connect(dbname, function(err) { if (err) onFail(err); dbconected = true;} );
	
	var db = mongoose.connection;
	
	db.on('error', console.error.bind(console, 'connection error:'));

	db.once('open', onSucces);
}

function onDbConectSucces(changes) 
{
	//set the constructor of a change   								
	CurrencyClass = getSchema();

	//remove and then fill the collection
	removeAllDocs(CurrencyClass,
		function()
		{
			console.log("coleción Currency vaciada con exito");
			console.log("antes de guardar " +  changes.length + " cambios de " + currencyCodes.length + " monedas.");			
		  	changes.forEach(saveAChange);
		}
	);	
}

function getSchema()
{
	// yay!
	console.log("db connection ok");

	//Creating schema
	var currencySchema = mongoose.Schema(schema);

	//Defy methods										
	currencySchema.methods.convert = function (amount) { return this.rate*amount + " " + this.to}

	//Defy class object 
	return  mongoose.model('Currency', currencySchema);
}

function saveAChange(aChange)
{	  
	var aChangeDoc = new CurrencyClass(aChange);
	//console.log(aChangeDoc.convert(100)); 
	aChangeDoc.save(function (err, changeSaved) { if (err) return console.error(err);});	
}

function removeAllDocs(model, onFinish)
{
	model.collection.remove( function (err) { if (err) throw err; onFinish();});	
}

function fixParams(callback)
{
    var args = [].slice.call(arguments) // slice without parameters copies all
    args.shift();
    var res = function()
    {
    	var args2 = [].slice.call(arguments);
    	args = args.concat(args2);
    	callback.apply(this,args)
    };
    return res;
}

http.createServer(app).listen(3000, function(){
	console.log('listening on 3000\n');
});

