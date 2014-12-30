var express = require('express')
var mongoose = require('mongoose')
var router = express.Router()

var QUERIES = [
  "code", "name", "department", "division", "campus", "term", "section",
  "term", "postrequisite", "tutorials", "breadths", "time", "instructors",
  "location", "size", "rating"
]

var KEYMAP = {
  "code": "code",
  "name": "name",
  "description": "description",
  "division": "division",
  "department": "department",
  "prerequisites": "prerequisites",
  "exclusions": "exclusions",
  "course_level": "course_level",
  "breadths": "breadth",
  "campus": "campus",
  "term": "term",
  "apsc_elec": "apsc_elec",
  "meeting_code": "meeting_sections.code",
  "instructors": "meeting_sections.instructors",
  "day": "meeting_sections.times.day",
  "start": "meeting_sections.times.start",
  "end": "meeting_sections.times.end",
  "location": "meeting_sections.times.location",
}

var timesSchema = new mongoose.Schema({
  day: String,
  start: String,
  end: String,
  location: String
})

var meetingSchema = new mongoose.Schema({
  code: String,
  instructors: [String],
  times: [timesSchema]
})

var courseSchema = new mongoose.Schema({
  course_id: String,
  code: String,
  name: String,
  description: String,
  division: String,
  prerequisites: String,
  exlusions: String,
  course_level: String,
  breadth: [Number],
  campus: String,
  term: String,
  apsc_elec: String,
  meeting_sections: [meetingSchema]
})

var courses = mongoose.model("courses", courseSchema)

router.get('/:id', function(req, res) {
  if (req.params.id != undefined && req.params.id != "") {
    var search = {}
    search['course_id'] = req.params.id;
    courses.find(search, function(err, docs) {
      res.json(docs)
    })
  } else {
    res.send(403)
  }
})

router.get('/', function(req, res) {

  var search = { $and: [] }

  var query = req.query
  var clean = true

  var queries = 0

  console.log(query)

  for (var key in query) {

    key = key.toLowerCase()

    if (QUERIES.indexOf(key) > -1 && query[key].length > 0) {

      var good = true

      //Still gotta do that sanitizing here probably

      if (good) {
        queries++

        var operators = []
        if (key == "breadths") {
          operators = parseQuery(key, query[key], true, false)
        } else if (key == "instructors") {
          operators = parseQuery(key, query[key], false, true)
        } else {
          operators = parseQuery(key, query[key], false, false)
        }

        search.$and = search.$and.concat(operators)
      } else {
        res.status(403).end()
        return
      }

    } else {
      res.status(403).end()
      return
    }

  }

  if (queries > 0) {
    console.log(JSON.stringify(search))
    courses.find(search, function(err, docs) {
      res.json(docs)
    })
  } else {
    res.status(403).end()
    return
  }

})

var parseQuery = function(key, query, isIntegerArray, isStringArray) {

  parts = query.split(",")
  for(var x = 0; x < parts.length; x++) {
    
    parts[x] = { $or: parts[x].split("/") }
    for (var y = 0; y < parts[x].$or.length; y++) {

      var or = {}
      if (isIntegerArray) {
        or[KEYMAP[key]] = parseInt(parts[x].$or[y])
      } else if (isStringArray) {
        or[KEYMAP[key]] = {
          $elemMatch: { $regex: "(?i).*" + parts[x].$or[y] + ".*" }
        }
      } else {
        or[KEYMAP[key]] = {
          $regex: "(?i).*" + parts[x].$or[y] + ".*"
        }
      }

      parts[x].$or[y] = or

    }
  }

  return parts
}

module.exports = router
