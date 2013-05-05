window.E = first:true
$ = jQuery
Showdown = window.Showdown
Prism = window.Prism

window.deanApp = deanApp =  angular.module('deanApp', ['ui']).config ($routeProvider, $locationProvider) ->
	$locationProvider.html5Mode true
	$routeProvider
		.when('/',
		controller: 'FeedCtrl'
		templateUrl: '/partials/articles.html'
		)
		.when('/preview',
		controller:'FeedCtrl'
		templateUrl: '/partials/articles.html'
		)
		.when('/:slug',
		controller: 'SingleCtrl'
		templateUrl:'/partials/article.html'
		)

.directive 'markdown', -> 
	restrict:'E'
	replace: true
	scope: 
		cont:'='
	link: (scope, element, attrs) -> 
		scope.$watch 'cont', (n, p) ->
				if typeof n is 'string'
					converter = new Showdown.converter()
					htmlText = converter.makeHtml n
					element.html htmlText
					if typeof Prism is 'object'
						Prism.highlightAll()
				else
					element.html n
.directive 'editor', ->
	(scope, element, attrs) ->
		$(element).keydown (e) ->
			if e.keyCode is 9
				start = this.selectionStart
				end = this.selectionEnd
				$this = $ this
				value = $this.val()
				$this.val value.substring(0, start) + "\t" + value.substring(end)
				this.selectionStart = this.selectionEnd = start + 1
				e.preventDefault()

.directive 'uploadFile', ->
	(scope, element, attrs) ->
		formdata = false
		input = element[0]
		input.addEventListener "change", (evt) ->
			console.log 'uploading'
			formdata = new FormData()
			if window.FileReader
				for file in this.files
					reader = new FileReader()
					reader.onloadend = (e) ->
					reader.readAsDataURL file
					if formdata
						formdata.append "file", file

				if FormData
					$.ajax 
						url: "/upload"
						type: "POST"
						data:formdata
						processData: false
						contentType: false
						success: (res) ->
							scope.addImage res
		,false

window.FeedCtrl = ($scope, $http, $rootScope)->
	$scope.items = []
	$scope.newImages = []
	$scope.newItem = {}
	$scope.adding = false
	$scope.isAdmin = false

	$scope.addImage = (res) ->
		$scope.newImages.unshift res.data
		$scope.images.push res.data
		$scope.$apply()

	$scope.addImageToContent = (item) ->
		content = item.contentTmp
		if this.image.isImage
			imageString = "<img src='#{this.image.path}' />"
		else
			imageString = "<a href='#{this.image.path}'>#{this.image.name}</a>"

		if content is not undefined 
			item.contentTmp += imagesString
		else
			item.contentTmp = imageString

	$scope.isImage = (item) ->
		item.isImage

	$scope.isFeatureImage = (item) ->
		if item.featureImage is this.image.path
			true
		else
			false

	$scope.featureImageToggle = (item, flag) ->
		if flag
			item.featureIMage = thisimage.path
		else
			delete item.featureImage

	$scope.refreshImages = ->
		$('#SpinnerWrap').addClass 'act'
		$http.get('/_api/images')	
			.then (result)->
				$('#SpinnerWrap').removeClass 'act'
				$scope.images = result.data.data

	$scope.finalize = ->
		if E.first
			$('#SpinnerWrap').removeClass 'act'
			E.first = false

	$scope.refresh = ->
		$http.get('/_api/list')
			.then (result)->
				$scope.isAdmin = result.data.isAdmin
				$scope.items = result.data.data
				x['contentTmp'] = x['content'] for x in $scope.items
				E.e = $scope
				$scope.finalize()
				if $scope.isAdmin
					$scope.refreshImages()

	$scope.imageFlag = (flag, item) ->
		if item is undefined
			this.item.imageFlag = flag
		else
			item.imageFlag = flag

	$scope.save = ->
		data = this.item
		data.content = data.contentTmp
		ref = this
		$('#SpinnerWrap').addClass 'act'
		$http.post('/_api/update', data)
			.then (result) ->
				$('#SpinnerWrap').removeClass 'act'
				if result.data.error is 0
					ref.item.edit = false
					ref.item.message = "updated."
				else
					ref.item.message = "update failed"

	$scope.copyContent = (item) ->
		item.content = item.contentTmp

	$scope.remove = ->
		data = this.item
		ref = this
		check = confirm "Delete #{data.name}?"
		if check
			$http.get("/_api/remove/#{data.slug}")
				.then (result) ->
					if result.data.error is 0
						ref.item.message = "deleted."
						hash = ref.item['$$hashKey']
						$scope.items.splice(v, 1) for x,v in $scope.items when x['$$hashKey'] is hash
					else
						ref.item.message = "Removal failed."

	$scope.prepareCategories = (cats) ->
		if typeof cats is 'object'
			cats.join ', '
		else
			cats

	$scope.editMode = (item, flag) ->
		item.edit = flag

	$scope.addMode = (flag) ->
		$scope.adding = flag
		if flag
			$scope.newItem = {}

	$scope.addNew = ->
		item = $scope.newItem
		item.content = item.contentTmp
		console.log $scope.newItem
		$http.post('/_api/add', item)
			.then (result) ->
				if result.data.error is 0
					console.log result, 'Hi there!'
					result.data.data.data.contentTmp = result.data.data.data.content
					$scope.items.push result.data.data.data
					$scope.newItem = {}
					$scope.adding = false	
				else
					$scope.newItem.message = result.data.message

	$scope.FB_Share = (item) ->
		FB.ui
			method: 'feed'
			link: "#{location.origin}/#{item['slug']}"
			name: item['title']

	$scope.order = (item) ->
		1

	if $rootScope.items is not undefined
		$scope.items = $rootScope.items
	else
		$scope.refresh()

window.SingleCtrl = ($scope, $http, $rootScope, $routeParams) ->
	slug = $routeParams.slug
	items = $rootScope.items

	$scope.refreshSlug = (slug, save) ->
		$http.get("/_api/#{slug}").then (res) ->
			if res.data.error is 0
				$scope.item = res.data.data
				if save and ($rootScope.items is not undefined)
					$rootScope.items.push res.data.data
			else
				$scope.item = 
					name:'Uh oh.. we can\'t seem to find that page.'
					content: 'Sorry, but no.'
	if items is undefined
		$scope.refreshSlug slug, true	
	else
		item = items[x] for x in items when x['slug'] is slug
		if item
			$scope.item = item
		else
			$scope.refreshSlug slug, true	

	$scope.$on '$viewContentLoaded' , ->
		if $(window).width() < 641
			$('.meta').addClass('act')
		else
			setTimeout ->
				$('meta').addClass('act')
			, 1250
