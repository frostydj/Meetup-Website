const eventAttendee = require('../models/events.attendees.model');
const event = require('../models/events.model');
const user = require('../models/users.model');

const statusIds = {
    "accepted": "1",
    "pending": "2",
    "rejected": "3"
}

exports.getAttendees = async function(req, res) {
    console.log('\nRequest to get attendees...');
    const eventId = req.params.id;
    const token = req.headers["x-authorization"];

    try {
        if (!(await event.getOne(eventId))) {
            res.status(404).end()
        } else {
            const loggedInUser = await user.getUserByToken(token);
            let userId = null;

            if (loggedInUser) {
                userId = loggedInUser["id"];
            }
            const organizerId = await event.getOrganizerId(eventId);

            let result;
            if (parseInt(organizerId) === userId) {
                result = await eventAttendee.getAllRequestedAttendees(eventId);
            } else {
                result = await eventAttendee.getAcceptedAttendees(eventId, userId);
            }

            res.status(200)
                .send(result);

        }
    } catch (err) {
        res.status(500)
            .send(`ERROR getting event attendees: ${err}`);
    }
}

exports.create = async function(req, res) {
    console.log('\nRequest to join event as attendee...');
    const eventId = req.params.id;
    const token = req.headers["x-authorization"];

    try {
        const loggedInUser = await user.getUserByToken(token);
        if (!loggedInUser) { //No token exists
            res.status(401)
                .end();
        } else {
            const userId = loggedInUser["id"];
            const reqEvent = await event.getOne(eventId);
            if (!reqEvent) {
                res.status(404)
                    .end();
            } else if (new Date() > reqEvent.date) {
                res.statusMessage = "can not attend event that has already happened";
                res.status(403)
                    .end();
            } else if (await eventAttendee.isAttending(eventId, userId)) {
                res.statusMessage = "cannot register for an event more than once";
                res.status(403)
                    .end();
            } else {
                await eventAttendee.create(eventId, userId);
                res.status(201)
                    .send();
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR joining event: ${err}`);
    }
}

exports.delete = async function(req, res) {
    console.log('\nRequest to remove attendee from event...');

    const token = req.headers["x-authorization"];

    try {
        const loggedInUser = await user.getUserByToken(token);
        if (!loggedInUser) {
            res.status(401)
                .end();
        } else {
            const eventId = req.params.id;
            const userId = loggedInUser["id"];
            const reqEvent = await event.getOne(eventId);

            if (!(await eventAttendee.isAttending(eventId, userId))) {
                res.statusMessage = "cannot unregister from an event without first registering for it"
                res.status(403)
                    .end();
            } else if (new Date () > reqEvent.date) {
                res.statusMessage = "cannot unregister from an event that is in the past"
                res.status(403)
                    .end();
            } else if (await eventAttendee.statusRejected(eventId, userId)) {
                res.statusMessage = "cannot unregister when rejected from event"
                res.status(403)
                    .end();
            } else {
                await eventAttendee.delete(eventId, userId);
                res.status(200)
                    .end();
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR removing attendee from event`);
    }
}

exports.edit = async function(req, res) {
    console.log('\nRequest to change status of attendee...');

    const token = req.headers["x-authorization"];
    const eventId = req.params.eventId;
    const attendeeId = req.params.userId;
    const status = req.body.status;
    const validStatus = ["accepted", "pending", "rejected"]

    try {
        const loggedInUser = await user.getUserByToken(token);
        const organizerId = await event.getOrganizerId(eventId)
        console.log(loggedInUser)
        if (!loggedInUser) {
            res.status(401)
                .end();
        } else if (loggedInUser["id"] !== organizerId) {
           res.status(403).end()
        } else {
            if (!(await eventAttendee.userAttendsEvent(eventId, attendeeId))) {
                res.status(404)
                    .end();
            } else if (validStatus.indexOf(status) < 0) {
                res.status(400)
                    .end();
            } else {
                const statusId = statusIds[status];
                await eventAttendee.changeStatus(eventId, attendeeId, statusId);
                res.status(200)
                    .end();
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR changing attendee's status: ${err}`);
    }
}