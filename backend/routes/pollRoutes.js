const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// GET all polls
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new poll
router.post('/', async (req, res) => {
  try {
    const { question, options, createdBy } = req.body;
    
    const poll = new Poll({
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      createdBy: createdBy || 'Anonymous'
    });

    const savedPoll = await poll.save();
    res.status(201).json(savedPoll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// VOTE on a poll
router.post('/:id/vote', async (req, res) => {
  try {
    const { optionIndex, voterId } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.voters.includes(voterId)) {
      return res.status(400).json({ message: 'You have already voted in this poll' });
    }

    poll.options[optionIndex].votes += 1;
    poll.voters.push(voterId);

    const updatedPoll = await poll.save();
    res.json(updatedPoll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;