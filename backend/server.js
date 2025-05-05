// server.js
const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Vertex AI
const project = process.env.GOOGLE_CLOUD_PROJECT_ID; // Set this in your .env file
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'; // Default location
const vertexAI = new VertexAI({ project, location });
const model = vertexAI.preview.generativeModel({ model: 'gemini-pro' }); // Or 'gemini-pro-vision'

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const chat = model.startChat({});
    const result = await chat.sendMessage(message);
    const responseText = result.response.candidates[0]?.content?.parts[0]?.text;

    if (responseText) {
      res.json({ response: responseText });
    } else {
      res.status(500).json({ error: 'No response from the chatbot.' });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to communicate with the chatbot.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});