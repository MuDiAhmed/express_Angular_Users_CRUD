/**
 * Created by mudi on 26/06/16.
 */
'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('app',function(){
    beforeEach(module('mainApp'));
    beforeEach(module('services'));
    beforeEach(module('controllers'));
    var window = null,
        backendSever = null,
        rootScope = null,
        General = null;
    beforeEach(module(function ($provide) {
        window = {
            localStorage:{}
        };
        $provide.value('$window', window);
    }));
    beforeEach(inject(function(_$httpBackend_,_$rootScope_,_General_){
        backendSever = _$httpBackend_;
        rootScope = _$rootScope_;
        General = _General_;
        backendSever.whenGET(/\.html$/).respond('');
    }));
    describe('Services',function(){
        describe('Services : Users',function(){
            var usersServices = null;
            beforeEach(inject(function(_Users_){
                usersServices = _Users_;
            }));
            it('Should return an object',function(){
                expect(typeof usersServices).toBe('object');
            });
            it('getLocalUser function should be declared',function(){
                expect(typeof usersServices.getLocalUser).toBe('function');
            });
            it('login function should be declared',function(){
                expect(usersServices.login).toBeDefined();
            });
            it('should return false getLocalUser',function(){
                var user = usersServices.getLocalUser();
                expect(user).toBeFalsy();
            });
            it('should return userdata getLocalUser',function(){
                window.localStorage.userObject = JSON.stringify({});
                var user = usersServices.getLocalUser();
                expect(typeof user).toBe('object');
            });
            it('login function to make post request and success save data',function(){
                var success = null;
                backendSever.expectPOST('http://localhost:8060/api/login',{username:'what',password:'password'}).respond(200, {username : 'test'});
                usersServices.login({username:'what',password:'password'}).then(function () {
                    success = true;
                });
                backendSever.flush();
                expect(success).toBeTruthy();
            });
            it('login function to make post request and failed',function(){
                var success = null;
                backendSever.expectPOST('http://localhost:8060/api/login',{username:'what',password:'password'}).respond(500, {});
                usersServices.login({username:'what',password:'password'}).then(function () {},function(){
                    success = false;
                });
                backendSever.flush();
                expect(success).toBeFalsy();
            });
            it('getLocalUser function to return object',function(){
                var userobject = JSON.stringify({username:'test'});
                window.localStorage.userObject = userobject;
                usersServices.getLocalUser();
                expect(window.localStorage.userObject).toBe(userobject);
            });
            it('getLocalUser function to return false',function(){
                usersServices.getLocalUser();
                expect(window.localStorage.userObject).toBeFalsy();
            });
        });
    });
    describe('Controllers',function(){
        describe('Controller : LoginController',function(){
            var LoginController = null,
                rootScope = null,
                General = {
                    makeModal:function(){},
                    redirect:function (){}
                };
            beforeEach(inject(function(_$controller_,_$rootScope_){
                rootScope = _$rootScope_;
                LoginController = _$controller_('LoginController',{
                    $scope:rootScope,
                    $uibModalInstance:{
                        close:function(){}
                    },
                    General:General
                });
            }));
            it('should be error with empty username',function(){
                rootScope.login({username:'',password:'password'});
                expect(rootScope.error['username']).toBe('username is required');
            });
            it('should be error with empty password',function(){
                rootScope.login({username:'ali',password:''});
                expect(rootScope.error['password']).toBe('password is required');
            });
            it('should be no error for empty user data',function(){
                rootScope.login({username:'ali',password:'password'});
                expect(Object.keys(rootScope.error).length).toBe(0);
            });
            it('should post request to pass ',function(){
                spyOn(rootScope, 'closeModal').and.callThrough();
                backendSever.expectPOST('http://localhost:8060/api/login',{username:'ali',password:'password'}).respond(200, {username : 'test'});
                rootScope.login({username:'ali',password:'password'});
                backendSever.flush();
                expect(rootScope.closeModal).toHaveBeenCalled();
            });
            it('should be an error with post request and modal to open',function(){
                spyOn(General, 'makeModal').and.callThrough();
                backendSever.expectPOST('http://localhost:8060/api/login',{username:'what',password:'password'}).respond(500, {});
                rootScope.login({username:'what',password:'password'});
                backendSever.flush();
                expect(General.makeModal).toHaveBeenCalled();
            });
        })
    });
});
