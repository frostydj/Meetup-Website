const user = require('../models/users.model');
const passwordHash = require('password-hash');
const crypto = require('crypto');

exports.create = async function(req, res) {
    console.log('\nRequest to register a new user');

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    let password = req.body.password;

    try {
        const existingUsers = await user.getUserByEmail(email);
        const emailRegex = new RegExp("[^@]+@[^@]+");
        if (!(firstName.length >= 1 && lastName.length >= 1 && password.length >= 1 && emailRegex.test(email) && existingUsers.length === 0)) {
            res.status(400).send();
        } else {
            password = passwordHash.generate(password);
            const result = await user.create(firstName, lastName, email, password);
            res.status(201)
                .json({userId: result.insertId});
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR inserting user ${firstName} ${lastName}: ${err}`);
    }
}

exports.login = async function(req, res) {
    console.log('\nRequest to login');

    const email = req.body.email;
    const password = req.body.password;

    try {
        if (email === undefined) {
            res.statusMessage = "data should have required property 'email'";
            res.status(400).end()
        } else if (password === undefined) {
            res.statusMessage = "data should have required property 'password'";
            res.status(400).end()
        } else {
            const [loginUser] = await user.getUserByEmail(email);
            if (loginUser !== undefined && passwordHash.verify(password, loginUser.password)) {
                const authToken = crypto.randomBytes(16);
                await user.saveAuthToken(loginUser.id, authToken.toString('hex'));
                const result = await user.login(loginUser.id);

                req.headers["x-authorization"] = authToken;
                res.status(200)
                    .json(result);
            } else {
                res.statusMessage = "invalid email/password supplied";
                res.status(400).end();
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR logging in with email ${email}: ${err}`);
    }
}

exports.logout = async function(req, res) {
    console.log('\nRequest  to logout...');

    try {
        const token = req.headers["x-authorization"];
        const currentUser = await user.getUserByToken(token)

        if (!currentUser) { // No user matching token
            res.status(401).end();
        } else {
            await user.logout(currentUser.id);
            res.status(200).end();
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR logging out: ${err}`);
    }
}

exports.getUser = async function(req, res) {
    console.log('\nRequest to get user by ID');

    const id = parseInt(req.params.id);
    const token = req.headers["x-authorization"];

    try {
        const currentUser = await user.getUserByToken(token);
        let loggedInId = null;

        if (currentUser) {
            loggedInId = currentUser["id"];
        }

        const userDetails = await user.getUser(id, loggedInId);

        if (!userDetails) {
            res.status(404)
                .end()
        } else {
            res.status(200)
                .json(userDetails);
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR getting user ${id}: ${err}`);
    }
}

exports.edit = async function (req, res) {
    console.log('\nRequest to patch user...');

    const id = parseInt(req.params.id);
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const currentPassword = req.body.currentPassword;
    const token = req.headers["x-authorization"];

    const emailRegex = new RegExp("[^@]+@[^@]+");
    let fNameValid = false;
    let lNameValid = false;
    let emailValid = false;
    let passwordValid = false;

    let fieldsToUpdate = {};

    try {
        const userExists = typeof (await user.getUser(id)) !== "undefined";
        const loggedInUser = await user.getUserByToken(token);

        if (!loggedInUser) {
            res.status(401).end();
        } else if (!userExists) {
            res.status(404).end();
        } else if (id !== loggedInUser["id"]) {
            res.status(403).end();
        } else {

            if (firstName !== undefined) {
                if (firstName.length >= 1) {
                    fieldsToUpdate["first_name"] = firstName;
                } else {
                    res.statusMessage = "data.firstName should NOT be shorter than 1 character";
                    res.status(400).end();
                    return;
                }
            }

            if (lastName !== undefined) {
                if (lastName.length >= 1) {
                    fieldsToUpdate["last_name"] = lastName;
                } else {
                    res.statusMessage = "data.lastName should NOT be shorter than 1 character";
                    res.status(400).end();
                    return;
                }
            }

            if (email !== undefined) {
                const existingUsers = await user.getUserByEmail(email);
                if (emailRegex.test(email) && (await user.getUserByEmail(email)).length === 0) {
                    fieldsToUpdate["email"] = email;
                } else {
                    res.status(400).end();
                    return;
                }
            }

            if (password !== undefined) {
                console.log("here");
                if (password.length >= 1) {
                    if (currentPassword !== undefined) {
                        const [savedPassword] = await user.getPasswordHash(id);
                        if (passwordHash.verify(currentPassword, savedPassword.password)) {

                            fieldsToUpdate["password"] = passwordHash.generate(password);
                        } else {
                            res.statusMessage = "incorrect password";
                            res.status(400).end();
                            return;
                        }
                    } else {
                        res.status(400).end();
                        return;
                    }
                } else {
                    res.statusMessage = "data.password should should NOT be shorter than 1 characters";
                    res.status(400).end();
                    return;
                }
            }

            await user.edit(id, fieldsToUpdate);
            res.status(200).end();
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR updating user details: ${err}`);
    }
}