const db = require('../../config/db');

exports.getImage = async function(id) {
    console.log(`Request to get image from user ${id}`);

    const conn = await db.getPool().getConnection();
    const query = 'SELECT image_filename FROM user WHERE id = ?';
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result[0];
}

exports.delete = async function(id) {
    console.log(`Request to remove image from user ${id}`);

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE user SET image_filename = null WHERE id = ?';
    await conn.query(query, [id]);
    conn.release();
}

exports.update = async function(id, imageName) {
    console.log('Request to update user image...');

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE user SET image_filename = ? WHERE id = ?';
    const result = await conn.query(query, [imageName, id]);
    conn.release();
    return result;
}

exports.userImageWithIdExists = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = `SELECT * FROM user WHERE image_filename LIKE 'user_${id}.%'`
    const [result] = await conn.query(query);
    conn.release();
    return (result.length === 1);
}