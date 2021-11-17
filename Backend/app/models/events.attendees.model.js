const db = require('../../config/db');

exports.getAcceptedAttendees = async function(eventId, userId) {
    console.log(`Request to get attendees of event ${eventId}`);

    const conn = await db.getPool().getConnection();
    const query =
        'SELECT user_id AS attendeeId, attendance_status.name AS status, user.first_name AS firstName, ' +
            'user.last_name AS lastName, date_of_interest AS dateOfInterest ' +
        'FROM event_attendees JOIN user ON event_attendees.user_id = user.id JOIN attendance_status ON ' +
            'attendance_status_id = attendance_status.id ' +
        'WHERE event_id = ' + eventId + ' AND attendance_status.id = 1 ' +
        'UNION ' +
        'SELECT user_id AS attendeeId, attendance_status.name AS status, user.first_name AS firstName, ' +
            'user.last_name AS lastName, date_of_interest AS dateOfInterest ' +
        'FROM event_attendees JOIN user ON event_attendees.user_id = user.id JOIN attendance_status ON ' +
            'attendance_status_id = attendance_status.id ' +
        'WHERE event_id = ' + eventId + ' AND user_id = ' + userId + ' ' +
        'ORDER BY dateOfInterest ASC, attendeeId ASC';

    const [result] = await conn.query(query);
    conn.release();
    return result;
}

exports.getAllRequestedAttendees = async function (eventId) {
    console.log(`Request to get all requested attendees of event ${eventId}`);

    const conn = await db.getPool().getConnection();
    const select = 'SELECT user_id AS attendeeId, attendance_status.name AS status, user.first_name AS firstName, ' +
        'user.last_name AS lastName, date_of_interest AS dateOfInterest ';
    const from = 'FROM event_attendees JOIN user ON event_attendees.user_id = user.id JOIN attendance_status ON ' +
        'attendance_status_id = attendance_status.id ';
    let where =  'WHERE event_id = ' + eventId + ' ';
    const orderBy = 'ORDER BY date_of_interest ASC, attendeeId ASC';

    const query = select + from + where + orderBy;
    const [result] = await conn.query(query);
    conn.release();
    return result;
}

exports.create = async function(eventId, userId) {
    console.log(`Request to join event ${eventId}...`);

    const conn = await db.getPool().getConnection();
    const query = 'INSERT INTO event_attendees (event_id, user_id, attendance_status_id) VALUES (?, ?, 2)';
    await conn.query(query, [eventId, userId]);
    conn.release();
}

exports.delete = async function(eventId, userId) {
    console.log(`Request to unregister from event ${eventId}`);

    const conn = await db.getPool().getConnection();
    const query = 'DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?';
    await conn.query(query, [eventId, userId]);
    conn.release();
}

exports.changeStatus = async function(eventId, userId, status) {
    console.log(`Request to change status of user ${userId} for event ${eventId}...`);

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE event_attendees SET attendance_status_id = ? WHERE user_id = ? AND event_id = ?';
    await conn.query(query, [status, userId, eventId]);
    conn.release();
}

exports.isAttending = async function(eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM event_attendees WHERE event_id = ? AND user_id = ?';
    const [result] = await conn.query(query, [eventId, userId]);
    conn.release();
    return (result.length === 1);
}

exports.statusRejected = async function(eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT attendance_status_id FROM event_attendees WHERE event_id = ? AND user_id = ?';
    const [result] = await conn.query(query, [eventId, userId]);
    const status = parseInt(result[0].attendance_status_id);
    conn.release();
    return (status === 3);
}

exports.userAttendsEvent = async function(eventId, userId) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM event_attendees WHERE event_id = ? AND user_id = ?'
    const [result] = await conn.query(query, [eventId, userId]);
    conn.release();
    return (result.length === 1);
}