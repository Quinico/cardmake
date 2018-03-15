#! /usr/bin/env node
/**
 * 
 * TODO
 * 
 * Parse args for multiple input dirs
 * Refactor actuall page palacement and pdf rendering to some function
 * Support browser
 * Add documentation
 * Start working in a dev branch
 * 
 */
var fs = require("fs")
var pdfkit = require("pdfkit")

var srcDir = process.argv[2] || "."//first arg
var outPdf = process.argv[3] || ("out.pdf")

var cardPosX = [
    inchToPoints(.5),
    inchToPoints(3),
    inchToPoints(5.5)
]

var cardPosY = [
    inchToPoints(.25),
    inchToPoints(3.75),
    inchToPoints(7.25)
]

function inchToPoints(inches){
    return inches * 72
}

function createCardPdf(srcDir, outPdf){
    var files = fs.readdirSync(srcDir)
    var doc = new pdfkit({autoFirstPage: false})
    var cardIndex = 0
    var validImageFiles = []
    var cardWidth = inchToPoints(2.5)
    var cardHeight = inchToPoints(3.5)

    doc.pipe(fs.createWriteStream(outPdf))    
    for(var i = files.length - 1; i >= 0; i--){
        if(files[i].endsWith(".png") || files[i].endsWith(".jpeg") || files[i].endsWith(".jpg")){
            validImageFiles.push(files[i])
        }
    }

    //iterate over each card a page (9 cards) at a time
    //then use two loops to place each card on the page
    for(var i=0; i<validImageFiles.length; i+=9){
        for(var posX=0; posX<3; posX++){
            for(var posY=0; posY<3; posY++){
                if((cardIndex % 9) == 0){
                    doc.addPage()
                }
                if(cardIndex < validImageFiles.length){
                    doc.image(validImageFiles[cardIndex], cardPosX[posX], cardPosY[posY], { width: cardWidth, height: cardHeight })
                    cardIndex++
                }else{
                    return;
                }
                
            }
        }
    }
    doc.end()
}

//execute script
createCardPdf(srcDir, outPdf)