const eventImage = require('../models/events.images.model');
const user = require('../models/users.model');
const event = require('../models/events.model');
const fs = require('fs');
const FileType = require('file-type');
const imgDir = './storage/images/';

exports.getImage = async function(req, res) {
    console.log('\nRequest to get event image...');

    const eventId = req.params.id;

    try {
        let imageName = (await eventImage.getImage(eventId));
        if (!imageName || imageName["image_filename"] === null) {
            res.status(404)
                .end();
        } else {
            imageName = imageName["image_filename"];
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

exports.update = async function(req, res) {
    console.log('\nRequest to update user image...');
    const eventId = req.params.id;
    const token = req.headers["x-authorization"];

    try {
        const loggedInUser = await user.getUserByToken(token);
        const eventExists = typeof (await event.getOne(eventId)) !== "undefined";
        const selectedEvent = await event.getOne(eventId);

        if (!loggedInUser) {
            res.status(401).end();
        } else if (!eventExists) {
            res.status(404).end();
        } else if (loggedInUser["id"] !== selectedEvent["organizerId"]) {
            res.status(403).end();
        } else if (!["image/jpeg", "image/png", "image/gif"].includes(req.headers["content-type"])) {
            res.status(400).end();
        } else {
            const currentImageName = await eventImage.getImageFileName(eventId);
            const fileType = await FileType.fromBuffer(req.body);
            if (!fileType || fileType.mime !== req.headers["content-type"]) {
                res.status(400).end();
            } else {
                let imageName;
                if (currentImageName === null) {                                   // New image is created
                    imageName = `event_${await findUniqueEventImageId()}.${fileType.ext}`;
                    res.status(201).end();
                } else {                                                            // Image is being replaced
                    fs.unlinkSync(imgDir + currentImageName);
                    imageName = currentImageName;
                    imageName = imageName.split('.')[0];
                    imageName = `${imageName}.${fileType.ext}`;
                }

                fs.writeFileSync(`./storage/images/${imageName}`, req.body);
                await eventImage.update(eventId, imageName);
                res.status(200).end();
            }
        }
    } catch (err) {
        res.status(500)
            .send(`ERROR adding user image: ${err}`);
    }
}

findUniqueEventImageId = async function() {
    let currentId = 1;
    let idIsFree = false;

    while (!idIsFree) {
        if (!(await eventImage.eventImageWithIdExists(currentId))) {
            idIsFree = true;
        } else {
            currentId++;
        }
    }

    return currentId;
}