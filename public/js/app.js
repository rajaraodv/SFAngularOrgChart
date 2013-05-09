/**
 * Describe Salesforce object to be used in the app. For example: Below AngularJS factory shows how to describe and
 * create an 'Contact' object. And then set its type, fields, where-clause etc.
 *
 *  PS: This module is injected into ListCtrl, EditCtrl etc. controllers to further consume the object.
 */
angular.module('Contact', []).factory('Contact', function (AngularForceObjectFactory) {

    var objDesc = {
        type: 'User',
        fields: ['Name', 'Id', 'SmallPhotoUrl', 'Email', 'Phone', 'Title'],
        where: '',
        limit: 1,
        soslFields: 'Email Fields'
    };
    var Contact = AngularForceObjectFactory(objDesc);

    return Contact;
});

function HomeCtrl($scope, AngularForce, $location, $route) {
    //If in visualforce, directly login
    if (AngularForce.inVisualforce) {
        $location.path('/login');
    } else if(AngularForce.refreshToken) { //If web, try to relogin using refresh-token
        AngularForce.login(function () {
            $location.path('/contacts/' + app.INITIAL_EMAIL_FOR_ORG_CHART);
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        });
    } else {
        $location.path('/login');
    }
}

function LoginCtrl($scope, AngularForce, $location) {
    $scope.login = function () {
        AngularForce.login();
    };

    //If in visualforce, directly login
    if (AngularForce.inVisualforce) {
        AngularForce.login();
    }
}

function CallbackCtrl($scope, AngularForce, $location) {
    AngularForce.oauthCallback(document.location.href);

    //Note: Set hash to empty before setting path to /contacts to keep the url clean w/o oauth info.
    //..coz oauth CB returns access_token in its own hash making it two hashes (1 from angular,
    // and another from oauth)
    $location.hash('');
    $location.path('/contacts/' +  app.INITIAL_EMAIL_FOR_ORG_CHART);

}

function ContactListCtrl($scope, AngularForce, $location, Contact, $routeParams) {
    $scope.authenticated = AngularForce.authenticated();
    if (!$scope.authenticated) {
        return $location.path('/home');
    }

    $scope.searchTerm = $routeParams.email ||  app.INITIAL_EMAIL_FOR_ORG_CHART;

    $scope.findContactWithManagerId = function (contactList) {
        if (contactList.length == 1) {
            return contactList[0];
        }
        for (var i = 0; i < contactList.length; i++) {
            if (contactList[i].ManagerId) {
                return contactList[i];
            }
        }
    };

    $scope.hasContact = function () {
        return $scope.contact ? true : false;
    };

    $scope.hasManager = function () {
        return $scope.contact && $scope.contact.ManagerId ? true : false;
    };

    $scope.getImgUrl = function (contact) {
        return contact && contact.SmallPhotoUrl + "?oauth_token=" + $scope.sessionId;
    };


    $scope.hasDirectReports = function () {

        return $scope.directReports && $scope.directReports.length > 0 ? true : false;
    };

    $scope.getDirectReports = function () {
        var soql = "SELECT Name,SmallPhotoUrl,Title,ManagerId,Email,Phone from User where ManagerId='" + $scope.contact.Id + "' And IsActive=TRUE";
        Contact.queryWithCustomSOQL(soql, function (data) {
            $scope.sessionId = AngularForce.sessionId;
            $scope.directReports = data.records;
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        }, function (data) {
            alert('Query Error');
        });
    };

    $scope.getCurrentContactManager = function () {
        var soql = "SELECT Name,SmallPhotoUrl,Title,ManagerId,Email,Phone from User where Id='" + $scope.contact.ManagerId + "'";
        Contact.queryWithCustomSOQL(soql, function (data) {
            $scope.sessionId = AngularForce.sessionId;

            $scope.manager = data.records[0];
            $scope.$apply();//Required coz sfdc uses jquery.ajax
        }, function (data) {
            alert('Query Error');
        });
    };

    $scope.doSearch = function () {
        $scope.contact = null;
        $scope.manager = null;
        $scope.directReports = null;
        var soql = "SELECT Name, SmallPhotoUrl, Title, Id, ManagerId,Email,Phone from User where Email='" + $scope.searchTerm + "'";

        //SetTimeout MUST be 0.5 - 1sec (1000ms) to allow animation
        setTimeout(function () {
            Contact.queryWithCustomSOQL(soql, function (data) {
                $scope.sessionId = AngularForce.sessionId;

                $scope.contact = $scope.findContactWithManagerId(data.records);

                //Note: commenting $scope.$apply coz there is another $scope.$apply in Manager and/or directReports
                //Having this causes some sluggishness in animation
                //$scope.$apply();//Required coz sfdc uses jquery.ajax

                if ($scope.contact) {
                    if ($scope.contact.ManagerId) {
                        $scope.getCurrentContactManager();
                    }
                    $scope.getDirectReports();
                }
            }, function (data) {
                alert('Query Error');
            });

        }, 500);
    };

    $scope.newSearch = function (contact) {
        //$scope.searchTerm = contact.Email;
       // $scope.doSearch();
        $location.path('/contacts/' + contact.Email);
    };

    $scope.doView = function (contactId) {
        console.log('doView');
        $location.path('/view/' + contactId);
    };

    $scope.doCreate = function () {
        $location.path('/new');
    };
    $scope.doSearch();

}