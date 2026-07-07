const path = require('node:path');
const ejs = require('ejs');

/**
 * Render a view with layout
 * @param {string} viewPath - Path to the view file
 * @param {Object} data - Data to pass to the view
 * @param {Object} req - Express request object
 * @returns {Promise<string>} Rendered HTML
 */
const renderWithLayout = async (viewPath, data = {}, req = null) => {
  const viewsPath = path.join(__dirname, '../views');
  
  // Add user to data if request is available
  const viewData = {
    ...data,
    user: req?.user ? req.user : null,
  };

  // Render the page content
  const pagePath = path.join(viewsPath, 'pages', `${viewPath}.ejs`);
  const pageContent = await ejs.renderFile(pagePath, viewData);

  // Render with layout
  const layoutPath = path.join(viewsPath, 'layouts', 'main.ejs');
  return await ejs.renderFile(layoutPath, {
    ...viewData,
    body: pageContent,
  });
};

module.exports = { renderWithLayout };
