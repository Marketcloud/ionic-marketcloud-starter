function product2LineItem(prod){
  
  return {
    product_id : prod.id,
    variant_id : prod.variant_id || 0
  }
}

angular.module('starter.controllers', [])



.controller('AppCtrl', function($scope, $ionicModal, $timeout, marketcloud, $ionicPopup,$state, $rootScope) {
  
  console.log("AppCtrl")
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  //Checking at bootstrap if the user is logged in
  if (window.localStorage['marketcloud.token']){
    //The user is already logged in, must load data into the scope
    console.log("Welcome back "+window.localStorage['marketcloud.user_email']+" !")
    $rootScope.loggedIn = true;
    $scope.user = {
      token : window.localStorage['marketcloud.token'],
      email : window.localStorage['marketcloud.user_email']
    }
    //Also injecting the token into marketcloud client
    marketcloud.token = window.localStorage['marketcloud.token'];
  } else {
    console.log("You are not authenticated",window.localStorage)
  }
  
  // Form data for the login modal
  $scope.loginData = {};
  $scope.signupData = {};

  //User session data
  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.signup_modal = modal;
  });



  $scope.isLogged = function() {
    if (window.localStorage['marketcloud.token'])
      return true
    else
      return false
  }

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.login_modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.login_modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.login_modal.show();
  };

  // Triggered in the login modal to close it
  $scope.closeSignup = function() {
    $scope.signup_modal.hide();
  };

  // Open the login modal
  $scope.signup = function() {
    $scope.signup_modal.show();
  };

  $scope.doSignup = function() {
    if ($scope.signupData.password !== $scope.signupData.confirm_password)
      $ionicPopup.alert({
        title : 'error',
        template : 'Passwords don\'t match' 
      })
    else
      marketcloud.users.create({
        email : $scope.signupData.email,
        password : $scope.signupData.password
      },function(err,data){
        if (err) {
          $ionicPopup.alert({
            title : 'error',
            template : 'There was an error processing the request' 
          })
        } else {
          $ionicPopup.alert({
            title : 'success',
            template : 'The account was created' 
          })
          $state.go('app.products')
        }
      })
  }

  
  
  
  $scope.doLogout = function() {
    delete window.localStorage['marketcloud.user_email'];
    delete window.localStorage['marketcloud.cart_id'];
    delete window.localStorage['marketcloud.token'];
    $ionicPopup.alert({
      title : "Success",
      template : "You have been logged out."
    })
    $state.go("app.home")
  }
  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    marketcloud.users.authenticate($scope.loginData.email,$scope.loginData.password,function(err,data){
      if (err)
        $ionicPopup.alert({
          title:"Error",
          template : "An error has occurred, please try again later."
        })
      else{
        $scope.loggedIn = true;
        $scope.user = {
          token : data.token,
          email: data.user.email
        };
        window.localStorage['marketcloud.token'] = data.token;
        window.localStorage['marketcloud.user_email'] = data.user.email;
        marketcloud.carts.getByUser(function(err,carts){
          if (err || carts.length === 0) {
            // We must create a new cart
                marketcloud.carts.create({},function(err,cart){
                  if (err)
                    throw new Error("An error has occurred while creating a cart");
                  else {
                    window.localStorage['marketcloud.cart_id'] = cart.id;
                    $rootScope.$broadcast('cartUpdate',cart)
                  }
                })
          } else {
            //We retrieved the cart
            window.localStorage['marketcloud.cart_id'] = carts[0].id;
            $rootScope.$broadcast('cartUpdate',carts[0])
          }
        })
        $scope.closeLogin()
        $state.go('app.products');
      }
    });
    
  };


})

.controller('ProductsCtrl', ['$scope','marketcloud',function($scope,mc) {

  $scope.products = [];
  mc.products.list({},function(err,products){
    $scope.products = products;
    $scope.$apply()
  })
}])

.controller('ProductCtrl', ['$scope','marketcloud','$stateParams','$rootScope','$ionicPopup',function($scope,mc, $stateParams,root,$ionicPopup) {
  
  $scope.selectedOptions= {};

  mc.products.getById($stateParams.productId,function(err,product){
    $scope.product = product;
    $scope.$apply()
  })
  $scope.addToCart = function() {

    if ($scope.product.has_variants === true ){
      
      if (Object.keys($scope.selectedOptions).length < Object.keys($scope.product.variantsDefinition).length)
        return $ionicPopup.alert({
              title:"Action required",
              template : "Please select the required options for this product."
            })
      
      var chosen = null;
      for (var i=0; i< $scope.product.variants.length; i++){
        var curr = $scope.product.variants[i];

        var all_match = true;
        for (var k in $scope.selectedOptions){

          if (curr[k] !== $scope.selectedOptions[k]){
            all_match = false;
          }
        }

        if (true === all_match){
          chosen = curr;
        }

      }
      console.log("ADDO",{product_id : $scope.product.id, quantity: 1, variant_id : chosen.id})
      mc.carts.add(window.localStorage['marketcloud.cart_id'],[
        {product_id : $scope.product.id, quantity: 1, variant_id : chosen.id}
      ],function(err,data){
        if (err)
          return $ionicPopup.alert({
              title:"Error",
              template : "An error has occurred, please try again."
            })

        root.cart = data;
        root.$broadcast('cartUpdate');
        $ionicPopup.alert({
               title: 'Message',
               template: 'The item was added to cart'
        });

      })
    } else{
      var prod = $scope.product;
    console.log("Aggiungo ",prod)
    mc.carts.add(window.localStorage['marketcloud.cart_id'],[{product_id : prod.id,quantity:1, variant_id:0}],function(err,data){
      if (err)
          return $ionicPopup.alert({
              title:"Error",
              template : "An error has occurred, please try again."
            })
      else {
        root.cart = data;
        root.$broadcast('cartUpdate');
        popup.alert({
               title: 'Message',
               template: 'The item was added to cart'
        });
        //$scope.$apply()
      }
    })
    }
    

    



  }
}])

.controller('AccountCtrl',function($scope,marketcloud,$state){
  console.log("AccountCtrl")
  $scope.user = {};
  $scope.orders = [];

  marketcloud.users.getCurrent(function(err,data){
    if (err)
      throw new Error("Error while loading user informations");
    else{
      console.log(data)
      $scope.user = data;
    }
  })
})

.controller('OrdersCtrl',function($scope,marketcloud,$state){
  console.log("OrdersCtrl")

  $scope.orders = [];

  marketcloud.orders.list({},function(err,data){
    if (err)
      throw new Error("Error while loading orders");
    else{
      console.log(data)
      $scope.orders = data;
    }
  })
})

.controller('CartCtrl', ['$scope','marketcloud','$rootScope','$ionicPopup','$ionicLoading',
    function($scope,mc,root,popup,$ionicLoading) {
  console.log("CartCtrl")
  root.$on('cartUpdate',function(data){
    console.log("I am the cart controller and i must update with",data)
    $scope.$apply()

  })

  $scope.getVariantValues = function(product){
    if (!product.hasOwnProperty('variantsDefinition'))
      return {};

    var result = {};
    for (var k in product.variantsDefinition){
      result[k] = product.variant[k];
    }
    return result;
  }



  $scope.$on('$ionicView.enter', function(e) {
    $ionicLoading.show({
      template: 'Loading...',
      noBackdrop:true
    });
    mc.carts.getById(window.localStorage['marketcloud.cart_id'],function(err,cart){
      $ionicLoading.hide()
        if (err){
          console.log("I am the cart controller and I Cannot update the cart")
          console.log(err)
        }
        console.log("I am the cart controller and i have updated",cart)
        $scope.cart = cart;
        $scope.$apply()
    })
  });




  $scope.increase = function(item) {

    console.log("CALL INCREASE ON ",product2LineItem(item))
    item.quantity += 1;
  }
    $scope.decrease = function(item) {
      console.log("CALL DECREASE ON ",product2LineItem(item))
    if (item.quantity >0)
      item.quantity -= 1;
  }
  $scope.update = function() {
      var update = [];
      console.log("PARTE L UPDATE AMICI",$scope.cart.items)
      $scope.cart.items.forEach(function(i){
        update.push({
          product_id : i.id,
          quantity : i.quantity,
          variant_id : i.variant.id || 0
        })
      })

      marketcloud.carts.update($scope.cart.id,update,function(err,cart){
        
        if (err)
          console.log(err)
        else{
          update = []
          root.cart = cart;
          $scope.$apply();
          
          popup.alert({
               title: 'Message',
               template: 'Your cart has been updated'
             });
        
        }
        
      })
    };


    $scope.incr = function(prod) {

    }

}])
.factory('CheckoutData',function(){
  return {
    shipping_address : {},
    billing_address : {},
    credit_card : {}
  }
})
.controller('CheckoutCtrl',function($scope,marketcloud,$state,CheckoutData,$ionicPopup,$rootScope,$http){
  console.log("CheckoutCtrl")
  $scope.billingAddressSameAsShippingAddress = true;
  $scope.errorMessage = null;
  $scope.shipping_address = CheckoutData.shipping_address;
  $scope.billing_address = CheckoutData.billing_address;
  $scope.credit_card = CheckoutData.credit_card;

console.log("marketcloud",marketcloud)
    $scope.$on('$ionicView.enter', function(e) {
      if (window.localStorage['marketcloud.address']) {
          marketcloud.addresses.list({},function(err,data){
          if (err)
            $ionicPopup.alert({
              title:"error",
              template : "An error has occurred while downloading your addresses. Please insert a new one."
            })
          else {
            console.log("Trovati "+data.length+" indirizzi")
            $scope.available_addresses = data;
          $scope.apply()
          }
          
        })
      }
      marketcloud.carts.getById(window.localStorage['marketcloud.cart_id'],function(err,data){
        if (err) {
          $ionicPopup.alert({
              title:"error",
              template : "An error has occurred while loading the cart, please try again."
            })
        } else {
          console.log("Sono il checkout e ho trovato il carrello ",data)
          $scope.cart = data
        }
      })
  });


  

  $scope.checkShippingAddressAndProceed = function() {
    console.log($scope.shipping_address)

    CheckoutData.shipping_address = $scope.shipping_address;
    $state.go('app.checkout_billing');

    /*marketcloud.addresses.create($scope.shipping_address,function(err,data){
      if (err) {
        console.log(err)
        $ionicPopup.alert({
            title : "Error",
            template : 'An error has occurred while saving the address.'
          });
      } else {
        console.log("shipping_address salvato",data)
        $scope.shipping_address = data;
        CheckoutData.shipping_address = data;
        $state.go('app.checkout_billing');
      }
    })*/


  }




  $scope.checkBillingAndProceed = function() {
    
    var stripe_data = {
        number: $scope.credit_card.number,
        cvc: $scope.credit_card.cvc,
        exp_month: $scope.credit_card.expiry.split('/')[0],
        exp_year: $scope.credit_card.expiry.split('/')[1]
      }
      
    
      Stripe.card.createToken(stripe_data, function(status,response){
        console.log("Ciao sono il callback di stripe, figo eh! Prima status poi response",status,response)
       // 
       if (status < 400) {
        CheckoutData.credit_card = $scope.credit_card;
        CheckoutData.stripe_token = response.id;

        $state.go('app.checkout_billing_address');
      } else {
        
        $ionicPopup.alert({
          title : 'error',
          template : response.error.message
        })
      }
      });
      
    }



  $scope.checkBillingAddressAndProceed = function() {
    if ($scope.billingAddressSameAsShippingAddress)
      CheckoutData.billing_address = CheckoutData.shipping_address;
    else
      CheckoutData.billing_address = $scope.billing_address;
    $state.go('app.checkout_review');
    console.log("CHeckout data",CheckoutData)
  }

  $scope.doCheckout = function() {

    //console.log("CheckoutData",CheckoutData)
    if (!$scope.cart || $scope.cart.items.length === 0)
      throw new Error("Impossible to checkout this cart".$scope.cart)

    var the_order = {
      items :$scope.cart.items,
      shipping_address : $scope.shipping_address,
      billing_address : $scope.billing_address
    }
    //console.log("Creating this order",the_order)

    marketcloud.orders.create(the_order,function(err,created_order){
      if (err)
        console.log("an error has occurred while creating the order",err)
      else{
          

          var payload = {
              amount : Math.round(created_order.total*100),
              stripe_token : CheckoutData.stripe_token
            }
            console.log("Mando questo payload",payload)
          $http({
            method : 'POST',
            url : 'http://localhost:5000/v0/integrations/stripe/charge',
            data : payload,
            headers: {
            Authorization: marketcloud.public
          }

          }).success(function(response){
            $ionicPopup.alert({
            title : "Success",
            template : 'Your order was placed successfully'
          });
          }).error(function(response){
            $ionicPopup.alert({
            title : "Error",
            template : 'There was an error while processing the payment.'
          });
            console.log(response)
          })

          
          /*$scope.shipping_address = {}
          $scope.billing_address = {}
          $scope.credit_card = {}*/

          $state.go('app.products');
      }
    })
  }

})

