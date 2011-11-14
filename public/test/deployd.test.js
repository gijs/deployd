// setup
beforeEach(function() {
  this.addMatchers({
    toExist: function() { return !!this.actual; },
    toNotExist: function() { return !this.actual; },
    toContainOne: function() { return this.actual && (this.actual.length === 1); }
  });
});

// sample data
var user = {
  email: 'skawful@gmail.com',
  name: 'Ritchie Martori',
  password: '1234'
};

var auth;

var app = {
  name: 'My Testing App'
};

var tests = {
  
  '1. creating a user': {
    route: '/user',
    data: user,
    expect: {
      _id: 'toExist',
      name: 'Ritchie Martori',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '2. find user by id': {
    route: '/user/' + user.email,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '3. login a user': {
    route: '/user/login',
    data: user,
    expect: {
      _id: 'toExist',
      password: 'toNotExist',
      auth: 'toExist',
      errors: 'toNotExist'
    },
    after: function(res) {
      auth = res.auth;
    }
  },
  
  '4. get current user': {
    route: '/me',
    expect: {
      email: user.email,
      name: user.name,
      password: 'toNotExist',
      errors: 'toNotExist'
    }
  },
  
  '5. searching users': {
    route: '/search?type=users&find={"uid": "skawful@gmail.com"}',
    expect: {
      results: 'toExist', 
      errors: 'toNotExist'
    }
  },
  
  '6. delete a user': {
    route: '/me?method=delete',
    expect: {
      errors: 'toNotExist'
    }
  },
  
  '7. creating an app': {
    route: '/app',
    data: app,
    expect: {
      _id: 'toExist',
      name: app.name,
      errors: 'toNotExist'
    },
    after: function(result) {
      app = result;
      console.log(app);
    }
  },
  
  // search supports GET and POST
  // GET
  // my-app.d.com/search/apps?find={"creator": "someuser"}
  '8. list my apps': {
    route: '/search/apps',
    data: {
      creator: user.uid
    },
    expect: {
      results: 'toExist',
      errors: 'toNotExist'
    }
  },
  
  '9. validate users': {
    route: '/user',
    data: {asdf: 1234, uid: {foo: 'bar'}, password: 1111},
    expect: {
      errors: 'toExist'
    }
  },
  
  '10. add a user to group': {
    route: '/user/test@user.com/group',
    data: {group: 'author'},
    expect: {
      group: 'author'
    }
  },
  
  '11. only 1 user per email': {
    route: '/search/users', 
    data: {email: user.email},
    expect: {
      results: 'toContainOne'
    }
  },
  
  '12. only 1 app per name': {
    route: '/search/apps', 
    data: {name: app.name},
    expect: {
      results: 'toContainOne'
    }
  }
  
};

var testNames = Object.keys(tests)
  , sorted = testNames.sort()
;

// execute tests
for(var i = 0; i < sorted.length; i++) {
  var context = sorted[i];
  if(tests.hasOwnProperty(context)) {
    describe(context, function() {
      var test = tests[context]
        , route = typeof test.route === 'function' ? test.route() : test.route
      ;
      
      it('should hit ' + route, function() {
        
        var args = []
          , finished = false
          , after = test.after
          , callback = function(res) {
            console.log('finished');
              finished = true;
              after && after(res);
              // dynamic expects
              if(test.expect) {
                for(var p in test.expect) {
                  if(test.expect.hasOwnProperty(p)) {
                    var val = res[p]
                      , ex = expect(val)
                      , expected = test.expect[p]
                      , matcher = ex[expected]
                    ;
                    
                    jasmine.log('Expect', p, test.expect[p]);
                    
                    jasmine.log(' - Received: ' + val);
                    
                    matcher
                      ? ex[test.expect[p]]()
                      : ex.toEqual(expected)
                    ;
                  }
                }
              }
            }
        ;
        
        // build arguments
        args.push(route);
        test.data && args.push(test.data);
        args.push(callback);
        
        // call d()
        d.apply(this, args);
        
        // wait for response
        waitsFor(function() {
          return finished;
        });
        
        // async continue
        runs(function() {
          expect(finished).toBeTruthy();
        });
      });
    })
  }
}