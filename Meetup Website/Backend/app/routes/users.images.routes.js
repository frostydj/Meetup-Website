const userImages = require('../controllers/users.images.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/:id/image')
        .get(userImages.getImage)
        .delete(userImages.delete)
        .put(userImages.update);
}