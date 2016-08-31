/**
 * Created by mudi on 01/07/16.
 */
var app = angular.module('mainApp',[
    'controllers',
    'services',
    'ui.router',
    'ui.bootstrap'
]);

app.config(['$stateProvider', '$urlRouterProvider','$httpProvider',
    function($stateProvider, $urlRouterProvider,$httpProvider) {
        $stateProvider
            .state('/', {
                url:'/',
                templateUrl: 'partials/mainPage.html',
                controller: 'MainPageController'
             })
            .state('dashboard', {
                abstract: true,
                url: '/dashboard',
                templateUrl: 'partials/dashboard.abstract.html',
                controller: 'DashboardController'
            })
            .state('dashboard.users', {
                url:'/users',
                templateUrl: 'partials/Users/index.html',
                controller: 'UsersController'
             })
            .state('dashboard.create-user', {
                url:'/users/create-user',
                templateUrl: 'partials/Users/userForm.html',
                controller: 'CreateUserController'
             })
            .state('dashboard.user-update', {
                url:'/users/:id/update',
                templateUrl: 'partials/Users/userForm.html',
                controller: 'UpdateUserController'
             })
            .state('dashboard.user-details', {
                url:'/users/:id',
                templateUrl: 'partials/Users/userDetails.html',
                controller: 'UserDetailsController'
             });
        $urlRouterProvider.otherwise('/');
        $httpProvider.interceptors.push('authInterceptor');
    }
]);
/**
 * service to inject user sessionID to every request to the server
 */
app.factory('authInterceptor', ['$q','$window','$location',function ($q, $window, $location) {
    return {
        request: function (config) {
            var user = $window.localStorage.userObject;
            if (user){
                user = JSON.parse(user);
                config.headers.Authorization = user.activeSession;
            }
            return config;
        },
        responseError: function (rejection) {
            if (rejection.status === 401 || rejection.status === 402) {
                $location.path('/login').replace();
            }
            return $q.reject(rejection);
        }
    };
}]);
app.run(function ($rootScope) {
    // Add CSS classes to <body /> for every state and parent state for styling purpose
    $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
        angular.element(document.getElementById('body')).removeClass('state_' + fromState.name.replace('.', '_').replace('/','') + ((fromState.name.match(/\./)) ? ' parent_' + fromState.name.split('.')[0] : ''));
        angular.element(document.getElementById('body')).addClass('state_' + toState.name.replace('.', '_').replace('/','') + ((toState.name.match(/\./)) ? ' parent_' + toState.name.split('.')[0] : ''));
    });
});