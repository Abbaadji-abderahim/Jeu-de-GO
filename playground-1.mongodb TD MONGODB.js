/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Select the database to use.
use('mongodbVSCodePlaygroundDB');

// Insert a few documents into the sales collection.
db.getCollection('sales').insertMany([
  { 'item': 'abc', 'price': 10, 'quantity': 2, 'date': new Date('2014-03-01T08:00:00Z') },
  { 'item': 'jkl', 'price': 20, 'quantity': 1, 'date': new Date('2014-03-01T09:00:00Z') },
  { 'item': 'xyz', 'price': 5, 'quantity': 10, 'date': new Date('2014-03-15T09:00:00Z') },
  { 'item': 'xyz', 'price': 5, 'quantity': 20, 'date': new Date('2014-04-04T11:21:39.736Z') },
  { 'item': 'abc', 'price': 10, 'quantity': 10, 'date': new Date('2014-04-04T21:23:13.331Z') },
  { 'item': 'def', 'price': 7.5, 'quantity': 5, 'date': new Date('2015-06-04T05:08:13Z') },
  { 'item': 'def', 'price': 7.5, 'quantity': 10, 'date': new Date('2015-09-10T08:43:00Z') },
  { 'item': 'abc', 'price': 10, 'quantity': 5, 'date': new Date('2016-02-06T20:20:13Z') },
]);

// Run a find command to view items sold on April 4th, 2014.
const salesOnApril4th = db.getCollection('sales').find({
  date: { $gte: new Date('2014-04-04'), $lt: new Date('2014-04-05') }
}).count();

// Print a message to the output window.
console.log(`${salesOnApril4th} sales occurred in 2014.`);

// Here we run an aggregation and open a cursor to the results.
// Use '.toArray()' to exhaust the cursor to return the whole result set.
// You can use '.hasNext()/.next()' to iterate through the cursor page by page.
db.getCollection('sales').aggregate([
  // Find all of the sales that occurred in 2014.
  { $match: { date: { $gte: new Date('2014-01-01'), $lt: new Date('2015-01-01') } } },
  // Group the total sales for each product.
  { $group: { _id: '$item', totalSaleAmount: { $sum: { $multiply: [ '$price', '$quantity' ] } } } }
]);



use('sample_mflix');
// TD 3aggregate //
//3.1//
    db.movies.aggregate([
  {
    $project: {
      title: 1,
      age: { $subtract: [{ $year: new Date() }, "$year"] }
    }
  }
])

//3.2//
db.movies.aggregate([
  { $match: { year: { $gt: 2010 }, languages: { $size: 3 } } },
  { $project: { title: 1, languages: 1 } },
  { $sort: { title: 1 } },
  { $limit: 10 }
])


//3.3//


db.movies.aggregate([
  {
    $match: {
      "imdb.rating": { $gt: 7 },
      genres: { $nin: ["Crime", "Horror"] },
      languages: { $all: ["English", "Japanese"] }
    }
  },
  { $project: { title: 1, "imdb.rating": 1, languages: 1 } }
])


//3.4//

db.movies.aggregate([
  {
    $project: {
      film_info: { $concat: ["$title", "-", { $toString: "$year" }] }
    }
  }
])

// 3.5//

db.movies.aggregate([
  { $match: { year: { $gte: 2000, $lte: 2010 } } },
  { $group: { _id: "$year", nb_films: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])


//3.6//
db.movies.aggregate([
  { $match: { languages: "French" } },
  {
    $group: {
      _id: { year: "$year", type: "$type" },
      avgRuntime: { $avg: "$runtime" }
    }
  },
  { $skip: 10 }
])


//3.7//

db.movies.aggregate([
  { $match: { title: { $regex: /Spy/i } } },
  { $count: "nb_films_spy" }
])


//3.8//

db.movies.aggregate([
  { $match: { "awards.wins": { $gte: 1 } } },
  {
    $group: {
      _id: null,
      minRating: { $min: "$imdb.rating" },
      avgRating: { $avg: "$imdb.rating" }
    }
  }
])



//3.9//

db.movies.aggregate([
  { $match: { languages: "French" } },
  { $unwind: "$cast" },
  {
    $group: {
      _id: "$cast",
      nbFilms: { $sum: 1 },
      avgRating: { $avg: "$imdb.rating" }
    }
  },
  { $sort: { nbFilms: -1 } }
])

//3.10//
db.movies.aggregate([
  {
    $match: {
      $or: [{ "awards.wins": { $gte: 1 } }, { "awards.nominations": { $gte: 2 } }],
      "imdb.rating": { $gt: 8 }
    }
  },
  { $unwind: "$genres" },
  { $group: { _id: "$genres", count: { $sum: 1 } } }
])



//3.11//

db.movies.aggregate([
  { $limit: 20 },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "movie_comments"
    }
  },
  { $unwind: "$movie_comments" },
  { $project: { title: 1, "movie_comments.text": 1 } },
  { $sort: { title: 1 } }
])

//3.12//

db.movies.aggregate([
  { $match: { year: 2010 } },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "details"
    }
  },
  { $unwind: "$details" },
  {
    $project: {
      _id: 0,
      title: 1,
      commenter: "$details.name"
    }
  },
  { $sort: { title: 1 } }
])


//3.13//
db.movies.aggregate([
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "coms"
    }
  },
  {
    $project: {
      title: 1,
      nbComments: { $size: "$coms" }
    }
  },
  { $sort: { nbComments: -1 } }
])


//3.14//

db.movies.aggregate([
  { $match: { year: { $gte: 1990, $lte: 2000 } } },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "coms"
    }
  },
  {
    $group: {
      _id: "$year",
      nbFilms: { $sum: 1 },
      totalComments: { $sum: { $size: "$coms" } }
    }
  },
  { $sort: { _id: 1 } }
])


//3.15//



