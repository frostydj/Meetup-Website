const db = require('../../config/db');

exports.getAll = async function(q, categoryIds, organizerId, sortBy, count, startIndex) {
    console.log('Request to get all events...');

    const conn = await db.getPool().getConnection();
    let qQuery = "";
    let categoryIdsQuery = "";
    let organizerIdQuery = "";
    let sortByQuery = "";
    if (startIndex === undefined) {
        startIndex = 0;
    }
    if (count === undefined) {
        count = 1844674407370955; //Arbitrary large number for "limitless" count
    }
    let pagination = "LIMIT " + startIndex + ", " + count;

    if (q !== undefined) {
        qQuery = "(title LIKE '%" + q + "%' OR description LIKE '%" + q + "%')";
    }

    if (categoryIds !== undefined) {
        categoryIdsQuery = "event.id IN (SELECT DISTINCT event.id FROM event JOIN event_category ON " +
            "event.id = event_category.event_id WHERE ";
        if (categoryIds.length === 1) {
            categoryIdsQuery += "event_category.category_id = " + categoryIds;
        } else {
            for (let i = 0; i < categoryIds.length; i++) {
                categoryIdsQuery += "event_category.category_id = " + categoryIds[i];
                if (i < categoryIds.length - 1) {
                    categoryIdsQuery += " OR ";
                }
            }
        }
        categoryIdsQuery += ")";
    }

    if (organizerId !== undefined) {
        organizerIdQuery = "organizer_id = " + organizerId;
    }

    if (sortBy !== undefined) {
        sortByQuery = "ORDER BY "

        switch (sortBy) {
            case 'ALPHABETICAL_ASC':
                sortByQuery += "title ASC";
                break;
            case 'ALPHABETICAL_DESC':
                sortByQuery += "title DESC";
                break;
            case 'DATE_ASC':
                sortByQuery += "date ASC";
                break;
            case 'DATE_DESC':
                sortByQuery += "date DESC";
                break;
            case 'ATTENDEES_ASC':
                sortByQuery += "numAcceptedAttendees ASC";
                break;
            case 'ATTENDEES_DESC':
                sortByQuery += "numAcceptedAttendees ASC";
                break;
            case 'CAPACITY_ASC':
                sortByQuery += "capacity ASC";
                break;
            case 'CAPACITY_DESC':
                sortByQuery += "capacity ASC";
                break;
        }
        sortByQuery += ", title ASC "
    } else {
        sortByQuery = "ORDER BY date DESC, title ASC ";
    }

    const selectQuery = 'SELECT event.id AS eventId, title, GROUP_CONCAT(event_category.category_id) as categories, date, user.first_name as organizerFirstName, user.last_name as organizerLastName, ' +
        '(Select count(*) FROM event_attendees WHERE event_attendees.event_id = event.id AND attendance_status_id = 1) AS numAcceptedAttendees, capacity ';
    const fromQuery = 'FROM event join event_category on event.id=event_category.event_id join user on organizer_id=user.id ';
    let whereQuery = "";
    let whereQueryExists = false;
    const whereQueries = [qQuery, categoryIdsQuery, organizerIdQuery];
    for (const query of whereQueries) {
        if (query !== "") {
            if (whereQueryExists) {
                whereQuery += "AND " + query + " ";
            } else {
                whereQuery += "WHERE " + query + " ";
                whereQueryExists = true;
            }
        }
    }

    const groupQuery = 'GROUP BY event.id ';
    const fullQuery = selectQuery + fromQuery + whereQuery + groupQuery + sortByQuery + pagination;
    const [result] = await conn.query(fullQuery);
    conn.release();
    return result;
}


exports.create = async function(newEvent) {
    console.log(`Request to create a new event: ${newEvent.title}...`);

    const conn = await db.getPool().getConnection();
    const createEventQuery = 'INSERT INTO event (title, description, date, is_online, url ,venue, capacity, requires_attendance_control, fee, organizer_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await conn.query(createEventQuery, [newEvent.title, newEvent.description, newEvent.date, newEvent.isOnline, newEvent.url, newEvent.venue,
                                                        newEvent.capacity, newEvent.requiresAttendanceControl, newEvent.fee, newEvent.organizerId]);
    const linkEventCategory = 'INSERT INTO event_category (event_id, category_id) values (?, ?)';
    for (const id of newEvent.categoryIds) {
        await conn.query(linkEventCategory, [result.insertId, parseInt(id)]);
    }

    conn.release();
    return result;
}

exports.getOne = async function(id) {
    console.log(`Request to get event ${id}...`);

    const conn = await db.getPool().getConnection();
    const query = 'SELECT event.id as eventId, title, GROUP_CONCAT(event_category.category_id) as categories, user.first_name as organizerFirstName, ' +
        '(Select count(*) FROM event_attendees WHERE event_attendees.event_id = event.id AND attendance_status_id = 1) AS numAcceptedAttendees, ' +
        'user.last_name as organizerLastName, organizer_id as organizerId, date, is_online as isOnline, url, venue, ' +
        'requires_attendance_control as requiresAttendanceControl, fee ' +
        'FROM event join event_category on event.id=event_category.event_id join user on organizer_id=user.id WHERE event.id = ? GROUP BY event.id'
    const [result] = await conn.query(query, id);
    conn.release();
    return result[0];
}

exports.delete = async function(id) {
    console.log(`Request to delete event ${id}...`);

    const conn = await db.getPool().getConnection();
    await conn.query('Delete from event_category where event_id = ?', id);
    await conn.query('Delete from event_attendees where event_id = ?', id);
    await conn.query('Delete from event where id = ?', id);
    conn.release();
}

exports.edit = async function(id, fieldsToUpdate, categories) {
    console.log(`Request to patch event ${id}...`);

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE event SET ? where id = ?';
    const result = await conn.query(query, [fieldsToUpdate, id]);
    conn.release();

    await conn.query('DELETE FROM event_category WHERE event_id = ?', id)
    const linkEventCategory = 'INSERT INTO event_category (event_id, category_id) values (?, ?)';
    for (const categoryId of categories) {
        await conn.query(linkEventCategory, [id, parseInt(categoryId)]);
    }
    return result;
}

exports.getCategories = async function() {
    console.log('Request to get all categories');

    const conn = await db.getPool().getConnection();
    const query = 'SELECT id AS categoryId, name FROM category';
    const [result] = await conn.query(query);
    conn.release();
    return result;
}

exports.getOrganizerId = async function(eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT organizer_id FROM event WHERE id = ?';
    const [result] = await conn.query(query, eventId);
    conn.release();
    return result[0].organizer_id;
}

exports.getEventDate = async function(eventId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT date FROM event WHERE id = ?';
    const [result] = await conn.query(query, eventId);
    conn.release();
    return result[0].date;
}

exports.categoryExists = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM category WHERE id = ?';
    const [result] = await conn.query(query, id);
    conn.release();
    return result.length === 1;
}

exports.eventExists = async function(title, date, organizerId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM event WHERE title = ? AND date = ? AND organizer_id = ?';
    const [result] = await conn.query(query, [title, date, organizerId]);
    conn.release();
    return result.length === 1;
}