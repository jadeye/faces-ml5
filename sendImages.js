const path = require('path');
const fs = require('fs');
const request = require('request');

//joining path of directory 
const directoryPath = path.join(__dirname, './public/photos');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        const imageStream     =  fs.createReadStream(path.join(directoryPath,file));
        const personName = file
        // Do whatever you want to do with the file
        const form = {"image" : imageStream , "userid":personName};
        request.post({url:"http://172.16.210.20:81/v1/vision/face/register", formData:form},function(err,res,body){
            response = JSON.parse(body)
            console.log(response)
         })
          
    });
});


