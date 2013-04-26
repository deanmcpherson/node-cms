
/*
* GET home page.
*/
var mongoose = require('mongoose'),
fs = require('fs');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
var md = require("node-markdown").Markdown;

/**DEFINE SCHEMAS**/

function loadSchema (name) {
	var schemas = mongoose.Schema({
		name:String,
		schema:[array]
	});

	var Schemas = mongoose.model('Schema', schemas);

	Schemas.findOne({'name':name}).exec( function(err, schema) {
		if (!err) { 
			return schema;
		} 
		else
		{
			return err;
		}
	});
}

var articleSchema = mongoose.Schema({
	name:String,
	slug: String,
	date: { type: Date, default: Date.now },
	lastModified: {type: Date, default:Date.now},
	weight: Number,
	content: String,
	featureImage: String,
	hidden: Boolean,
	category:[String]
});

var Article = mongoose.model('Article', articleSchema);
var query = Article.find();

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.send({isAdmin:false});
  } else {
    if(typeof(next) != 'function'){
  res.send({isAdmin:true});
  }else
  {
    next();
  }
  }
}

function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
        ;
}

function wrapper(req, res, data){
	if (!req.session.user_id) {
		res.send({
			isAdmin:false,
			count:data.length,
			error:0,
			data:data
		});
  }
  else
  {
  	res.send({
			isAdmin:true,
			count:data.length,
			error:0,
			data:data
		});
  }
}

exports.addBySchema = function(req, res) {
	var schema = loadSchema(schema);
	var newEntry = new schema(req.body);
	newEntry.save(function (err) {
	  if (err)
	 res.send(err);
	});

	wrapper(req, res, {error:0, data:newEntry});
}

exports.newSchema = function(req, res){
	data = req.body;

	if (data.name === undefined) {
		res.send({error:1, message:'No name received.'});
		return;
	} 
	else if (data.schema === undefined)
	{
		res.send({error:1, message:'No schema received.'});
		return;
	}

	var schemas = mongoose.Schema({
		name:String,
		schema:[array]
	});

	var Schemas = mongoose.model('Schema', schemas);
	var newSchema = new Schemas({name:data.name, schema:data.schema});
	newSchema.save(function(err) {
		if (err) {
			res.send({err:1, message: 'Failed saving to db.'});
		}
		else
		{
			wrapper(req, res, newSchema);
		}
	});
}

exports.index = function(req, res){
	if (!req.session.user_id) {
 	 res.sendfile('private/index.html');
 	} 
 	else
 	{
 		res.sendfile('private/admin.html');
 	}
};

exports.preview = function(req, res){
 	 res.sendfile('private/index.html');
};


exports.list = function(req, res){
	query.exec(function(err,docs){
		if (!err){
			wrapper(req, res, docs);
		} else {
			res.send(err);
		}
	});
}

exports.get = function(req, res){
	slug = req.params.id;
	Article.findOne({'slug':slug}).exec(function(err,docs){
		if (!err){
			if (docs){
				wrapper(req, res, docs);
			} 
			else 
			{
				res.send({error:1, message:"item not found."})
			}
		} 
		else 
		{
			res.send({error:1, message:"item not found."});
		}
	});
}

exports.auth = function(req, res) {
	checkAuth(req, res);
}

exports.add = function(req, res){
	var data = req.body;
	if (data.name != undefined) {
		data.slug = convertToSlug(data.name);
	}
	var article = new Article(data);
	article.save(function (err) {
	  if (err) // ...
	 res.send(err);
	});

	wrapper(req, res, {error:0, data:article});
}

exports.update = function(req, res){
	var data = req.body;
	Article.findOne({'_id':data._id}).exec(function(err,docs){
		if (!err){
			if (docs){
				for (x in data){
					docs[x] = data[x];
				}
				docs['slug'] = convertToSlug(data.name);
				
				docs['lastModified'] = Date.now();
				docs.save(function(err) {
					if (err) {
						res.send({error:1, message:"Something went wrong during the update process."});
					} else {
						res.send( {error:0, message:"updated " +data._id})
					}
				});
			} 
			else 
			{
				res.send({error:1, message:"item not found."});
			}
		} 
		else 
		{
			res.send({error:1, message:"item not found."});
		}
	});
}

exports.remove = function(req, res){
	slug = req.params.id;
	Article.findOne({'slug':slug}).exec(function(err,docs){
		if (!err){
			if (docs){
				docs.remove(function(err, product){
					if (err) {
		
						res.send({error:1, message:"Something went wrong."});
					} 
					else
					{
		
						res.send({error:0, message:"Success!"});
					}
				});
			} 
			else 
			{
				res.send({error:1, message:"item not found."})
			}
		} 
		else 
		{
			res.send({error:1, message:"item not found."});
		}
	});
}

exports.login = function(req, res){
	var post = req.body;
	if (post.username == 'admin' && post.password == 'test') {
		req.session.user_id = 'admin';
		res.send({errors:0, isAdmin:true});
	} else {
		res.send({errors:1, isAdmin:false});
	}
}

exports.logout = function(req, res) {
		if (req.session.user_id !== undefined) {
			delete req.session.user_id;
		}
		res.send('Logged out.');
}

exports.loginForm = function(req, res) {
		res.sendfile('private/login.html');
}

exports.drop = function(req, res) {
	Article.find().exec(function(err, docs){
		for (var doc in docs) {
			var x = docs[doc];
			x.remove();
		}
		res.send('hi');
	});
}

exports.static = function(req, res) {
	if (req.query !== undefined && req.query._escaped_fragment_ !== undefined) {
		var slug = req.params.id;
		Article.findOne({'slug':slug}).exec(function(err,docs){
			if (!err){
				if (docs){
					console.log(docs);
					var html = "<h1>" + docs.name +"</h1>";
						html += md(docs.content);
					res.send(html);
				} 
				else 
				{
					res.send(404);
				}
			} 
			else 
			{
				res.send(404);
			}
		});
	} else
	{
		res.sendfile('private/index.html');
	}
}

exports.images = function(req, res) {
	var path = "public/images"
	fs.readdir(path, function(err, data){
		if (err) { res.send({errors:1, message:err}); return; }
		var newData = [];
		for(var x in data) {
			var d = {};
			d.name = data[x];
			d.path = 'images/' + data[x];
			d.isImage = (/\.(gif|jpg|jpeg|tiff|png)$/i).test(d.name);
			newData.push(d);
		}
		res.send({errors:0, message:'Success.', data: newData});
	});
}

exports.upload = function(req, res) {
	var file = req.files.file;

	fs.readFile(file.path, function (err, data) {
	  var newPath = "public/images/" + file.name;
	  fs.writeFile(newPath, data, function (err) {
			var d = {};
			d.name = file.name;
			d.path = 'images/' + d.name;
			d.isImage = (/\.(gif|jpg|jpeg|tiff|png)$/i).test(d.name);		
	    res.send({errors:0, message:"Successfully uploaded.", data:d});
	  });
	});
}