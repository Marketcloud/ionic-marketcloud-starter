function product2LineItem(prod) {

  return {
    product_id: prod.id,
    variant_id: prod.variant_id || 0
  }
}

angular.module('starter.controllers', [])



.controller('AppCtrl', function($scope, $ionicModal, $timeout, marketcloud, $ionicPopup, $state,  CartService) {


  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  //

})

.controller('CategoriesCtrl', ['$scope', 'marketcloud', '$state',
  function($scope, mc, $state) {
    $scope.categories = [];
    mc.categories.list({}, function(err, categories) {
      $scope.categories = categories;
      $scope.$apply()
    })

    $scope.loadCategoryProducts = function(cat) {
      var query = {
        category_id: cat.id
      }
      $state.go('app.products', {query : query})
    }
  }
])
  .controller('ProductsCtrl', ['$scope', 'marketcloud', '$stateParams','products',
    function($scope, mc, $stateParams,products) {
      $scope.query = {};

      /*for (key in $stateParams)
        if (null !== $stateParams[key])
          $scope.query[key] = $stateParams[key]



      $scope.products = [];
      mc.products.list($scope.query, function(err, products) {
        if (err)
          $ionicPopup.alert({
            title : 'Error',
            template : 'An error has occurred. Please try again'
          })
        $scope.products = products;
        $scope.$apply()
      })*/
      $scope.products = products;
      $scope.loadProducts = function(p) {

        if ($scope.query.q === '')
          delete $scope.query.q
        mc.products.list($scope.query, function(err, products) {
          if (err)
          $ionicPopup.alert({
            title : 'Error',
            template : 'An error has occurred. Please try again'
          })
          $scope.products = products;
          $scope.$apply()
        })


      }
    }
  ])

.controller('ProductCtrl',
  function($scope, $stateParams,  $ionicPopup, $ionicLoading, product, CartService) {

    $scope.selectedOptions = {};

    $scope.product = product

    function AllRequiredOptionsAreSelected() {
      return Object.keys($scope.selectedOptions).length === Object.keys($scope.product.variantsDefinition).length
    }

    $scope.addToCart = function() {

      $ionicLoading.show({template : 'Adding to cart...'});

      var promise = null;

      if ($scope.product.has_variants === true) {

        if (!AllRequiredOptionsAreSelected()){
          $ionicLoading.hide();
          return $ionicPopup.alert({
            title: "Action required",
            template: "Please select the required options for this product."
          });
        }
          

        var selectedVariant = getSelectedVariant();
        promise = CartService.add([{
          product_id: $scope.product.id,
          quantity: 1,
          variant_id: selectedVariant.id
        }]);
      } else {
        promise = CartService.add([{
          product_id: $scope.product.id,
          quantity: 1,
          variant_id: 0
        }]);
      }


      promise
        .then(function(cart){
          $ionicLoading.hide();
          $ionicPopup.alert({
              title: 'Message',
              template: 'The item was added to cart'
          });
        })
        .catch(function(error){
          $ionicLoading.hide();
          $ionicPopup.alert({
              title: "Error",
              template: "An error has occurred, please try again."
          })
        })
    }


  function getSelectedVariant() {
    var chosen = null;
    for (var i = 0; i < $scope.product.variants.length; i++) {
      var curr = $scope.product.variants[i];

      var all_match = true;
      for (var k in $scope.selectedOptions) {

        if (curr[k] !== $scope.selectedOptions[k]) {
          all_match = false;
        }
      }

      if (true === all_match) {
        chosen = curr;

      }

    }
    return chosen;
  }



  }
)



.controller('CartCtrl',
  function($scope, $ionicLoading, CartService,cart) {

    $scope.cart = cart;
    

    $scope.getVariantValues = function(product) {
      if (!product.hasOwnProperty('variantsDefinition'))
        return {};

      var result = {};
      for (var k in product.variantsDefinition) {
        result[k] = product.variant[k];
      }
      return result;
    }

    $scope.getCartTotal = function() {
      if ($scope.cart.items && $scope.cart.items.length > 0) {
        return $scope.cart.items.map(function(x) {
          return x.price * x.quantity;
        }).reduce(function(a, b) {
          return a + b;
        });
      } else
        return 0
    }






    $scope.increase = function(item) {
      item.quantity += 1;
      var items = [{
        product_id: item.id,
        variant_id: item.variant_id || 0,
        quantity: 1
      }]

      CartService.add(items)
      .then(function(response){
        $scope.cart = CartService.data;
      })
      .catch(function(response){
        $ionicPopup.alert({
          title:'Error',
          template:'An error has occurred, please try again.'
        })
        item.quantity +=1;
      })
    }

    $scope.decrease = function(item) {
      item.quantity -= 1;
      var items = [{
        product_id: item.id,
        variant_id: item.variant_id || 0,
        quantity: -1
      }]

      CartService.add(items)
      .then(function(response){
        $scope.cart = CartService.data;
      })
      .catch(function(response){
        $ionicPopup.alert({
          title:'Error',
          template:'An error has occurred, please try again.'
        })
        item.quantity +=1;
      })
    }


  }
)
  .factory('CheckoutData', function() {
    return {
      shipping_address: {},
      billing_address: {},
      credit_card: {}
    }
  })
  .controller('CheckoutCtrl', function($scope, marketcloud, $state, CheckoutData, $ionicPopup, $http, CartService,$ionicLoading) {
    
    
    $scope.billingAddressSameAsShippingAddress = true;
    $scope.errorMessage = null;
    $scope.shipping_address = CheckoutData.shipping_address;
    $scope.billing_address = CheckoutData.billing_address;
    $scope.credit_card = CheckoutData.credit_card;



    $scope.checkShippingAddressAndProceed = function() {
      

      CheckoutData.shipping_address = $scope.shipping_address;
      $state.go('app.checkout_billing');
    }

    $scope.checkBillingAndProceed = function() {
      var stripe_data = {
        number: $scope.credit_card.number,
        cvc: $scope.credit_card.cvc,
        exp_month: $scope.credit_card.expiry.split('/')[0],
        exp_year: $scope.credit_card.expiry.split('/')[1]
      }
      $ionicLoading.show({ template : 'Checking credit card data'});

      /*
      *
      * This is an example of card validation using stripe
      * It calls the stripe service in order to get a stripe token
      * This token can be used to make charges server side.
      *
      * Using Marketcloud's Stripe integration you can just
      * obtain this token and use it to create a charge using our
      * integration endpoint '/integrations/stripe/charge'
      *
      * This will also create a payment in your Marketcloud Store
      * and will update the order status to Paid.
      *
      * 
      Stripe.card.createToken(stripe_data, function(status, response) {
        $ionicLoading.hide();
        
        if (status < 400) {
          CheckoutData.credit_card = $scope.credit_card;
          CheckoutData.stripe_token = response.id;

          $state.go('app.checkout_billing_address');
        } else {

          $ionicPopup.alert({
            title: 'error',
            template: response.error.message
          })
        }
      });

    */
   
    window.setTimeout(function(){
      $ionicLoading.hide();
      $state.go('app.checkout_billing_address');
    },1500)

    }



    $scope.checkBillingAddressAndProceed = function() {

      if ($scope.billingAddressSameAsShippingAddress)
        CheckoutData.billing_address = CheckoutData.shipping_address;
      else
        CheckoutData.billing_address = $scope.billing_address;

      $state.go('app.checkout_review');
    }

    $scope.doCheckout = function() {
      
      $scope.cart = CartService.data;
      
      if (!$scope.cart || $scope.cart.items.length === 0)
        throw new Error("Impossible to checkout this cart", $scope.cart)

      var the_order = {
        cart_id: Number(window.localStorage['marketcloud.cart_id']),
        shipping_address: $scope.shipping_address,
        billing_address: $scope.billing_address
      }
      

      $ionicLoading.show({ template : 'Placing order'});

      marketcloud.orders.create(the_order, function(err, created_order) {
        if (err){

          $ionicLoading.hide();
          $ionicPopup.alert({
            title: "Error",
            template: 'An error has occurred while creating the order. Please retry.'
          });


        }
        else {
          // Messages for the user
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: "Success",
            template: 'Your order was placed successfully'
          });


          //The order was created in pending state,
          
          // If you are using a payment service integrated with Marketcloud
          // the Order will be updated automatically.
          // 
          // 
          // Example using stripe
          // 
          // 
          // 
          // 
          // 
          // If you activated the stripe integration in our dashboard, 
          // you can make a stripe charge using our api (/v0/integrations/stripe/charge)
          // passing along the order id ,the amount and the stripe token.
          // 
          // Our systems will make the call to stripe for you, and if the charge
          // is successful, we automatically update the order to "paid"

          //
          // TODO: Add here your call to the payment method
          // 


          // Resetting state
          $scope.shipping_address = {};
          $scope.billing_address = {};
          $scope.credit_card = {};

          //We create a new cart, since the old one was promoted to order
          marketcloud.carts.create([],function(err,data){
            // Going back to home view
            $state.go('app.home');
            window.localStorage['marketcloud.cart_id'] = data.id;


          })

          

          
        }
      })
    }

  })