
require("dotenv").config();

const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("pa2");

// Collections
const users = db.collection("users");
const projects = db.collection("projects");
const projectMemberships = db.collection("projectMemberships");

// TEST SERVER
app.get("/", (req, res) => {
  res.json({
    message: "Server is running"
  });
});

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    await users.insertOne({
      f_name,
      l_name,
      username,
      password
    });

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const user = await users.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "Username does not exist"
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Incorrect password"
      });
    }

    res.status(200).json({
      message: "Login successful"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// CREATE PROJECT
app.post("/projects", async (req, res) => {
  try {
    const { name, description, status, project_lead_id } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" || !name.trim() ||
      typeof description !== "string" || !description.trim() ||
      !status || !project_lead_id
    ) {
      return res.status(400).json({
        message: "All project fields are required"
      });
    }

    // Validate status
    if (!["Planning", "Active", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid project status"
      });
    }

    // Validate Project Lead ID
    if (
      typeof project_lead_id !== "string" ||
      !ObjectId.isValid(project_lead_id)
    ) {
      return res.status(400).json({
        message: "Invalid Project Lead ID"
      });
    }

    const leadId = new ObjectId(project_lead_id);

    // Check if Project Lead exists
    const lead = await users.findOne({
      _id: leadId
    });

    if (!lead) {
      return res.status(404).json({
        message: "Project Lead does not exist"
      });
    }

    // Store project in MongoDB
    const result = await projects.insertOne({
      name: name.trim(),
      description: description.trim(),
      status,
      project_lead_id: leadId
    });

    // Automatically add Project Lead as a member
    try {
      await projectMemberships.insertOne({
        project_id: result.insertedId,
        user_id: leadId
      });
    } catch (membershipError) {
      // Roll back the project if membership creation fails
      try {
        await projects.deleteOne({
          _id: result.insertedId
        });
      } catch (rollbackError) {
        console.error("Project rollback failed:", rollbackError);
      }

      throw membershipError;
    }

    res.status(201).json({
      message: "Project created successfully",
      project_id: result.insertedId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// GET ALL PROJECTS
app.get("/projects", async (req, res) => {
  try {
    const allProjects = await projects.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "project_lead_id",
          foreignField: "_id",
          as: "projectLead"
        }
      },
      {
        $unwind: {
          path: "$projectLead",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          status: 1,
          project_lead_id: 1,
          lead_name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$projectLead.f_name", ""] },
                  " ",
                  { $ifNull: ["$projectLead.l_name", ""] }
                ]
              }
            }
          },
          lead_username: "$projectLead.username"
        }
      }
    ]).toArray();

    res.status(200).json(allProjects);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error retrieving projects"
    });
  }
});

// GET ALL REGISTERED USERS
app.get("/users", async (req, res) => {
  try {
    const allUsers = await users.find(
      {},
      {
        projection: {
          password: 0
        }
      }
    ).toArray();

    res.status(200).json(allUsers);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error retrieving users"
    });
  }
});


 // GET MEMBERS OF A PROJECT
app.get("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID"
      });
    }

    const project = await projects.findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) {
      return res.status(404).json({
        message: "Project does not exist"
      });
    }

    const members = await projectMemberships.aggregate([
      {
        $match: {
          project_id: project._id
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          f_name: "$user.f_name",
          l_name: "$user.l_name",
          username: "$user.username",
          isLead: {
            $eq: ["$user_id", project.project_lead_id]
          }
        }
      }
    ]).toArray();

    res.json(members);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving members"
    });
  }
});

// ADD PROJECT MEMBER
app.post("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (
      !ObjectId.isValid(projectId) ||
      typeof user_id !== "string" ||
      !ObjectId.isValid(user_id)
    ) {
      return res.status(400).json({
        message: "Invalid project or user ID"
      });
    }

    const projectObjectId = new ObjectId(projectId);
    const userObjectId = new ObjectId(user_id);

    const project = await projects.findOne({
      _id: projectObjectId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project does not exist"
      });
    }

    const user = await users.findOne({
      _id: userObjectId
    });

    if (!user) {
      return res.status(404).json({
        message: "User does not exist"
      });
    }

    const existingMembership = await projectMemberships.findOne({
      project_id: projectObjectId,
      user_id: userObjectId
    });

    if (existingMembership) {
      return res.status(409).json({
        message: "User is already a member of this project"
      });
    }

    await projectMemberships.insertOne({
      project_id: projectObjectId,
      user_id: userObjectId
    });

    res.status(201).json({
      message: "Member added successfully"
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User is already a member of this project"
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Error adding member"
    });
  }
});

// REMOVE PROJECT MEMBER
app.delete("/projects/:projectId/members/:userId", async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid project or user ID"
      });
    }

    const projectObjectId = new ObjectId(projectId);
    const userObjectId = new ObjectId(userId);

    const project = await projects.findOne({
      _id: projectObjectId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project does not exist"
      });
    }

    const user = await users.findOne({
      _id: userObjectId
    });

    if (!user) {
      return res.status(404).json({
        message: "User does not exist"
      });
    }

    // Project Lead cannot be removed
    if (project.project_lead_id.equals(userObjectId)) {
      return res.status(403).json({
        message: "Cannot remove the Project Lead"
      });
    }

    const result = await projectMemberships.deleteOne({
      project_id: projectObjectId,
      user_id: userObjectId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "User is not a member of this project"
      });
    }

    res.json({
      message: "Member removed successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error removing member"
    });
  }
});


// START SERVER AFTER CONNECTING TO MONGODB
async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    await projectMemberships.createIndex(
  { project_id: 1, user_id: 1 },
  { unique: true }
);

console.log("Membership index ready");

    app.listen(9000, () => {
      console.log("Server running on port 9000");
    });

  } catch (error) {
    console.error("Could not connect to MongoDB");
    console.error(error);
    process.exit(1);
  }
}

startServer();
