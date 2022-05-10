module.exports = function(app,passport){

    app.get('/register', function (req, res) {
        res.render('register_forms/register_1.dust');
    });

    app.get('/register/coach', function (req, res) {
        return res.render('register_forms/coach-register.dust');
    })

    app.get('/register/client', function (req, res) {
        return res.render('register_forms/client-register.dust');
    })

    //render only if the username firstly was occupied
    app.get('/signup', function (req, res) {//flashes only ones
        res.render('register_forms/register-credentials.dust', {accID : req.flash('id')[0], message : req.flash('signup-Message')[0]});

    })

    app.get('/login',(req,res) => {
        res.render('login', {message : req.flash('loginMessage')[0]})
    });

    app.post('/signup', passport.authenticate('local-register', {
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
        }),
        function (req, res) {
            res.redirect('/' + req.user.username);
    });

    app.post('/login', passport.authenticate('local-login',{
            failureRedirect : '/login',
            failureFlash: true
        }),
        function (req, res) {
             res.redirect('/' + req.user.username);
        }
    );

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });

    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();
        // if they aren't render login page
        res.redirect('/login');
    }
};