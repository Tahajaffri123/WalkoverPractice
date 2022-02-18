(function () {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', Controller);

    function Controller(UserService, FlashService) {
        var vm = this;

        vm.user = {};
        vm.frontUser={};
        // console.log('asda',vm.user)
        vm.saveUser = saveUser;

        initController();

        function initController($scope) {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
                var range = [];
                for(var i=0;i<vm.frontUser.Lang;i++) {
                range.push(i);
                }
                 $scope.range = range;
            });
        }
        function saveUser() {
            // console.log('Save user',vm.user,vm.frontUser)
            Object.keys(vm.frontUser).map(function (key) {
                vm.user[key]=vm.frontUser[key];
            })
            UserService.Update(vm.user)
                .then(function () {
                    FlashService.Success('User updated');
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
        }
    }

console.log("This is the frontend update data",range);
})();

