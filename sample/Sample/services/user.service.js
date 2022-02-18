var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('users');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve(jwt.sign({ sub: user._id }, config.secret));
        } else {
            // authentication failed
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();
    
    // validation
    db.users.findOne(
        { username: userParam.username },
        function (err, user) {
        if(userParam.username.length<6){
            deferred.reject(' username length should be above 6');

        }else if(err) deferred.reject(err.name + ': ' + err.message);
            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            }  
            else{
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');
        if(userParam.password != userParam.confirmPassword){
            deferred.reject(" Password not same");
        }
        else if(userParam.password.length < 6){
            deferred.reject(" Password length should be above 6");
        }
        
        // add hashed password to user object
        else{
            user.hash = bcrypt.hashSync(userParam.password, 10);
        db.users.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                // console.log("This is the console for do",doc);
                deferred.resolve();
            });
        }
    }

    return deferred.promise;
}

function update(_id, userParam) {
    // console.log("esrshdjfhskdjfhsdjfhsdjhfhsdjfsdjfdsfsdf",userParam)
    var deferred = Q.defer();

    // validation
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne(
                { username: userParam.username },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } 
                     else {
                        //  console.log("user",user)
                        updateUser(user);

                    }
                });
        } else {
            // console.log("user",user)
            updateUser(user);
        }
    });

    function updateUser(user) {
        // fields to update
        // console.log("This is the usePram",userParam,user);
        var set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
            mobileNO: userParam.mobileNO,
            CATTool: userParam.CATTool,
            officeTool: userParam.officeTool,
            Lang: userParam.Lang ? [...user.Lang, userParam.Lang]:user.Lang,
            // Lang:[userParam.Lang],
            Pro: userParam.Pro,
            // subject: userParam.subject ? [...user.subject, userParam.subject]:user.subject,
            subject:[userParam.subject],
            // English: userParam.English,
            // Arabic: userParam.Arabic,
            expertise: userParam.expertise,
            // Business: userParam.Business,
            Bio: userParam.Bio,
            Gender: userParam.Gender,
            Nationality: userParam.Nationality,
            CR: userParam.CR,
            // Technology: userParam.Technology,
            whatsappNO: userParam.whatsappNO
        };
        // console.log("This is the usePram",userParam,user);
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }
        if (userParam.confirmPassword) {
            set.hash = bcrypt.hashSync(userParam.confirmPassword, 10);
        }
        // db.users.aggregate([
        //     { $match: { Lang: userParam.Lang } },
        //     { $group: { _id: mongo.helper.toObjectID(_id) , userParam : { Lang: userParam.Lang } } }
            
        //  ])
        //  console.log("This is console",userParam.Lang);
        db.users.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}