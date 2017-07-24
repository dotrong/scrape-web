// Requiring our Note and Article models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

module.exports = function(app) {

    app.get("/", function(req, res) {

        Article.find({},function(error,doc) {
            if (error) {
                res.send(error);
            }
            else {
                //res.send(doc);
                var hbsObject = {
                    results: doc
                };
                console.log(hbsObject);
                res.render("index", hbsObject);
            }
        })
    
    });  

    // A GET request to scrape dealnews.com
    app.get("/scrape", function(req, res) {
        // First, we grab the body of the html with request
        request("https://dealnews.com/", function(error, response, html) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(html);
            // Now, we grab every h2 within an article tag, and do the following:
            $("div.content-specs").each(function(i, element) {

                // Save an empty result object
                var result = {};

                result.title = $(this).find("a.content-wide-heading").text();

                result.link = $(this).find("a.content-wide-heading").attr("href");

                Article.findOne({"link":result.link},function(error,doc) {

                    //verify if deal doesn't exist in db

                    if (!doc) {
                        // create a new entry
                        var entry = new Article(result);

                        // Now, save that entry to the db
                        entry.save(function(err, doc) {
                            // Log any errors
                            if (err) {
                                console.log(err);
                            }
                            // Or log the doc
                            else {
                                console.log(doc);
                            }
                        
                        });

                    }
                })

            });
        
        });

        // Tell the browser that we finished scraping the text
         res.send("Scrape Completed! Please go to homepage");
        
    });

    // This will get the articles we scraped from the mongoDB show in json format
    app.get("/articles", function(req, res) {

        Article.find({},function(error,doc) {
            if (error) {
                res.send(error);
            }
            else {
                res.send(doc);

            }
        })

    });

    // This will grab an article by it's ObjectId
    app.get("/articles/:id", function(req, res) {

    Article.findOne({"_id":req.params.id})
        .populate("note")
        .exec(function(error,doc) {
        if (error) {
            res.send(error);
        }
        else {
            res.send(doc);
        }
        });

    });

    // Create a new note or replace an existing note
    app.post("/articles/:id", function(req, res) {

        // Create a new note and pass the req.body to the entry
        var newNote = new Note(req.body);

        // And save the new note the db
        newNote.save(function(error, doc) {
            // Log any errors
            if (error) {
            console.log(error);
            }
            // Otherwise
            else {
                // Use the article id to find and update it's note
                Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                    console.log(err);
                    }
                    else {
                    // Or send the document to the browser
                    res.send(doc);
                    }
                });
            }
        });

    });

}