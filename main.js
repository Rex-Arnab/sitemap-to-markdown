const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs-extra');
const readline = require('readline-sync');
const path = require('path');

// Constants
const CREW_API_URL = 'http://0.0.0.0:11235';
const AUTH_HEADER = { Authorization: 'Bearer test' };
const OUTPUT_DIR = path.join(__dirname, 'markdown');

async function getSitemapLinks(sitemapUrl) {
    try {
        const { data } = await axios.get(sitemapUrl);
        const parsed = await xml2js.parseStringPromise(data);
        const urls = parsed.urlset.url.map(entry => entry.loc[0]);
        return urls;
    } catch (error) {
        console.error(`Failed to fetch sitemap: ${error.message}`);
        return [];
    }
}

async function checkAndGetSitemap(baseUrl) {
    const sitemapUrl = baseUrl.endsWith('/') ? `${baseUrl}sitemap.xml` : `${baseUrl}/sitemap.xml`;
    try {
        const { data } = await axios.get(sitemapUrl);
        if (data.includes('<?xml')) {
            return await getSitemapLinks(sitemapUrl);
        }
    } catch (err) {
        console.log(`Sitemap not found at ${sitemapUrl}`);
    }
    return [];
}

async function crawlUrl(url) {
    try {
        const { data } = await axios.post(
            `${CREW_API_URL}/crawl`,
            { urls: [url], priority: 10 },
            { headers: AUTH_HEADER }
        );
        return data.task_id;
    } catch (error) {
        console.error(`Failed to crawl ${url}: ${error.message}`);
        return null;
    }
}

async function waitForTaskCompletion(taskId) {
    const statusUrl = `${CREW_API_URL}/task/${taskId}`;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
        try {
            const { data } = await axios.get(statusUrl, { headers: AUTH_HEADER });
            // console.log("data", data)
            if (data.status === 'completed') {
                return data.results[0];
            }
        } catch (e) {
            console.error(`Error checking status for task ${taskId}: ${e.message}`);
        }
        await new Promise(res => setTimeout(res, 5000));
        attempts++;
    }

    console.warn(`Task ${taskId} did not complete in time.`);
    return null;
}

async function saveMarkdown(url, markdown) {
    await fs.ensureDir(OUTPUT_DIR);
    const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
    const filePath = path.join(OUTPUT_DIR, `${safeName}.md`);
    await fs.writeFile(filePath, markdown);
    console.log(`✅ Saved markdown for ${url} at ${filePath}`);
}

(async () => {
    const input = readline.question("Enter website URL or sitemap URL: ").trim();

    let urls = [];

    if (input.includes('sitemap.xml')) {
        console.log("🔍 Detected sitemap URL...");
        urls = await getSitemapLinks(input);
    } else {
        console.log("🔍 Checking if sitemap exists...");
        urls = await checkAndGetSitemap(input);
        if (urls.length === 0) {
            console.error("❌ No sitemap found. Cannot proceed.");
            return;
        }
    }

    console.log(`🔗 Found ${urls.length} URLs. Processing in batches...`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(urls.length / BATCH_SIZE)}`);

        for (const url of batch) {
            const safeName = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
            const filePath = path.join(OUTPUT_DIR, `${safeName}.md`);

            if (fs.existsSync(filePath)) {
                console.log(`⏩ Skipping ${url} - markdown already exists`);
                continue;
            }

            console.log(`🚀 Crawling ${url}`);
            const taskId = await crawlUrl(url);
            if (!taskId) continue;

            const result = await waitForTaskCompletion(taskId);
            if (result && result.markdown) {
                await saveMarkdown(url, result.markdown);
            } else {
                console.log(`❌ Failed to get markdown for ${url}`);
            }

            // Explicitly clear references to help garbage collection
            if (global.gc) {
                global.gc();
            }
        }

        // Clear batch references
        batch.length = 0;
    }

    console.log("✅ All done.");
})();
