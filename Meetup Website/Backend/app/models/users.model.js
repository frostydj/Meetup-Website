const db = require('../../config/db');

exports.create = async function(firstName, lastName, email, password) {
    console.log(`Request to insert user ${firstName} ${lastName} into the database...`);

    const conn = await db.getPool().getConnection();
    const query = 'INSERT INTO user (first_name, last_name, email, password) values (?, ?, ?, ?)';
    const [result] = await conn.query(query, [firstName, lastName, email, password]);
    conn.release();
    return result;
}

exports.login = async function(id) {
    console.log(`Request to login with user ${id}...`);

    const conn = await db.getPool().getConnection();
    const query = 'SELECT id AS userId, auth_token AS token FROM user WHERE id = ?';
    const [result] = await conn.query(query, id);
    conn.release();
    return result[0];
}

exports.logout = async function(id) {
    console.log('Request to logout...');

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE user SET auth_token = null WHERE id = ?';
    const result = await conn.query(query, id);
    conn.release();
    return result;
}

exports.getUser = async function(id, loggedInUserId) {
    console.log(`Request to get user ${id}...`);

    const conn = await db.getPool().getConnection();
    let query;
    if (id === loggedInUserId) {
        query = 'SELECT first_name AS firstName, last_name AS lastName, email FROM user where id = ?'
    } else {
        query = 'SELECT first_name AS firstName, last_name AS lastName FROM user where id = ?';
    }
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result[0];
}

exports.edit = async function(id, fieldsToUpdate) {
    console.log(`Request to update user ${id}'s details`);

    const conn = await db.getPool().getConnection();
    const query = 'UPDATE user SET ? where id = ?';
    const result = await conn.query(query, [fieldsToUpdate, id]);
    conn.release();
    return result;
}

exports.getUserByToken = async function(token) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM user WHERE auth_token = ?';
    const [result] = await conn.query(query, [token]);
    conn.release();
    return result[0];
}

exports.getUserByEmail = async function(email) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ?';
    const [result] = await conn.query(query, [email]);
    conn.release();
    return result;
}

exports.getPasswordHash = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT password FROM user WHERE id = ?';
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result;
}

exports.saveAuthToken = async function(id, token) {
    const conn = await db.getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?'
    await conn.query(query, [token, id]);
    conn.release();
}

exports.getToken = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = 'SELECT auth_token FROM user WHERE id = ?';
    const [result] = await conn.query(query, id);
    conn.release();
    return result[0];
}
