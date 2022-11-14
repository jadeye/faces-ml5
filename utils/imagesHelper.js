//requiring path and fs modules
const path = require('path');
const fs = require('fs');


function getImagesNames() {
    const directoryPath = path.join(__dirname, '../images');
    const images = fs.readdirSync(directoryPath);

    return images.map((imageFIle) => (`${imageFIle}`));
}

module.exports = { getImagesNames }