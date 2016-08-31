/**
 * Created by mudi on 01/07/16.
 */
var express = require('express');
var router = express.Router();
var UsersController = require('../controllers/UsersControler');
/**
 * router to handle user login
 */
router.route('/login')
    .post(UsersController.login);
/**
 * router to handle user logout
 */
router.route('/logout')
    .post(UsersController.logout);
/**
 * router to handle /users (post,get) requests
 */
router.route('/users')
    .all(function(req, res, next) {
        // runs for all HTTP verbs first
        // think of it as route specific middleware!
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        //intercepts OPTIONS method
        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        }
        UsersController.isAuthenticated(req, res, next);
    })
    .get(UsersController.index)
    .post(UsersController.create);
/**
 * router to handle /users/:id (put,get,delete) requests
 */
router.route('/users/:id')
    .all(function(req, res, next) {
        // runs for all HTTP verbs first
        // think of it as route specific middleware!
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        //intercepts OPTIONS method
        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        }
        UsersController.isAuthenticated(req, res, next);
    })
    .get(UsersController.view)
    .put(UsersController.update)
    .delete(UsersController.delete);

module.exports = router;