const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.t241ufd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("Radiant-Glow").collection("services");
    const bookingCollection = client.db("Radiant-Glow").collection("booking");

    //auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
     
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

//verifyToken
    const verifyToken = (req, res , next) =>{
      const token = req.cookies.token;
      if (!token ) {
        return res.status(401).send("unauthorized access")
      }
      console.log(token);
      if (token) {
        jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
            if (err) {
              return res.status(401).send("unauthorized access")
            }
            console.log(decoded);
            req.user = decoded;
            next()
        })
      }
      
    }

        // Clear token on logout
        app.get('/logout', (req, res) => {
          res
            .clearCookie('token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
              maxAge: 0,
            })
            .send({ success: true })
        })

    app.post("/services", async (req, res) => {
      const service = req.body;
      console.log(service);
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.post("/booking", async (req, res) => {
      const service = req.body;
      console.log(service);
      const result = await bookingCollection.insertOne(service);
      res.send(result);
    });

    // Get all jobs data from db
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
      console.log(result);
    });

    // Get all jobs data from db
    app.get("/trendServices", async (req, res) => {
      const result = await serviceCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    // get all jobs posted by a specific user
    app.get("/myService", verifyToken ,async (req, res) => {
      const email = req.params.email;
      console.log('token' , req.cookies.token);
      let query = {};
      if (req?.query?.email) {
        query = { "serviceProvider.serviceProvideremail": req.query.email };
      }
      console.log(query);
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    //   await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("doctor is running");
});

app.listen(port, () => {
  console.log(`radiant glow is running on port ${port}`);
});
