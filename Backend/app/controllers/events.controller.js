const event = require('../models/events.model');
const user = require('../models/users.model')

exports.getAll = async function(req, res) {
    console.log('\nRequest to get events');
    const q = req.query.q;
    const categoryIds = req.query.categoryIds;
    const organizerId = req.query.organizerId;
    const sortBy = req.query.sortBy;
    const count = req.query.count;
    let startIndex = req.query.startIndex;
    let eventCategoriesValid = true;

    try {
        if (categoryIds) {
            const categories = new Array(categoryIds);
            for (const id of categories) {
                if (!(await event.categoryExists(id))) {
                    eventCategoriesValid = false;
                }
            }
        }
        let result = await event.getAll(q, categoryIds, organizerId, sortBy, count, startIndex);
        for (const event of result) {
            event.categories = event.categories.split(',');
            for (let i = 0; i < event.categories.length; i++) {
                event.categories[i] = parseInt(event.categories[i]);
            }
        }

        if (!eventCategoriesValid) {
            res.statusMessage = "one or more invalid category IDs";
            res.status(400).end();
        } else {
            res.status(200)
                .send(result);
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR getting all events: ${err}`);
    }
}

exports.create = async function(req, res) {
    console.log('\nRequest to create an event...');

    const eventObject = {
        "title": "",
        "description": "",
        "categoryIds": "",
        "date": "",
        "isOnline": "",
        "url": "",
        "venue": "",
        "capacity": "",
        "requiresAttendanceControl": "",
        "fee": "",
        "organizerId": ""
    }
    let newEvent = {};
    Object.keys(eventObject).map(function(key, index) {
        newEvent[key] = req.body[key];
    });

    try {
        const token = req.headers['x-authorization'];
        const loggedInUser = await user.getUserByToken(token);
        if (!loggedInUser) {
            res.status(401).end();
        } else {
            const userId = loggedInUser["id"];
            const currDate = new Date();

            const eventExists = await event.eventExists(newEvent.title, newEvent.date, userId)

            if (eventExists) {
                res.status(400).end();
            } else {
                if (newEvent.title.length >= 1 && newEvent.description.length >= 1 && newEvent.categoryIds.length >= 1 && new Date(newEvent.date) > currDate) {
                    if (newEvent.isOnline === undefined) {
                        newEvent.isOnline = false;
                    }
                    if (newEvent.requiresAttendanceControl === undefined) {
                        newEvent.requiresAttendanceControl = false;
                    }
                    if (newEvent.fee === undefined) {
                        newEvent.fee = 0;
                    }

                    newEvent.organizerId = userId;

                    const result = await event.create(newEvent);
                    res.status(201)
                        .send({eventId: result.insertId});
                } else {
                    res.status(400)
                        .send();
                }
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR creating event: ${err}`);
    }
}

exports.getOne = async function(req, res) {
    console.log('\nRequest to get event by ID...');

    const id = req.params.id;
    try {
        const result = await event.getOne(id);

        if (result) {
            result.categories = result.categories.split(',');
            for (let i = 0; i < result.categories.length; i++) {
                result.categories[i] = parseInt(result.categories[i]);
            }

            res.status(200)
                .send(result);
        } else {
            res.status(404).end();
        }

    } catch (err) {
        res.status(500)
            .send(`ERROR getting event ${id}: ${err}`);
    }
}

exports.delete = async function(req, res) {
    console.log('\nRequest to delete event...');

    const id = req.params.id;
    try {
        const token = req.headers['x-authorization'];
        const loggedInUser = await user.getUserByToken(token);
        let organizerId;

        if (!(await event.getOne(id))) {
            organizerId = null;
        } else {
            organizerId = await event.getOrganizerId(id);
        }

        if (!loggedInUser) {
            res.status(401).end();
        } else if (organizerId === null) {
            res.status(404).end();
        } else if (loggedInUser["id"] !== organizerId){
            res.status(403).end();
        } else {
            await event.delete(id);
            res.status(200)
                .send();
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR deleting event ${id}: ${err}`);
    }
}

exports.edit = async function(req, res) {
    console.log('\nRequest to patch event');

    const id = req.params.id;
    const title = req.body.title;
    const description = req.body.description;
    const date = req.body.date;
    let isOnline = req.body.isOnline;
    let url = req.body.url;
    let venue = req.body.venue;
    let capacity = req.body.capacity;
    let requiresAttendanceControl = req.body.requiresAttendanceControl;
    let fee = req.body.fee;
    let categories = req.body.categoryIds;

    let titleValid = false;
    let descriptionValid = false
    let dateValid = false;
    let isOnlineValid = false;
    let requiresAttendanceControlValid = false;
    let categoriesValid = true;

    try {
        const token = req.headers['x-authorization'];
        const loggedInUser = await user.getUserByToken(token);
        let organizerId;

        if (!(await event.getOne(id))) {
            organizerId = null;
        } else {
            organizerId = await event.getOrganizerId(id);
        }

        if (!loggedInUser) {
            res.status(401).end();
        } else if (organizerId === null) {
            res.status(404).end();
        } else if (loggedInUser["id"] !== organizerId) {
            res.status(403).end();
        } else {
            let fieldsToUpdate = {};
            const currentEventDate = await event.getEventDate(id);
            if (currentEventDate < new Date()) {
                res.statusMessage = "cant patch an event that is in the past"
                res.status(400).end();
            } else {
                if (date !== undefined) {
                    const newDate = new Date(date);
                    const currDate = new Date();
                    if (newDate > currDate) {
                        fieldsToUpdate["date"] = newDate;
                        dateValid = true;
                    } else {
                        res.statusMessage = "event date must be in the future"
                        res.status(400).end();
                    }
                } else {
                    dateValid = true;
                }

                if (title !== undefined && dateValid) {
                    if (title.length >= 1) {
                        fieldsToUpdate["title"] = title;
                        titleValid = true;
                    } else {
                        res.statusMessage = "data.title should NOT be shorter than 1 character";
                        res.status(400).end();
                    }
                } else {
                    titleValid = true;
                }

                if (description !== undefined && titleValid) {
                    if (description.length >= 1) {
                        fieldsToUpdate["description"] = description;
                        descriptionValid = true;
                    } else {
                        res.statusMessage = "data.description should NOT be shorter than 1 character";
                        res.status(400).end();
                    }
                } else {
                    descriptionValid = true;
                }

                if (isOnline !== undefined && descriptionValid) {
                    if (isOnline === null) {
                        isOnline = false;
                    }
                    if (isOnline === false || isOnline === true) {
                        fieldsToUpdate["is_online"] = isOnline;
                        isOnlineValid = true;
                    } else {
                        res.statusMessage = "data.isOnline should be false or true";
                        res.status(400).end();
                    }
                } else {
                    isOnlineValid = true;
                }

                if (requiresAttendanceControl !== undefined && isOnlineValid) {
                    if (requiresAttendanceControl === null) {
                        requiresAttendanceControl = false;
                    }
                    if (requiresAttendanceControl === false || requiresAttendanceControl === true) {
                        fieldsToUpdate["requires_attendance_control"] = requiresAttendanceControl;
                        requiresAttendanceControlValid = true;
                    } else {
                        res.statusMessage = "data.requiresAttendanceControl should be false or true";
                        res.status(400).end();
                    }
                } else {
                    requiresAttendanceControlValid = true;
                }

                if (url !== undefined) {
                    if (url.length === 0) {
                        url = null;
                    }
                    fieldsToUpdate["url"] = url;
                }

                if (venue !== undefined) {
                    if (venue.length === 0) {
                        venue = null;
                    }
                    fieldsToUpdate["venue"] = venue;
                }

                if (capacity !== undefined) {
                    if (capacity.length === 0 || capacity < 0) {
                        capacity = null;
                    }
                    fieldsToUpdate["capacity"] = capacity;
                }

                if (fee !== undefined) {
                    if (fee.length === 0 || fee < 0) {
                        fee = 0;
                    }
                    fieldsToUpdate["fee"] = fee;
                }

                if (categories !== undefined && requiresAttendanceControlValid) {
                    for (const category of categories) {
                        console.log("category: " + category)
                        const categoryExists = await event.categoryExists(category);
                        console.log(categoryExists);
                        if (!categoryExists) {
                            categoriesValid = false;
                            break;
                        }
                    }
                }

                if (categoriesValid) {

                    await event.edit(id, fieldsToUpdate, categories);
                    res.status(200)
                        .send();
                } else {
                    res.statusMessage = "at least one categoryId does not match any existing category";
                    res.status(400).end();
                }
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR updating event ${id}: ${err}`);
    }
}

exports.getCategory = async function(req, res) {
    console.log('\nRequest to get all event category data');

    try {
        const result = await event.getCategories();
        res.status(200)
            .send(result);
    } catch (err) {
        res.status(500)
            .send(`ERROR getting event category data: ${err}`);
    }}