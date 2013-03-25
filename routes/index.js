
/*
 * GET home page.
 */
 mongoose = require('mongoose');
 mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

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

/**DEFINE SCHEMAS**/
var articleSchema = mongoose.Schema({
  name:String,
  slug: String,
  date: { type: Date, default: Date.now }, 
  weight: Number,
  content: String,
  hidden: Boolean,
  category:[String]
});

var Article = mongoose.model('Article', articleSchema);
var query = Article.find();


exports.index = function(req, res){
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
	data.slug = convertToSlug(data.name);
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

exports.loginForm = function(req, res) {
	
	if (!req.session.user_id) {
		res.sendfile('private/login.html');
	} 
	else
	{
		res.redirect(301,'/');
	}

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
		res.send('crawler');
	} else
	{
		res.sendfile('private/index.html');
	}
}
