const userImage = require('../models/users.images.model');
const user = require('../models/users.model');
const fs = require('fs');
const FileType = require('file-type');
const imgDir = './storage/images/';

exports.getImage = async function(req, res) {
    console.log('\nRequest to get user image...');

    const id = req.params.id;

    try {
        let imageName = (await userImage.getImage(id));
        if (!imageName || imageName.image_filename === null) {
            res.status(404)
                .end();
        } else {
            imageName = imageName.image_filename;
            let imageType = imageName.split('.')[1];
            if (imageType === 'jpg') {
                imageType = 'jpeg';
            }
            res.setHeader('content-type', `image/${imageType}`);
            const image = fs.readFileSync(imgDir + imageName)
            res.status(200)
                .send(image);
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR getting user image: ${err}`);
    }
}

exports.delete = async function(req, res) {
    console.log('\nRequest to remove image');
    const token = req.headers["x-authorization"];
    const id = req.params.id;

    try {
        const loggedInUser = await user.getUserByToken(token);
        const userExists = typeof (await user.getUser(id)) !== "undefined";

        if (!loggedInUser) { //No token exists
            res.status(401)
                .end();
        } else if (!userExists) {
            res.status(404).end();
        } else if (loggedInUser["id"] !== parseInt(id)) {
            res.status(403)
                .end();
        } else if (loggedInUser["image_filename"] === null) {
            res.status(404)
                .end();
        } else {
            fs.unlinkSync(imgDir + loggedInUser["image_filename"]);
            await userImage.delete(id);
            res.status(200)
                .end();
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR removing user image: ${err}`);
    }
}

exports.update = async function(req, res) {
    console.log('\nRequest to update user image...');
    const id = req.params.id;
    const token = req.headers["x-authorization"];

    try {
        const loggedInUser = await user.getUserByToken(token);
        const userExists = typeof (await user.getUser(id)) !== "undefined";

        if (!loggedInUser) {
            res.status(401).end();
        } else if (!userExists) {
            res.status(404).end();
        } else if (loggedInUser["id"] !== parseInt(id)) {
            res.status(403).end();
        } else if (!["image/jpeg", "image/png", "image/gif"].includes(req.headers["content-type"])) {
            res.status(400).end();
        } else {
            const fileType = await FileType.fromBuffer(req.body);
            if (!fileType || fileType.mime !== req.headers["content-type"]) {
                res.status(400).end();
            } else {
                let imageName;
                const currentImageName = loggedInUser["image_filename"];
                if (currentImageName === null) {                                   // New image is created
                    imageName = `user_${await findUniqueUserImageId()}.${fileType.ext}`;
                    res.status(201).end();
                } else {                                                            // Image is being replaced
                    fs.unlinkSync(imgDir + currentImageName);
                    imageName = loggedInUser["image_filename"];
                    imageName = imageName.split('.')[0];
                    imageName = `${imageName}.${fileType.ext}`;
                    res.status(200).end();
                }

                fs.writeFileSync(imgDir + imageName, req.body);
                await userImage.update(id, imageName);
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR adding user image: ${err}`);
    }
}

findUniqueUserImageId = async function() {
    let currentId = 1;
    let idIsFree = false;

    while (!idIsFree) {
        if (!(await userImage.userImageWithIdExists(currentId))) {
            idIsFree = true;
        } else {
            currentId++;
        }
    }

    return currentId;
}