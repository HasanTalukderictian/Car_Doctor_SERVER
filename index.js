const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// middleware 
app.use(cors());
app.use(express.json());


console.log(process.env.DB_PASS)
console.log(process.env.DB_USER)


const uri = `mongodb+srv://car-doctor-server:4mkmCbG5JnzKbVjj@cluster0.vtmwivk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req, res, next) =>{
     console.log('hitting verify JWT');
     console.log(req.headers.authorization)
     const authorization = req.headers.authorization;
     if(!authorization){
        return res.status(401).send({error:true, message: 'unauthorized access'})
     }
     const  token = authorization.split(' ')[1];
     console.log('token inside Verify JWT', token)
     jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) =>{
        if(error){
            return res.status(403).send({error:true, message: 'unauthorized access'})
         }
         req.decoded = decoded;
         next()

     })
    
    
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

      const serviceCollection = client.db('carDoctors').collection('services');
      const bookinCollection = client.db('carDoctors').collection('bookings');
        


      //jwt routes 

      app.post('/jwt',(req, res) =>{
        const user = req.body;
        console.log(user)
        const token = jwt.sign(user,process.env.ACCESS_TOKEN, { expiresIn: '1h' });
        console.log(token);
        res.send({token});
      })

      // server Routes
      app.get('/services',async(req,res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      })

      app.get('/services/:id',async(req, res)=>{
        const id = req.params.id;


        const options = {
         

            // Include only the `title` and `imdb` fields in the returned document
            projection: {  title: 1, price: 1, service_id: 1,img: 1 },
          };


        const query = {_id : new ObjectId(id)}
        const result = await serviceCollection.findOne(query,options);
        res.send(result);
      })

      

      //bookings 
      app.get('/bookings',  verifyJWT, async(req, res) =>{
        const decoded = req.decoded;
        
        if(decoded.email !== req.query.email){
          return res.status(403).send({error: 1, message: 'Forbidden Access'})
        }
        console.log('came back after Verify', decoded);
        let query ={}
        if(req.query?.email){
            query={email: req.query.email}
        }
        const result = await bookinCollection.find(query).toArray();
        res.send(result);
      })
      
      app.patch('/bookings/:id', async(req, res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const updatedBooking = req.body;
        console.log(updatedBooking);
        const updateDoc = {
            $set: {
              status: updatedBooking.status 
            },
          };
      const result = await bookinCollection.updateOne(filter,updateDoc);
      res.send(result);
      })
  

      app.post('/bookings', async(req, res) =>{
        const booking  = req.body;
        console.log(booking);
        const result = await bookinCollection.insertOne(booking)
        res.send(result);

      });

      app.delete('/bookings/:id', async(req, res)=>{
        const id  = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await bookinCollection.deleteOne(query);
        res.send(result);
      })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req,res) =>
res.send("Cart Doctor Server is Running"));
//car-doctor-server//4mkmCbG5JnzKbVjj


app.listen(port,()=>{
    console.log(`Car Doctor Server is running on Port: ${port}`);
})