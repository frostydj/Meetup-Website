const eventAttendees = require('../controllers/events.attendees.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/events/:id/attendees')
        .get(eventAttendees.getAttendees)
        .post(eventAttendees.create)
        .delete(eventAttendees.delete);

    app.route(app.rootUrl + '/events/:eventId/attendees/:userId')
        .patch(eventAttendees.edit);
}