

//include dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.connect("mongodb+srv://dja322:meepling123@atlascluster.bwvmpvh.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster/todoDB");

const app = express();

const itemSchema = new mongoose.Schema({
	name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("list", listSchema);

const item = mongoose.model("Item", itemSchema);

const item1 = new item({name: "This is a todo list"});
const item2 = new item({name: "Click + to add an item"});
const item3 = new item({name: "<-- click this button to remove item"});

const defaultItems = [item1, item2, item3];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"));


app.get("/", function(req, res){
    //initialize date variables
    let today = new Date();
    let day = "";

    //create options object
    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    //gets day in en-US format
    day = today.toLocaleDateString("en-US", options);

    //load item array with items
    item.find({}).then((data) => {
      res.render('lists', {listTitle: "Today", newListItems: data});
    });
    console.log("Base list gotten");
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    //finds custom list
    List.find({ name: customListName}).then((data) => {
        if (data.length > 0) {
          //if list exists load list
          console.log(data[0].name);
          res.render('lists', {listTitle: customListName, newListItems: data[0].items});
        }
        else {
          //if list does not exist, create list and load
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          console.log("Saved new list");
          res.redirect("/" + customListName);
        }
      });
});

//adds new item to list
app.post("/", function(req, res) {
    let itemName = req.body.newItem;
    const listName = req.body.list;

    //check if item name was entered
    if (!itemName)
    {
        console.log("Entry empty");
    }
    else
    {

      const newItem = new item({
        name: itemName
      });

      console.log(listName);

      //check if list is default list
      if (listName === 'Today') {
        newItem.save();
        res.redirect("/");
      } else {
        //finds new list and adds item to it
        List.findOne({name: listName}).then((data) => {
           data.items.push(newItem);
           data.save();
           res.redirect("/" + listName);

        });
      }

      console.log("Item saved to " + listName);
    }

});

app.post("/delete", function(req,res) {
  //gets item id
  var clickedItemId = String(req.body.checkbox);
  var listName = req.body.listName;

  if (listName === 'Today') {
    item.findOneAndDelete({_id: clickedItemId}).then((data) => {
      console.log("Successfully deleted")
    });
    res.redirect("/");
  } else {
    //finds new list and deletes item
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: clickedItemId}}})
      .then((data) => {
       res.redirect("/" + listName);
    });
  }

  //finds item in database and deletes it


});


//Says which port to listen to
app.listen(process.env.PORT, function(){
  console.log("Server started");
});
