var E = {};

var deanApp = angular.module('deanApp', ['ui']).config(function($routeProvider, $locationProvider){
	 $locationProvider.html5Mode(true);
	$routeProvider.when('/', {
		controller:'FeedCtrl',
		templateUrl: '/partials/articles.html'
	}).when('/:slug', {
		controller: 'SingleCtrl',
		templateUrl: '/partials/article.html'
	});
}).directive('markdown', function() {
    return {
        restrict: 'E',
        replace: true,
        link: function(scope, element, attrs) {

            scope.$watch('cont', function(n, p) {
            	if (n !== undefined) {
	            	var converter = new Showdown.converter();
	            	var htmlText = converter.makeHtml(n);
		           	var tmp = element.html(htmlText);
		           	if (typeof Prism == 'object'){
		           		Prism.highlightAll();	
		           	}
	           	} else {
	           		element.html(htmlText);
	           	}
            });
        },
        scope: {
        	cont:'='
        }
    }
}).directive('editor', function() {
{
    return function (scope, element, attrs) {
        //tabbifyTextarea(element);
        $(element).keydown(function(e) {
	    if(e.keyCode === 9) { // tab was pressed
	        // get caret position/selection
	        var start = this.selectionStart;
	        var end = this.selectionEnd;

	        var $this = $(this);
	        var value = $this.val();

	        // set textarea value to: text before caret + tab + text after caret
	        $this.val(value.substring(0, start)
	                    + "\t"
	                    + value.substring(end));

	        // put caret at right position again (add one for the tab)
	        this.selectionStart = this.selectionEnd = start + 1;

	        // prevent the focus lose
	        e.preventDefault();
	    }
	});
    };

    }

}).directive('uploadFile', function() {
	 return function (scope, element, attrs) {
        formdata = false;
        function showUploadedItem (source) {
       	 console.log(source);
        }   
       console.log(element);
       var input = element[0];
        input.addEventListener("change", function (evt) {
            console.log('uploading');
            var formdata = new FormData();
            var i = 0, len = this.files.length, img, reader, file;
        
            for ( ; i < len; i++ ) {
                file = this.files[i];
                   
				if ( window.FileReader ) {
					reader = new FileReader();
					reader.onloadend = function (e) { 
						showUploadedItem(e.target.result, file.fileName);
					};
					reader.readAsDataURL(file);
				}
				if (formdata) {
					formdata.append("file", file);
				}           
            }
        
            if (formdata) {
                $.ajax({
                    url: "/upload",
                    type: "POST",
                    data: formdata,
                    processData: false,
                    contentType: false,
                    success: function (res) {
                    	scope.addImage(res);               
                    }
                });
            }
        }, false);
    };
});

function FeedCtrl($scope, $http, $rootScope) {

  $scope.items =[];
  $scope.newImages = [];
 
    $scope.addImage = function (res) {
    	$scope.newImages.unshift(res.data);
    	$scope.images.push(res.data);
    	$scope.$apply();
    }
    $scope.addImageToContent = function (item) {

	var content = item.content;
	if (this.image.isImage) {
	imageString = '<img src="'+this.image.path+'" />';
	} 
	else
	{
		imageString = '<a href="' + this.image.path+'">' + this.image.name + '</a>';
	}
	if (content != undefined) {
		item.content += imageString;
	} 
	else
	{
		item.content = imageString;
	}

}

    $scope.isImage = function(item) {
    	return item.isImage;
    }

    $scope.isFeatureImage = function(item) {
    	if (item.featureImage === this.image.path) {
    		return true;
    	}
    	else
    	{
    		return false;
    	}
    }

     $scope.featureImageToggle = function(item, flag) {
     	if (flag) {
     		item.featureImage = this.image.path;
     	}
     	else
     	{
     		delete item.featureImage;
     	}
     }

    $scope.refreshImages = function() {
    	$http.get('/_api/images').then( function(result) {
	        $scope.images =result.data.data;
	    });
    }

    $scope.isAdmin  = false;

	$scope.refresh = function() {
		$http.get('/_api/list').then( function(result) {
			$scope.isAdmin = result.data.isAdmin;
	        $scope.items =result.data.data;
	        $rootScope.items = $scope.items;
	        if ($scope.isAdmin) {
	        	$scope.refreshImages();
	        }
	    });
	}

	$scope.save = function() {
		var data = this.item;
		var ref = this;
		$http.post('/_api/update', data).then( function(result){

			if (result.data.error == 0) {
				ref.item.edit = false;
				ref.item.message = "updated.";
			} 
			else
			{
			
				ref.message = "update failed.";
			}
			console.log(ref);
		});
	}

	$scope.remove = function() {
		var data = this.item;
		var ref = this;
		var check = confirm('Delete ' + data.name +'?');
		console.log(data);
		$http.get('/_api/remove/'+ data.slug).then( function(result){
			if (result.data.error == 0) {
				ref.item.message = "deleted.";
				var hash = ref.item['$$hashKey'];
				console.log(hash);
				for (var x in $scope.items){
					if ($scope.items[x]['$$hashKey'] === hash){
						console.log('here', x);
						$scope.items.splice(x,1);
					}
				}
			} 
			else
			{
				ref.item.message = "Removal failed.";
			}
		});
	}

	$scope.editMode = function(item, flag) {
		item.edit = flag;
	}

	$scope.newItem = {};
	$scope.adding = false;
	$scope.addMode = function(flag) {
		$scope.adding = flag;
		if (flag) {
			$scope.newItem = {};
		}
	}

	$scope.addNew = function() {
		$.post('/_api/add', $scope.newItem).then( function(result) {
			if (result.data.error == 0){
				$scope.items.push(result.data.data);
				$scope.newItem = {};
				$scope.adding = false;
				$scope.$apply();
			}
		});
	}

	$scope.order = function(item){
		console.log(item);
		return 1;
		var d = item.date;
		var date = new Date(d);
		return date.getTime();
	}
	if ($rootScope.items !== undefined) {
  		$scope.items = $rootScope.items;
  } else {
  	$scope.refresh();
  }
}

function SingleCtrl($scope, $http, $rootScope, $routeParams) {
		var slug = $routeParams.slug,
		items = $rootScope.items;

		$scope.refreshSlug = function(slug, save) {
			$http.get('/_api/' +slug).then(function(res){
			if (res.data.error === 0) {
				console.log('hi!', res.data.data);
				$scope.item = res.data.data;
				if (save && $rootScope.items !== undefined) {
					$rootScope.items.push(res.data.data);
				}
			} 
			else
			{
				$scope.item = {
					name:'Uh oh.. we can\'t seem to find that page.',
					content: 'Sorry, but no.'
				};
			}
			});
		}

		for (var x in items) {
			if (items[x]['slug'] == slug) {
				item = items[x];
			}
		}
		if (items == undefined) {
			$scope.refreshSlug(slug, true);
		} else
		{
			$scope.item = item;
		}

		   $scope.$on('$viewContentLoaded', function(){
		   	if ($(window).width() < 641) {
			   $('.meta').addClass('act');
		   	} else {
		   		 setTimeout(function() {$('.meta').addClass('act');}, 1250);
		   	}
		   });

}