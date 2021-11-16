const events = require('../controllers/events.controller');

module.exports = function(app) {
    app.route(app.rootUrl + '/events')
        .get(events.getAll)
        .post(events.create);

    app.route(app.rootUrl + '/events/categories')
        .get(events.getCategory);

    app.route(app.rootUrl + '/events/:id')
        .get(events.getOne)
        .delete(events.delete)
        .patch(events.edit);
}