/**
 * Created by mudi on 01/07/16.
 */
var controllers = angular.module('controllers',['ui.grid', 'ui.grid.pagination']);
/**
 * controller for main page to handle login and registration
 */
controllers.controller('MainPageController',['$scope','General',function($scope,General){
    /**
     * method for opening login modal
     */
    $scope.login = function(){
        $scope.modalObject=General.makeModal(null,{
            templateUrl: 'partials/Users/LoginTemplate.html',
            controller: 'LoginController',
            keyboard :true
        },null);
    }
}]);
/**
 * controller for user login modal to handle login functionality
 */
controllers.controller('LoginController',['$scope','Users','$uibModalInstance','General',function($scope,Users,$uibModalInstance,General){
    $scope.user = {//init user object
        username:'',
        password:''
    };
    /**
     * method for closing modal
     */
    $scope.closeModal = function(){
        $uibModalInstance.close();
    };
    /**
     * method for handling user login
     * @param user {object} {username,password}
     */
    $scope.login = function(user){
        $scope.submitted = true; //for validation purpose
        $scope.error = {};//error object
        for(var index in user){//loop on user object to validate empty values and make required error
            if(user.hasOwnProperty(index)){
                if(user[index] == ''){
                    $scope.error[index] = index+' is required';
                }
            }
        }
        // if no error for empty values
        if(Object.keys($scope.error).length === 0){
            Users.login(user).then(function(response){
                //if no errors close open modal and redirect to videos screen
                Users.saveUser(response);
                $scope.closeModal();
                General.redirect('dashboard.users',null,null);
            },function(err){
                if(err.status === 404){
                    $scope.error['general'] = 'Wrong username or password';
                    return;
                }
                //in case of error open a model to show it with timeout of 5000
                General.makeModal(5000,{
                    templateUrl:'partials/infoModalTemp.html',
                    controller:'InfoModelController',
                    resolve:{
                        infoTemp : function(){
                            return {
                                class:'has-error',
                                msg:err.data
                            }
                        }
                    }
                },null);
            });
        }
    };
}]);
/**
 * controller for abstract view
 */
controllers.controller('DashboardController',['$scope','General','Users',function($scope,General,Users){
    $scope.user = Users.getLocalUser();
    if(!$scope.user){
        General.redirect('/',null,null);
    }
    $scope.logout = function(){
        Users.logout($scope.user._id).then(function(user){
            Users.removeLocalUser();
            General.redirect('/',null,null);
        },function(err){
            General.openNoteModal(err.data,null);
        })
    }
}]);
/**
 * controller for users index grid view
 */
controllers.controller('UsersController',['$scope','Users','General',function($scope,Users,General){
    /**
     * object that holds pagination options to make better pagination between server and local app
     * @type {{localPageNum: number, serverPageNum: number, perPageLocal: number, perPageServer: number, totalServerItems: number, sort: null, sortBy: null, data: Array, convertedPageNum: number, httpRequestFlag: boolean, filterCriteria: {username: null, email: null, phone_number: null}}}
     */
    var paginationOptions = {
        localPageNum : 1,
        serverPageNum : 1,
        perPageLocal : 20,//total items shown in every page
        perPageServer : 100,//total items to be requested from the server
        totalServerItems : 100,//total count from server
        sort : null,//sort direction (ASC or DESC)
        sortBy : null,//sort by column
        data : [],//to save all returned data from the server
        convertedPageNum:1,//attr to hold converted value from local page num to server page num
        httpRequestFlag:true,//http request flag
        filterCriteria:{//filter criteria for the data returned from the server
            username:null,
            email:null
        }
    };
    /**
     * method for make new request for the server to returned data that match search criteria
     * @param User {object} user object from search form
     */
    $scope.searchUsers = function(User){
        var search = false;
        for(var attr in User){
            if(User.hasOwnProperty(attr) &&  paginationOptions.filterCriteria.hasOwnProperty(attr) && paginationOptions.filterCriteria[attr] !== User[attr]){//has property and filter not null
                paginationOptions.filterCriteria[attr] = User[attr];
                search = true;
            }
        }
        if(search){
            paginationOptions.httpRequestFlag = true;
            getPage();
        }
    };
    /**
     * method to delete user record
     * @param id
     * @param index
     * @param entity
     */
    $scope.deleteItem = function(id,index, entity){
        if(confirm('Are you sure you want to delete ' + entity.firstName + ' ' + entity.lastName)){
            Users.deleteUser(id).then(function(data){
                $scope.usersGridOptions.data.splice(index, 1);
            },function(err){
                General.openNoteModal(err.data,null);
            });
        }
    };
    var operationsTemplate = '<div class="operations"><button class="btn btn-success btn-half btn-flat" ui-sref="dashboard.user-details({id:row.entity._id})">View</button><button class="btn btn-info btn-half btn-flat" ui-sref="dashboard.user-update({id:row.entity._id})">Edit</button><button class="btn btn-danger btn-half btn-flat" ng-click="grid.appScope.deleteItem(row.entity._id,grid.renderContainers.body.visibleRowCache.indexOf(row), row.entity)">Delete</button></div>';
    $scope.usersGridOptions = {
        paginationPageSizes: [20, 50, 100],
        paginationPageSize: paginationOptions.perPageLocal,
        useExternalPagination: true,//will use our pagination
        useExternalSorting: true,//will use our sorting
        totalItems: paginationOptions.totalServerItems,//total count for users data in the server
        rowTemplate: '<div class="grid_row">' +
        '<div  ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns" class="ui-grid-cell" ui-grid-cell></div>' +
        '</div>',
        data: paginationOptions.data,
        columnDefs: [
            { field: '_id', enableSorting: false, displayName:'User ID' },
            { name:'name', field: 'getName()', displayName: 'Full Name', enableSorting: true},
            { name: 'email', enableSorting: true, displayName:'Email' },
            { name: 'username', enableSorting: true, displayName:'Username' },
            { field: 'Operations', enableSorting: false, displayName:'Operations',enableColumnMenu:false, cellTemplate:operationsTemplate}
        ],
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
            /**
             * listener for grid sort change to request for new data with the sort criteria
             */
            $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                paginationOptions.httpRequestFlag = true;//raise http request flag
                if (sortColumns.length == 0){
                    paginationOptions.sort = null;
                    paginationOptions.sortBy = null;
                } else {
                    paginationOptions.sort = (sortColumns[0].sort.direction == 'asc')? 1 :(-1);
                    paginationOptions.sortBy = sortColumns[0].name;
                }
                getPage();
            });
            /**
             * listener for pagination change to create new page data or make new request
             */
            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                paginationOptions.localPageNum = newPage;
                //TODO:: lock at this pagination conditions again
                if(newPage !== paginationOptions.localPageNum){
                    paginationOptions.perPageLocal = pageSize;
                    paginationOptions.perPageServer = pageSize*5;
                    paginationOptions.httpRequestFlag = true;
                }
                if(newPage % (paginationOptions.perPageServer/paginationOptions.perPageLocal) !== 0){
                    paginationOptions.serverPageNum = Math.floor(newPage*paginationOptions.perPageLocal/paginationOptions.perPageServer)+1;
                }
                paginationOptions.convertedPageNum = Math.ceil(paginationOptions.localPageNum - ((paginationOptions.perPageServer/paginationOptions.perPageLocal)*(paginationOptions.serverPageNum - 1)));
                if(paginationOptions.convertedPageNum == 1){
                    paginationOptions.httpRequestFlag = true;
                }
                getPage();
            });
        }
    };
    /**
     * method for getting users data for this page
     */
    var getPage = function() {
        //calc first row index for this page
        var firstRow = (paginationOptions.convertedPageNum - 1) * paginationOptions.perPageLocal;
        //check for http request or paginate with local data
        if(paginationOptions.httpRequestFlag){
            paginationOptions.httpRequestFlag = false;
            //get users data
            Users.getUsers(paginationOptions).then(function (response) {
                //header total count of users
                $scope.usersGridOptions.totalItems = response.$httpHeaders('X-Pagination-Total-Count');
                //slice returned data to equal this page data length
                $scope.usersGridOptions.data = response.slice(firstRow, firstRow + paginationOptions.perPageLocal);
                //assign all returned data to paginationOptions data array
                paginationOptions.data = response;
                //loop to inject getName function with each record
                angular.forEach($scope.usersGridOptions.data,function(row){
                    row.getName = function(){
                        return this.firstName+' '+this.lastName;
                    }
                });
            },function(err){
                //in case of error returning users make modal with this error
                General.openNoteModal(err.data,null);
            });
        }else{//local pagination with saved data
            $scope.usersGridOptions.data = paginationOptions.data.slice(firstRow, firstRow + paginationOptions.perPageLocal);
        }
    };
    getPage();
}]);
/**
 * controller for user create route
 */
controllers.controller('CreateUserController',['$scope','Users','General',function($scope,Users,General){
    $scope.formTitle = 'Create User';
    $scope.userObject = {
        firstName:'',
        lastName:'',
        username:'',
        email:'',
        password:''
    };
    $scope.SaveUser = function(){
        $scope.submitted = true;
        $scope.error = {};
        for(var index in $scope.userObject){
            if($scope.userObject.hasOwnProperty(index)){
                if(!$scope.userObject[index]){
                    $scope.error[index] = index+' is required';
                }
            }
        }
        if($scope.error !== {}){
            Users.createUser($scope.userObject).then(function(user){
                General.openNoteModal('User created successfully',null);
                General.redirect('dashboard.users',null,null);
            },function(err){
                if(err.status === 409){
                    $scope.error.general = 'There is a conflict, user with this data already exist';
                    return;
                }
                General.openNoteModal(err.data,null);
            });
        }
    }
}]);
/**
 *  controller for user update route
 */
controllers.controller('UpdateUserController',['$scope','Users','$stateParams','General',function($scope,Users,$stateParams,General){
    var userID = $stateParams.id;
    $scope.formTitle = 'Update User';
    if(userID){
        Users.getUserDetails(userID).then(function(userObject){
            $scope.userObject = userObject;
        },function(err){
            General.openNoteModal(err.data,function(){
                General.redirect('dashboard.users',null,null);
            });
        });
    }else{
        General.openNoteModal('You must provide user id',function(){
            General.redirect('dashboard.users',null,null);
        });
    }
    $scope.SaveUser = function(){
        $scope.submitted = true;
        $scope.error = {};
        for(var index in $scope.userObject){
            if($scope.userObject.hasOwnProperty(index)){
                if(!$scope.userObject[index]){
                    $scope.error[index] = index+' is required';
                }
            }
        }
        if($scope.error !== {}){
            Users.updateUser(userID,$scope.userObject).then(function(user){
                General.openNoteModal('User updated successfully',null);
                General.redirect('dashboard.users',null,null);
            },function(err){
                General.openNoteModal(err.data,null);
            });
        }
    }
}]);
/**
 *  controller for user details route
 */
controllers.controller('UserDetailsController',['$scope','General','Users','$stateParams',function($scope,General,Users,$stateParams){
    var userID = $stateParams.id;
    if(userID){
        Users.getUserDetails(userID).then(function(userObject){
            $scope.userObject = userObject;
        },function(err){
            General.openNoteModal(err.data,function(){
                General.redirect('dashboard.users',null,null);
            });
        });
    }else{
        General.openNoteModal('You must provide user id',function(){
            General.redirect('dashboard.users',null,null);
        });
    }
}]);
/**
 * controller for alert model for any errors or any not for the user
 */
controllers.controller('InfoModelController',['$scope','infoTemp',function($scope,infoTemp){
    $scope.infoTemp = infoTemp;
}]);