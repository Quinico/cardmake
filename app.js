#! /usr/bin/env node

var fs = require("fs");
var gm = require('gm');
var PDFDocument = require("pdfkit");

var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
}

var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


var srcDir = process.argv[2] || "./"; //first arg
var destDir = srcDir + "/tmp"; //2nd arg
var outFile = process.argv[3] || (srcDir + "/out.pdf"); //3rd arg

mkdirSync(destDir);

var srcList = fs.readdirSync(srcDir);
var cropped = 0;

var cropWidth = 671;
var croppedHeight = 971;
var cropX = 78;
var cropY = 76;

for (var i = 0; i < srcList.length; i++) {
    var fileName = srcList[i];

    gm(srcDir + "/" + fileName)
    //.crop(cropWidth, croppedHeight, cropX, cropY)
    .write(destDir + "/" + fileName, function (err) {
        if (!err) {
            cropped++;
        } else {
            cropped++;
        }

        if (cropped == srcList.length) {
            createPdf();
        }

    });
}

function inchToPddPoint(inch){
    return inch * 72;
}

var cardHeight = inchToPddPoint(3.5);
var cardWidth = inchToPddPoint(2.5);
var topMargin = inchToPddPoint((11-(3.5*3))/2);
var leftMargin = inchToPddPoint((8.5 - (2.5 * 3)) / 2);

var cardStarts = [
    {
        x: leftMargin, 
        y: topMargin
    },
    {
        x: leftMargin + cardWidth, 
        y: topMargin
    },
    {
        x: leftMargin + cardWidth + cardWidth, 
        y: topMargin
    },
    {
        x: leftMargin, 
        y: topMargin + cardHeight
    },
    {
        x: leftMargin + cardWidth, 
        y: topMargin + cardHeight
    },
    {
        x: leftMargin + cardWidth + cardWidth, 
        y: topMargin + cardHeight
    },
    {
        x: leftMargin, 
        y: topMargin + cardHeight + cardHeight
    },
    {
        x: leftMargin + cardWidth, 
        y: topMargin + cardHeight + cardHeight
    },
    {
        x: leftMargin + cardWidth + cardWidth, 
        y: topMargin + cardHeight + cardHeight
    },
];


var addCardBoundaries = function (doc) {
    doc.lineWidth(3);

    doc.moveTo(cardStarts[1].x, cardStarts[2].y);
    doc.lineTo(cardStarts[1].x, cardStarts[7].y + cardHeight).dash(5, { space: 10 }).stroke();

    doc.moveTo(cardStarts[2].x, cardStarts[2].y);
    doc.lineTo(cardStarts[2].x, cardStarts[7].y + cardHeight).dash(5, { space: 10 }).stroke();

    doc.moveTo(cardStarts[3].x, cardStarts[3].y);
    doc.lineTo(cardStarts[5].x + cardWidth, cardStarts[5].y).dash(5, { space: 10 }).stroke();

    doc.moveTo(cardStarts[6].x, cardStarts[6].y);
    doc.lineTo(cardStarts[8].x + cardWidth, cardStarts[8].y).dash(8, { space: 8 }).stroke();
}


function createPdf(){
    var croppedImages = fs.readdirSync(destDir);
    var doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outFile));
    
    addCardBoundaries(doc);
    var isFirstPage = true;
    //we gona do shit
    var cardsAdded = 0;
    for (var i = 0; i < croppedImages.length; i++) {
        
        if (croppedImages[i] == "out.pdf") {
            continue;
        }

        if (cardsAdded == 9) {
            cardsAdded = 0;
            isFirstPage = false;
        }
        if (cardsAdded == 0 && !isFirstPage) {
            addCardBoundaries(doc);
            doc.addPage();
            addCardBoundaries(doc);
        }
        
        //add the card
        try {
            doc.image(destDir + "/" + croppedImages[i], cardStarts[cardsAdded].x, cardStarts[cardsAdded].y, { width: cardWidth, height: cardHeight });
            cardsAdded++;

        } catch (e) {
        };
        

    }
    

    addCardBoundaries(doc);
    doc.end();
    deleteFolderRecursive(destDir);
}