//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://vicdai:daimongo@cluster0.aihkvmv.mongodb.net/todolistDB");
//mongodb+srv://vicdai:<password>@cluster0.aihkvmv.mongodb.net/?retryWrites=true&w=majority/todolistDB
//schema

const itemsSchema = ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);


const welcome = new Item({
  name: "Welcome to your To Do list!"
});

const plus = new Item({
  name: "Click the + button to add a new item"
});

const check = new Item({
  name: "<-- Hit this to delete the item"
});

const defaultItems = [welcome, plus, check];

const listSchema = ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        }
        else {
          console.log("Successfully inserted default items");
        }
      });
      res.redirect("/"); //back to root route and then go to else block then render
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
  //const day = date.getDate();



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else { //find list
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Deleted item with id: " + checkedItemId);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }




});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
