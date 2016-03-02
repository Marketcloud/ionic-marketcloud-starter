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
Stripe.setPublishableKey('YOUR_KEY_HERE');

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


app.run(function(CartService){
  


  var promise = null;

  if (window.localStorage['marketcloud.cart_id']){
    promise = CartService.getById(window.localStorage['marketcloud.cart_id']);
  }
  else{
    promise = CartService.create([]);
  }
  
  promise
  .then(function(data){
    window.localStorage['marketcloud.cart_id'] = data.id;
  })
  .catch(function(err){
    console.log("Unable to init the cart")
  })

})






app.factory('marketcloud',function(){
    // put here your marketcloud app's public key
    marketcloud.public = 'f84af487-a315-42e6-a57a-d79296bd9d99';
    
    return marketcloud;
})


app.service('ProductService',function(marketcloud,$q){
  return {
    getById : function(id) {
      return $q(function(resolve,reject){
        marketcloud.products.getById(id,function(err,product){
          if (err)
            reject(err)
          else
            resolve(product)
        })
      })
    },
    list : function(query) {
      return $q(function(resolve,reject){
        marketcloud.products.list(query,function(err,product){
          if (err)
            reject(err)
          else
            resolve(product)
        })
      })
    } 
  }
})


app.service('CartService',function(marketcloud,$q){
  return {
    data : null,
    getById : function(id) {
      var _this = this;
      return $q(function(resolve,reject){
        marketcloud.carts.getById(id,function(err,cart){
          if (err)
            reject(err)
          else{
            _this.data = cart;
            resolve(cart)
          }
        })
      })
    },
    create : function(items) {
      var _this = this;
      return $q(function(resolve,reject){
        marketcloud.carts.create(items || [],function(err,cart){
          if (err)
            reject(err)
          else{
            _this.data = cart;
            resolve(cart)
          }
        })
      })
    },
    add : function(items) {
      var _this = this;
      if (!this.data)
        throw new Error("Cart must be initialized first!")
      return $q(function(resolve,reject){
        marketcloud.carts.add(_this.data.id,items,function(err,cart){
          if (err)
            reject(err)
          else{
            _this.data = cart;
            resolve(cart)
          }
        })
      })
    },
    update : function(update) {
      var _this = this;
      if (!this.data)
        throw new Error("Cart must be initialized first!")
      return $q(function(resolve,reject){
        marketcloud.carts.add(_this.data.id,update,function(err,cart){
          if (err)
            reject(err)
          else{
            _this.data = cart;
            resolve(cart)
          }
        })
      })
    },    
    remove : function(items) {
      var _this = this;
      if (!this.data)
        throw new Error("Cart must be initialized first!")
      return $q(function(resolve,reject){
        marketcloud.carts.add(_this.data.id,items,function(err,cart){
          if (err)
            reject(err)
          else{
            _this.data = cart;
            resolve(cart)
          }
        })
      })
    },      
  }
})

/*
app.service('CartService',['marketcloud',function(marketcloud){
  return {
    data : null,
    load : function(id,callback) {
      

      var _this = this;
      marketcloud.carts.getById(id,function(err,data){
        if (err)
          callback(err);
        else {
          

          _this.data = data;
          callback(null)
        }
      })
    },
    create : function(callback) {
      var _this = this;
      
      marketcloud.carts.create({},function(err,data){
        if (err){
          
          callback(err);
        }
        else {
          
          _this.data = data;
          callback(null)
        }
      })
    },
    add : function(items,callback){
      var _this = this;
      
      if (!this.data)
        throw new Error("Cart must be loaded first!")
      marketcloud.carts.add(this.data.id,items,function(err,data){
        if (err)
          callback(err);
        else {
          _this.data = data;
          callback(null)
        }
      })
    },
    update : function(items){
      var _this = this;
      if (!this.data)
        throw new Error("Cart must be loaded first!")
      marketcloud.carts.update(this.data.id,items,function(err,data){
        if (err)
          callback(err);
        else {
          _this.data = data;
          callback(null)
        }
      })
    },
    remove : function(items){
      var _this = this;
      if (!this.data)
        throw new Error("Cart must be loaded first!")
      marketcloud.carts.remove(this.data.id,items,function(err,data){
        if (err)
          callback(err);
        else {
          _this.data = data;
          callback(null)
        }
      })
    }

  }
}])
*/
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
          templateUrl: 'templates/products.html',
          controller: 'ProductsCtrl'
        }
      },
      resolve:{
        products : function(ProductService,$stateParams) {
          return ProductService.list($stateParams.query || {})
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
      },
      resolve:{
        cart : function(CartService) {
          return CartService.getById(window.localStorage['marketcloud.cart_id'])
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
      params :{query:null},
      views: {
        'menuContent': {
          templateUrl: 'templates/products.html',
          controller: 'ProductsCtrl'
        }
      },
      resolve:{
        products : function(ProductService,$stateParams) {
          return ProductService.list($stateParams.query || {})
        }
      }
    }) 
    .state('app.categories', {
      url: '/categories',
      views: {
        'menuContent': {
          templateUrl: 'templates/categories.html',
          controller: 'CategoriesCtrl'
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
    },
    resolve:{
        product : function(ProductService,$stateParams) {
          return ProductService.getById($stateParams.productId)
        }
      }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
