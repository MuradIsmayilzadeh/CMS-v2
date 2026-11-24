const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose'); // Import the MongoDB connection
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8000;

// MongoDB connection setup
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Admins schema and model
const adminsSchema = new mongoose.Schema({
  authorname:String,
  username: String,
  password: String,
});

const Admins = mongoose.model('Admins', adminsSchema);

const contestsSchema = new mongoose.Schema({
    name: String,
    description: String,
    startTime: Date,
    endTime: Date,
    author:String,
    allowedUsers: [{ 
    userId: String, // User ID
    username: String, // User's username
    password:String,
    submissions: [{
      questionId: String, 
      result:String,
      filePath:String,
    }], }],
});
  
const Contests = mongoose.model('Contests', contestsSchema);
app.get('/api/contest/:contestId', async (req, res) => {
  const { contestId } = req.params;

  try {
    const contest = await Contests.findById(contestId);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.status(200).json(contest);
  } catch (error) {
    console.error('Error fetching contest by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/contests', async (req, res) => {
    try {
        const contests = await Contests.find();
        res.status(200).json(contests);
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Construct the full path to the requested file
  const filePath = path.join(__dirname, 'files', filename);
  
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // Stream the file as a response
  res.sendFile(filePath);
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admins.findOne({ username });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Compare the provided password with the stored password
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Admin is authenticated, return admin data
    res.status(200).json(admin);
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/api/contest/:contestId/submit', async (req, res) => {
    const { contestId } = req.params;
    const { userId, questionId } = req.body;
  
    try {
      const contest = await Contests.findById(contestId);
  
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found' });
      }
  
      // Get the uploaded file
      const file = req.body.file;
  
      // Check if the file is valid
      if (!file || file.size > 1024 * 1024 * 10) {
        return res.status(400).json({ message: 'Invalid file' });
      }
  
      // Generate a unique file name
      const fileName = `${userId}_${questionId}_${file.name}`;
  
      // Save the uploaded file
      file.mv(`files/${fileName}`, (err) => {
        if (err) {
          console.error('Error saving file:', err);
          return res.status(500).json({ message: 'Error saving file' });
        }
  
        // Find the user within the allowedUsers array based on userId
        const user = contest.allowedUsers.find((u) => u.userId === userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        // Update the user's submissions array
        user.submissions.push({
          questionId,
          result: 0, // Set the initial result to 0 or any other default value
          filePath: `files/${fileName}`,
        });
  
        contest.save()
          .then(() => {
            console.log('File saved successfully');
            res.status(200).json({ message: 'File submitted successfully' });
          })
          .catch((error) => {
            console.error('Error saving contest:', error);
            res.status(500).json({ message: 'Error saving contest' });
          });
      });
    } catch (error) {
      console.error('Error during submission:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
app.post('/api/contest/:id/login', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    try {
        const contest = await Contests.findById(id);
        
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        
        // Check if the username and password exist
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Find the user with the provided username
        const user = contest.allowedUsers.find((u) => u.username === username);
        
        if (!user) {
            return res.status(403).json({ message: 'User is not allowed in this contest' });
        }
        
        // Compare the provided password with the stored password
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        // User is authenticated, return user data
        res.status(200).json(user);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
