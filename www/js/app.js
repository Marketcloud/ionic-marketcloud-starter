// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
window._DEBUG_ = true;

window.debug = function() {
  if(this.console && window._DEBUG_ === true){
    console.log( Array.prototype.slice.call(arguments) );
  }

}

var app = angular.module('starter', ['ionic', 'starter.controllers'])
Stripe.setPublishableKey('pk_test_o3U6ovC4zG8SXiEPsvFLSQ2E');

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})



/*
  Here we prevent that a not-logged-in user visits non-public states
*/
/*
app.run(function($rootScope,$state){
  console.log("Sono app.run che intercetta le view")
  $rootScope.$on("$stateChangeStart",function (event, toState, toParams, fromState, fromParams) {
    
    // The list of states that can be accessed without authentication
    var public_states = [
      'app.home',
      'app.login'
    ]
    
    if (!window.localStorage['marketcloud.token'] && public_states.indexOf(toState.name) <0) {
      event.preventDefault();
      // This is the redirection state, whenever a user tries to move to a state
      // that cannot be accessed without authentication, the state will be redirected.
      $state.go("app.home")
    }

    if (window.localStorage['marketcloud.token'] && toState.name === 'app.home') {
      event.preventDefault();
      $state.go("app.products")
    }
  })
})*/

app.run(function($rootScope,marketcloud){
  window.debug("localstorage",window.localStorage)
  if (!window.localStorage['marketcloud.cart_id']) {
    marketcloud.carts.create([],function(err,cart){
      if (err)
        throw new Error("Error creating the cart");
      else {
        window.localStorage['marketcloud.cart_id'] = cart.id;
        $rootScope.$broadcast("cartUpdate",cart);
        console.log("Cart created")
      }
    })
  } else {
    marketcloud.carts.getById(window.localStorage['marketcloud.cart_id'],function(err,cart){
      if (err) {
        throw new Error("There was an error fetching the cart");
      } else {
       $rootScope.$broadcast("cartUpdate",cart);
       console.log("Cart fetched"); 
      }
    })
  }
})






app.factory('marketcloud',['$rootScope',function(root){
    // put here your marketcloud app's public key
    marketcloud.public = '8e083835-eacd-4cb9-8d99-bfda3d991c4f';
    if(window.localStorage['marketcloud.token'])
      marketcloud.token = window.localStorage['marketcloud.token'];
    return marketcloud;
}])

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl'
    })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/home.html'
      }
    }
  })
  .state('app.account', {
    url: '/account',
    views: {
      'menuContent': {
        templateUrl: 'templates/account.html',
        controller: 'AccountCtrl'
      }
    }
  })
  .state('app.orders', {
    url: '/orders',
    views: {
      'menuContent': {
        templateUrl: 'templates/orders.html',
        controller: 'OrdersCtrl'
      }
    }
  })
  .state('app.cart', {
      url: '/cart',
      views: {
        'menuContent': {
          templateUrl: 'templates/cart.html',
          controller: 'CartCtrl'
        }
      }
    })
  .state('app.checkout_address', {
      url: '/checkout',
      views: {
        'menuContent': {
          templateUrl: 'templates/checkout_address.html',
          controller: 'CheckoutCtrl'
        }
      }
    })  
    .state('app.checkout_billing', {
      url: '/checkout',
      views: {
        'menuContent': {
          templateUrl: 'templates/checkout_billing.html',
          controller: 'CheckoutCtrl'
        }
      }
    }) 
    .state('app.checkout_billing_address', {
      url: '/checkout',
      views: {
        'menuContent': {
          templateUrl: 'templates/checkout_billing_address.html',
          controller: 'CheckoutCtrl'
        }
      }
    })
    .state('app.checkout_review', {
      url: '/checkout',
      views: {
        'menuContent': {
          templateUrl: 'templates/checkout_review.html',
          controller: 'CheckoutCtrl'
        }
      }
    }) 
    .state('app.products', {
      url: '/products',
      views: {
        'menuContent': {
          templateUrl: 'templates/products.html',
          controller: 'ProductsCtrl'
        }
      }
    })

  .state('app.single', {
    url: '/products/:productId',
    views: {
      'menuContent': {
        templateUrl: 'templates/product.html',
        controller: 'ProductCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
