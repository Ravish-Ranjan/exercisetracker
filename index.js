const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const { MongoOIDCError } = require('mongodb');
const { Schema } = mongoose;

mongoose.connect(process.env.DATA);

const UserSchema = new Schema({
  username:String,
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id:{type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise",ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async(req,res)=>{
  const users =await User.find({}).select("_id username");
  if(!users){
    res.send("No users");
  }else{
    res.json(users);
  }
})


app.post('/api/users', async(req, res)=>{
  try{
  const Objuser = new User({
    username:req.body.username
  })


    const user = await Objuser.save()
    res.json(user)
  }catch(err){
    res.status(400).json({ error: "Error creating user" });
  }
})

app.post("/api/users/:_id/exercises", async(req,res)=>{
  const id = req.params._id
  const { description, duration, date }=req.body

  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user")
    }else{
      const Objexercise = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) :  new Date()
      })
      const exercise =await Objexercise.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }

  }catch(err){
    res.status(400).send("Error with exercise");
  }

})

app.get("/api/users/:_id/logs",async(req,res)=>{
    const{ from , to , limit } = req.query;
    const id = req.params._id;
    const user = await User.findById(id);
    if(!user){
      res.send("Could not find user")
      return;
    }
    let Objdate = {}
    if(from){
      Objdate["$gte"]= new Date(from)
    }
    if(to){
      Objdate["$lte"] = new Date(to)
    }
    let filter = {
      user_id: id
    }
    if(from || to){
      filter.date = Objdate;
    }


    const exercises =  await Exercise.find(filter).limit(+limit ?? 500)

    const log = exercises.map(e=>({
      description: e.description,
      duration: e.duration,
      date : e.date.toDateString()
    }))


    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
})
