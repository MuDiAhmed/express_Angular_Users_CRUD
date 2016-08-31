/**
 * Created by mudi on 01/07/16.
 */
var Users = require('../models/Users');
var actions = {};

/**
 * index action method that handle get request for returning all the users
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.index = function(req, res, next) {
    var page = parseInt(req.query.page),
        perPage = parseInt(req.query.perPage),
        begin = 0,
        limit = 20,
        sortObject = {},
        filterObject = {};
    if(!isNaN(page)&&!isNaN(perPage)){
        begin = (page-1)*perPage;
        limit = perPage;
    }
    if(req.query.sortType&&req.query.sortBy){
        sortObject[req.query.sortBy] = req.query.sortType;
    }
    if(req.query.username){
        filterObject.username = new RegExp(req.query.username, "i")
    }
    if(req.query.email){
        filterObject.email = new RegExp(req.query.email, "i")
    }
    Users.index(begin,limit,sortObject,filterObject).then(function(response){
        res.set('X-Pagination-Total-Count', response.count);
        return res.json(response.data);
    },function(err){
        res.status(500);
        return res.send(err);
    });
};
/**
 * index action method that handle post request for creating a user
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.create = function(req, res, next) {
    var searchCriteria = {
        username:req.body.username,
        email:req.body.email
    };
    Users.getByOR(searchCriteria).then(function(user){
        if(user === null){
            Users.create(req.body).then(function(user){
                res.status(201);
                return res.json(user);
            },function(err){
                res.status(500);
                return res.send(err);
            });
        }else{
            return res.sendStatus(409);
        }
    },function(err){
        res.status(500);
        return res.send(err);
    });
};
/**
 * index action method that handle get request for returning one user object
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.view = function(req, res, next) {
    // return res.send(req.user);
    Users.view(req.params.id).then(function(user){
        if(user === null){
            return res.sendStatus(404);
        }
        return res.json(user);
    },function(err){
        res.status(500);
        return res.send(err);
    })
};
/**
 * update action that handle put request for updating one user object
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.update = function(req, res, next) {
    var userID = req.params.id,
        reqBody = req.body;
    Users.update({_id:userID},reqBody).then(function(updatedUser){
        if(updatedUser === null){
            return res.sendStatus(404);
        }
        return res.json(updatedUser);
    },function(err){
        res.status(500);
        return res.send(err);
    });
};
/**
 * delete action to handle delete request for user object
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.delete = function(req, res, next) {
    Users.delete({_id: req.params.id}).then(function(deletedUser) {
        if(deletedUser === null){
            return res.sendStatus(404);
        }
        return res.json(deletedUser);
    },function(err){
        res.status(500);
        return res.send(err);
    });
};

/**
 * login handler to authenticate user
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.login = function(req, res, next){
    var loginData = req.body;
    Users.login(loginData).then(function(user){
        if(user === null){
            return res.sendStatus(404);
        }
        return res.json(user);
    },function(err){
        res.status(500);
        return res.send(err);
    });
};

/**
 * method to handle user authentication
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.isAuthenticated = function(req, res, next){
    var authHeader = req.header('Authorization');
    if(authHeader){
        Users.auth(authHeader).then(function(){
            next();
        },function(err){
            return res.sendStatus(403);
        });
    }else{
        return res.sendStatus(403);
    }
};

/**
 * logout action that handle put request for log user out
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
actions.logout = function(req, res, next) {
    var userID = req.body.id;
    Users.update({_id:userID},{activeSession:''}).then(function(User){
        if(User === null){
            return res.sendStatus(404);
        }
        return res.json(User);
    },function(err){
        res.status(500);
        return res.send(err);
    });
};
module.exports = actions;

