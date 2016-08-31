/**
 * Created by mudi on 01/07/16.
 */
var mongoose = require('../config/DB'),
    Schema = mongoose.Schema,
    Images = require('./Images'),
    q = require('q');
    userSchema = new Schema({
        id:{type:Number},
        firstName: String,
        lastName: String,
        username: { type: String, required: true, unique: true,validate: [/[a-zA-Z0-9]/, 'Username should only have letters and numbers'] },
        password: { type: String, required: true },
        email: {type:String, required:true, unique:true},
        created_at: {type:Date,default: Date.now},
        updated_at: Date,
        Images:[Images.schema],
        activeSession: String
    });
/**
 * email validation for every query
 */
userSchema.path('email').validate(function (email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}, 'Email must be an email format');
/**
 * method to run before every query to update update_at attribute
 */
userSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});
var UsersModel = mongoose.model('Users', userSchema);
var Users = {};
//generating random session id
function makeSessionId(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 32; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
/**
 * method for getting all the users return promise
 * @param begin {int} beginning of the search query
 * @param limit {int} limit for the returned users
 * @param sortObject {object} sort criteria {attr:sortType} -> {email:-1}
 * @param filterObject {object} search criteria {name:/test/,email:/@test/}
 * @returns {*|promise.promise|jQuery.promise|d.promise|promise|Promise}
 */
Users.index = function(begin,limit,sortObject,filterObject){
    var requestPromise = q.defer();
    var query = UsersModel.find(filterObject).skip(begin).limit(limit);
    if(sortObject !== {}){
        query.sort(sortObject);
    }
    query.exec('find',function(err,users){
        if (err){
            requestPromise.reject(err);
        }
        UsersModel.count(function(err, count){
            if(err){
                requestPromise.reject(err);
            }
            requestPromise.resolve({data:users,count:count});
        });
    });
    return requestPromise.promise;
};
/**
 * method for creating new users return promise
 * @param userObject {object} user data to be saved
 * @returns {jQuery.promise|*|promise.promise|promise|d.promise|Promise}
 */
Users.create = function(userObject){
    var newUser = new UsersModel(userObject),
        requestPromise = q.defer();
    newUser.save(function(err,user) {
        if (err){
            requestPromise.reject(err);
        }
        requestPromise.resolve(user);
    });
    return requestPromise.promise;
};
/**
 * method for getting one user object return promise
 * @param userId {string} id of the user to be returned
 * @returns {jQuery.promise|*|promise.promise|promise|d.promise|Promise}
 */
Users.view = function(userId){
    var requestPromise = q.defer();
    UsersModel.findById(userId,function(err,user){
        if(err){
            requestPromise.reject(err);
        }
        requestPromise.resolve(user);
    });
    return requestPromise.promise;
};
/**
 * method for getting user object with some criteria and or separator return query promise
 * @param searchCriteria {object} criteria to be used on the search query {key:value}
 * @returns {*|jQuery.promise|promise.promise|d.promise|promise|Promise}
 */
Users.getByOR = function(searchCriteria){
    var requestPromise = q.defer();
    var searchObject = {$or: []};
    for(var index in searchCriteria){
        if(searchCriteria.hasOwnProperty(index)){
            var searchItem = {};
            searchItem[index] = searchCriteria[index];
            searchObject.$or.push(searchItem);
        }
    }
    UsersModel.findOne(searchObject,function(err,user){
        if(err){
            requestPromise.reject(err);
        }
        requestPromise.resolve(user);
    });
    return requestPromise.promise;
};
/**
 * method for updating user object using some criteria
 * @param searchCriteria {object} conditions for user object query
 * @param updatedData {object} user data to be updated
 * @returns {jQuery.promise|*|promise.promise|d.promise|promise|Promise}
 */
Users.update = function(searchCriteria,updatedData){
    var requestPromise = q.defer();
    UsersModel.findOneAndUpdate(searchCriteria,updatedData,{new:true},function(err, updatedUser){
        if(err){
            requestPromise.reject(err);
        }
        requestPromise.resolve(updatedUser);
    });
    return requestPromise.promise;
};
/**
 * method used to delete user object
 * @param searchCriteria {object} user condition of the user been deleted
 * @returns {jQuery.promise|*|promise.promise|d.promise|promise|Promise}
 */
Users.delete = function(searchCriteria){
    var requestPromise = q.defer();
    UsersModel.findOneAndRemove(searchCriteria,{},function(err, deletedUser){
        if(err){
            requestPromise.reject(err);
        }
        requestPromise.resolve(deletedUser);
    });
    return requestPromise.promise;
};
/**
 * method to handle user login
 * @param loginData{object} {username,password}
 * @returns {jQuery.promise|*|promise.promise|d.promise|promise|Promise}
 */
Users.login = function(loginData){
    // var requestPromise = q.defer();
    var sessionID = makeSessionId();

    return Users.update(loginData,{activeSession:sessionID});
    // UsersModel.findOneAndUpdate(loginData,{activeSession:sessionID},function(err,user){
    //     if(err){
    //         requestPromise.reject(err);
    //     }
    //     requestPromise.resolve(user);
    // });
    // return requestPromise.promise;
};
/**
 * method to check user authentication
 * @param authHeader {string} authentication header send in the request
 * @returns {jQuery.promise|promise.promise|*|promise|d.promise|Promise}
 */
Users.auth = function(authHeader){
    var requestPromise = q.defer();
    UsersModel.findOne({activeSession:authHeader},function(err,user){
        if(err || user === null){
            requestPromise.reject(err);
        }
        requestPromise.resolve(user);
    });
    return requestPromise.promise;
};

//create admin user as an example
Users.create({
        firstName: 'admin',
        lastName: 'admin',
        username: 'admin',
        password: '123456',
        email: 'admin@admin.admin'
    });
module.exports = Users;