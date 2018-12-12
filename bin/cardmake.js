#! /usr/bin/env node
/**
 * 
 * TODO
 * Refactor actual page palacement and pdf rendering to some function
 * Support browser
 * Add documentation
 * Start working in a dev branch
 * Use commander to parse args
 * 
 */
var fs = require("fs")
var path = require('path')
var pdfkit = require("pdfkit")
var readChunk = require('read-chunk')
var imageType = require('image-type')
var program = require('commander')

program
    .description("A command line tool to create print and play poker card sheets.")
    .option("-d, --directory <path>",           "The path to a directory that contains all of the image files", ".")
    .option("-o, --output <filename>",          "The location of the resulting file", "cardmake.pdf")
    .option("-w, --width <inches>",             "The width of the cards on the sheet", 2.5)
    .option("-h, --height <inches>",            "The height of the cards on the sheet", 3.5)
    .option("-pw, --page-width <inches>",       "(UNIMPLEMENTED) The width of the page", 8.5)
    .option("-ph, --page-height <inches>",      "(UNIMPLEMENTED) The height of the page", 11)
    .option("-ml, --margin-left <inches>",      "(UNIMPLEMENTED) The size of the left margin of the sheet", 0.5)
    .option("-mr, --margin-right <inches>",     "(UNIMPLEMENTED) The size of the right margin of the sheet", 0.5)
    .option("-mt, --margin-top <inches>",       "(UNIMPLEMENTED) The size of the top margin of the sheet", 0.25)
    .option("-mb, --margin-bottom <inches>",    "(UNIMPLEMENTED) The size of the bottom margin of the sheet", 0.25)
    .parse(process.argv)

var srcDir = program.directory
var outPdf = program.output
var cardWidth = program.width
var cardHeight = program.height
var cardHeightPt = inchToPoints(cardHeight)
var cardWidthPt = inchToPoints(cardWidth)
var pageWidth = program.pageWidth
var pageHight = program.pageHeight

var cardPosX = getCardCoords(cardWidth, 8.5, 0.5, 0.5)
var cardPosY = getCardCoords(cardHeight, 11, 0.25, 0.25)

function getCardCoords(cardWidth, pageWidth, leftMargin, rightMargin){
    var usableWidth = pageWidth - (leftMargin + rightMargin)
    var numCardsRow = Math.floor(usableWidth/cardWidth)
    var cardPositions = []
    for(var i = 0; i < numCardsRow; i++){
        cardPositions.push(inchToPoints(leftMargin + (i*cardWidth)))
    }
    return cardPositions
}

function inchToPoints(inches){
    return inches * 72
}

function createCardPdf(srcDir, outPdf, cardWidth, cardHeight){
    var files = fs.readdirSync(srcDir)
    var doc = new pdfkit({autoFirstPage: false})
    var cardIndex = 0
    var validImageFiles = []
    var cardsPerPage = cardPosX.length * cardPosY.length
    doc.pipe(fs.createWriteStream(outPdf))    
    for(var i = files.length - 1; i >= 0; i--){
        files[i] = path.join(srcDir, files[i])
        try{
            if(fs.statSync(files[i]).isDirectory()){
                continue;
                
            }
        } catch (e){
            continue;
        }
        var buffer = readChunk.sync(files[i], 0, 12);
        var imageExt = imageType(buffer)
        imageExt = (imageExt) ? imageExt.ext : undefined
        if(imageExt == "png" || imageExt == "jpg"){
            validImageFiles.push(files[i])
        }
    }

    //iterate over each card a page (9 cards) at a time
    //then use two loops to place each card on the page
    for(var i=0; i<validImageFiles.length; i+=cardsPerPage){
        for(var posX=0; posX<cardPosX.length; posX++){
            for(var posY=0; posY<cardPosY.length; posY++){
                if((cardIndex % cardsPerPage) == 0){
                    doc.addPage()
                }
                if(cardIndex < validImageFiles.length){
                    doc.image(validImageFiles[cardIndex], cardPosX[posX], cardPosY[posY], { width: cardWidth, height: cardHeight })
                    cardIndex++
                }
                
            }
        }
    }
    doc.end()
}

//execute script
createCardPdf(srcDir, outPdf, cardWidthPt, cardHeightPt)