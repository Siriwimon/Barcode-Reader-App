
var myApp = angular.module('myApp', []);

myApp.directive('fileModel', ['$parse', function ($parse) {
        return {
           restrict: 'A',
           link: function(scope, element, attrs) {
              var model = $parse(attrs.fileModel);
              var modelSetter = model.assign;
 
              element.bind('change', function(){
                 scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                 });
              });
           }
        };
}]);

myApp.controller('AppCtrl', ['$scope', '$http', '$timeout', '$window', function($scope, $http, $timeout,$window) {
    console.log("Hello World from controller");

    var refresh = function(){
    	$http.get('/studentlist').success(function (response){
    		console.log("I got the data I requested");
    		$scope.studentlist = response;
    		$scope.student ="";
            console.log($scope.studentlist);
   	 	});
	};

	refresh();

    
    $scope.addList = function(){
    	console.log($scope.student);
    	$http.post('/studentlist',$scope.student).success(function(response){
    		console.log(response);
    		refresh();
    	});
    };

    $scope.remove = function(id){
    	console.log(id);
    	$http.delete('/studentlist/' + id).success(function(response){
    		refresh();
    	});
    };

    $scope.edit = function(id) {
    	console.log(id);
    	$http.get('/studentlist/' + id).success(function(response) {
    		$scope.student = response;
    	});
    }; 

    $scope.update = function(){
    	console.log($scope.student._id);
    	$http.put('/studentlist/' + $scope.student._id, $scope.student).success(function(response){
    		refresh();
    	});
    };

    $scope.deselect = function(){
    	$scope.student = "";
    };    

    $scope.find = function(){
        console.log($scope.searchBox);
        //var searchBox = "";
        $http.get('/studentlist/search/' + $scope.searchBox).success(function(response){
            $scope.res_student = response;
            $scope.this_student = "";
            $timeout(function(){
                $scope.searchBox = "";
            },1000);                        
        });        
    };


    $scope.fileName = function(ele){
        var files = ele.files;      //try sending element to server.
        var l = files.length;
        var namesArr = [];
        
        console.log(ele);
        console.log(files);
        for (var i = 0; i < l; i++) {
            namesArr.push(files[i].name);

        };
        console.log(namesArr);
        $scope.namesString = namesArr.join(' ,');
        $scope.$apply();
        console.log("File Name :"+$scope.namesString);

        var reader = new FileReader();
        
        reader.onload = function () {
          $scope.fileContent = reader.result;     //string
          $scope.$apply();
          console.log(typeof $scope.fileContent);
          text = $scope.fileContent;
          lineList = text.split('\n');
          lineList.shift();
          //$scope.content = lineList;
          console.log(lineList)
        }
        reader.readAsText(ele.files[0]);
    };

    // $scope.progressUpload = "0";

    $scope.uploadFile = function(){
        var file = $scope.myFile;
        var fd = new FormData();
        fd.append('file',file);
        console.log(fd);
        $http.post('/uploadfiles',fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).success(function (response){
            console.log("I got the data I requested"); 
            // $scope.progressUpload = "100";
            $scope.resUpload = "Finished ...";            
            refresh();           
            $scope.namesString = "";
        });
    }; 

    $scope.clearContent = function(){
        $scope.fileContent = "";
        $scope.namesString = "";
        $scope.resUpload = ""
    };

    $scope.exportFile = function(){
        $http.get('/export').success(function (response){
            $scope.resExport = "Ready to download";
        });

    };

    $scope.downloadFile = function(){
        $http.get('/download').success(function (response){
            filedownload = response;
            $window.open(filedownload, '_blank');
            // $window.open('/download?foo=bar&xxx=yyy');
        });

    };

    $scope.clearFileExport = function(){
        $http.get('/download/clear').success(function(response){
            console.log('clear all file in ./export/')
        });
    };

}]);