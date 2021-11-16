const db = require('../../config/db');

exports.getImage = async function(id) {
    console.log('Request to get event image...');

    const conn = await db.getPool().getConnection();
    const query = 'SELECT image_filename FROM event WHERE id = ?';
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result[0];
}

exports.update = async function(id, imageName) {
    console.log('Request to update user image...');

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE event SET image_filename = ? WHERE id = ?';
    const result = await conn.query(query, [imageName, id]);
    conn.release();
    return result;
}

exports.eventImageWithIdExists = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = `SELECT * FROM event WHERE image_filename LIKE 'event_${id}.%'`
    const [result] = await conn.query(query);
    conn.release();
    return (result.length === 1);
}

exports.getImageFileName = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = `SELECT image_filename FROM event WHERE id = ?`;
    const [result] = await conn.query(query, [id]);
    conn.release();
    return (result[0]["image_filename"]);
}