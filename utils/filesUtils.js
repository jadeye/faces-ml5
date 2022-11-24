const fs = require('fs');
const path = require('path');

function appendDataToJson(metadata){
    fs.readFile(path.join(__dirname , '../myjsonfile.json'), 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
        obj = JSON.parse(data); //now it an object
        obj['people'].push(metadata); //add some data
        json = JSON.stringify(obj); //convert it back to json
        fs.writeFile('myjsonfile.json', json, 'utf8' ,(err)=>{
            if(err) console.error(err);
            console.log("update file");
        }); // write it back 
    }});
}

module.exports = {appendDataToJson}