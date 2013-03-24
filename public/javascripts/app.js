var E = {};

var tabbifyTextarea = function(element){
	$("textarea").not('.prp').addClass('prp').keydown(function(e) {
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
}

var deanApp = angular.module('deanApp', ['ui']).directive('markdown', function() {
    var converter = new Showdown.converter();
    return {
        restrict: 'E',
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
        tabbifyTextarea(element);
    };

    }

});

function FeedCtrl($scope, $http) {
  $scope.items =[];
  E.e = $scope;
    $scope.$on('$viewContentLoaded', function() {
    	tabbifyTextarea();
    	console.log('hi');
    });

    $scope.isAdmin  = false;

	$scope.refresh = function() {
		$http.get('/_api/list').then( function(result) {
				$scope.isAdmin = result.data.isAdmin;
		        $scope.items =result.data.data;
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

	$scope.new = {};
	$scope.adding = false;
	$scope.addMode = function(flag) {
		$scope.adding = flag;
		if (flag) {
			$scope.new = {};
		}
	}

	$scope.addNew = function() {
		$.post('/_api/add', $scope.new).then( function(result) {
			if (result.data.error == 0){
				$scope.items.push(result.data.data);
				$scope.new = {};
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
	$scope.refresh();
}