/**
 * Flash message middleware
 * Provides req.flash() functionality similar to connect-flash
 */
function flashMiddleware(req, res, next) {
  // Initialize flash if not present
  if (!req.session.flash) {
    req.session.flash = {};
  }

  // Flash function to set messages
  req.flash = function (type, message) {
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }
    req.session.flash[type].push(message);
  };

  // Get flash function to retrieve and clear messages
  req.getFlash = function (type) {
    const messages = req.session.flash[type] || [];
    delete req.session.flash[type];
    return messages;
  };

  // Make flash messages available to views
  res.locals.success = req.getFlash("success");
  res.locals.error = req.getFlash("error");
  res.locals.info = req.getFlash("info");
  res.locals.warning = req.getFlash("warning");

  next();
}

module.exports = flashMiddleware;
