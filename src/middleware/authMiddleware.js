/**
 * Middleware to require user authentication
 * Redirects to login if user is not authenticated
 */
const requireLogin = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
};

module.exports = {
  requireLogin,
};
