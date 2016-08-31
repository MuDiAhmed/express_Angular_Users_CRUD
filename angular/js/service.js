/**
 * Created by mudi on 01/07/16.
 */
var services = angular.module('services',['ngResource']);
/**
 * service that hold general tasks like redirect, makeModel
 */
services.factory('General',['$uibModal','$state',function($uibModal,$state){
    /**
     * object hold open model instance and timeout of it
     * @type {{modalInstance: string, modal_timeout: string}}
     */
    var modalObject = {
        modalInstance:'',
        modal_timeout:''
    };
    /**
     * Creates a modal using $uiModal service,
     * @param timeout integer, number of seconds the modal should be hidden after.
     * @param modalOpenObject object, {templateUrl,controller,scope,resolve}
     * @param extraCodeInTimeout callback to be executed after the window has timed out || null.
     */
    var makeModal = function(timeout,modalOpenObject,extraCodeInTimeout){
        if(modalObject.modalInstance!==''){
            // close all modals before opening new ones.
            modalObject.modalInstance.close();
        }
        var modalOptions=angular.extend({},{
            templateUrl: null,
            controller: null,
            size: 'lg',
            resolve: null,
            backdrop:'static',
            keyboard :false,
            scope:null
        },modalOpenObject);

        modalObject.modalInstance = $uibModal.open(modalOptions);

        if(modalObject.modal_timeout !== ''){
            clearTimeout(modalObject.modal_timeout);
        }
        if(timeout !== null){
            modalObject.modal_timeout = setTimeout(function(){
                if(extraCodeInTimeout){
                    extraCodeInTimeout();
                }
                modalObject.modalInstance.close();
            },timeout);
        }
        return modalObject;
    };
    /**
     * method to handle redirection
     * @param path {string} route name to redirect to
     * @param params {object} parameters to be passed to the new route
     * @param options {object} any extra options
     */
    var redirect = function(path, params, options){
        $state.go(path, params, options);
    };
    /**
     * method to call make modal function general service
     * @param err {string} error to show
     * @param afterTimeOut {function} callback function after timeout
     */
    var openNoteModal = function(err, afterTimeOut){
        makeModal(5000,{
            templateUrl:'partials/infoModalTemp.html',
            controller:'InfoModelController',
            resolve:{
                infoTemp : function(){
                    return {
                        class:'has-error',
                        msg:err
                    }
                }
            }
        },afterTimeOut);
    };
    return {
        makeModal:makeModal,
        redirect:redirect,
        openNoteModal:openNoteModal
    }
}]);
/**
 * service to hold all user operations
 */
services.factory('Users',['$resource','Config','$window',function($resource,Config,$window){
    var serverURL = Config.nodeServerUrl;
    var Users = $resource(serverURL+'users/:id',null,{
        'login':{method:'POST',url:serverURL+'login'},
        'query':{ method:'GET',
                isArray:true,
                interceptor: {
                    response: function(response) {
                        response.resource.$httpHeaders = response.headers;
                        return response.resource;
                    }
        }},
        'post':{method:'POST'},
        'get':{method:'GET'},
        'put': { method:'PUT' },
        'logout':{method:'POST',url:serverURL+'logout'}
    });
    var login = function(loginObject){
            return Users.login(loginObject).$promise;
        },
        saveUser = function(userObject){
            $window.localStorage.userObject = JSON.stringify(userObject);
        },
        getLocalUser = function(){
            var user = $window.localStorage.userObject;
            if(!user){
                return false;
            }
            return JSON.parse(user);
        },
        getUsers = function(paginationOptions){
            var getObject ={};
            if(paginationOptions){
                getObject = {
                    page:paginationOptions.serverPageNum,
                    perPage:paginationOptions.perPageServer
                };
                if(paginationOptions.sort && paginationOptions.sortBy){
                    getObject.sortType = paginationOptions.sort;
                    getObject.sortBy = paginationOptions.sortBy;
                }
                var filterCriteria = paginationOptions.filterCriteria;
                for(var filter in filterCriteria){
                    if(filterCriteria.hasOwnProperty(filter) && filterCriteria[filter]){//has property and filter not null
                        getObject[filter] = filterCriteria[filter];
                    }
                }
            }
            return Users.query(getObject).$promise;
        },
        deleteUser = function(userID){
            return Users.delete({id:userID}).$promise;
        },
        createUser = function(userObject){
            console.log(userObject);
            return Users.post(userObject).$promise;
        },
        getUserDetails = function(userID){
            return Users.get({id:userID}).$promise;
        },
        updateUser = function(userID,updateObject){
            return Users.put({id:userID},updateObject).$promise;
        },
        logout = function(userID){
            return Users.logout({id:userID}).$promise;
        },
        removeLocalUser = function(){
            $window.localStorage.removeItem('userObject');
        };

    return {
        login:login,
        saveUser:saveUser,
        getLocalUser:getLocalUser,
        getUsers:getUsers,
        deleteUser:deleteUser,
        createUser:createUser,
        getUserDetails:getUserDetails,
        updateUser:updateUser,
        logout:logout,
        removeLocalUser:removeLocalUser
    }
}]);