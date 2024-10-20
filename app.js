const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to trigger the bot
app.post('/reply', async (req, res) => {
    const { username, password, postUrl, replyMessage } = req.body;

    // Validate incoming request
    if (!username || !password || !postUrl || !replyMessage) {
        return res.status(400).send('Missing required fields');
    }

    let browser;
    try {
        // Launch Puppeteer
        browser = await puppeteer.launch({ headless: false, defaultViewport: null });
        const page = await browser.newPage();

        // Navigate to Reddit login page
        console.log('Navigating to login page...');
        await page.goto('https://www.reddit.com/login/', { waitUntil: 'networkidle0', timeout: 60000 });

        // Log in to Reddit
        await page.waitForSelector('input[name="username"]', { visible: true });
        await page.type('input[name="username"]', username);
        await page.waitForSelector('input[name="password"]', { visible: true });
        await page.type('input[name="password"]', password);

        // Wait for the login button to be visible and click it
        console.log('Waiting for login button...');
        await page.waitForSelector('button[type="submit"]', { visible: true });
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
        ]);

        // Navigate to the specified post URL
        console.log('Navigating to the post URL...');
        await page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 60000 });

        // Wait for the comment box to be visible
        console.log('Waiting for the comment box...');
        await page.waitForSelector('textarea[data-testid="comment-field"]', { visible: true });
        await page.type('textarea[data-testid="comment-field"]', replyMessage);

        // Wait for the submit button to be visible and click it
        console.log('Waiting for submit button...');
        await page.waitForSelector('button[type="submit"]:not([disabled])', { visible: true });
        await Promise.all([
            page.click('button[type="submit"]:not([disabled])'),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
        ]);

        console.log('Reply posted successfully!');
        res.send('Reply posted successfully!');
    } catch (error) {
        console.error('Error occurred:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).send('Failed to post reply');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Basic route to check if the server is running
app.get('/', (req, res) => {
    res.send('Reddit Bot is running! Send a POST request to /reply to use the bot.');
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
