// Select the database to use.
use('sample_restaurants');

db.restaurants.find().limit(5)

db.restaurants.find({}, { 'restaurant_id': 1, 'name': 1, 'adress': 1, 'cuisine': 1 })

db.restaurants.find(
    {},
    { "_id": 0, "restaurant_id": 1, "name": 1, "address": 1, "cuisine": 1 }
).sort({ "cuisine": 1 })

db.restaurants.find({}, { "address": 0 })


db.restaurants.find({ "cuisine": "French" }).skip(5)

db.restaurants.find(
    { "borough": { "$ne": "Queens" } },
    { "_id": 0, "restaurant_id": 1, "borough": 1, "address": 1, "name": 1, "cuisine": 1 }
)
db.restaurants.find(
    { "cuisine": { "$in": ["French", "Italian", "German"] } },
    { "restaurant_id": 1, "name": 1, "cuisine": 1, "borough": 1 }
)


db.restaurants.find({}, { 'borough': { '$nin': ['Manhattan', "Brooklyn", "Queens"] } }, { 'restaurant_id': 1, 'name': 1, 'borough': 1, }).sort({ "borough": 1 })

db.restaurants.find({ "borough": "Brooklyn", "cuisine": "American" })

