//requiring path and fs modules
const path = require('path');
const fs = require('fs');


function getImagesNames() {
    const directoryPath = path.join(__dirname, '../public/photos');
    const images = fs.readdirSync(directoryPath);

    return images.map((imageFIle) => (`${imageFIle}`));
}

module.exports = { getImagesNames }