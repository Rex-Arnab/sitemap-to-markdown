# Sitemap to Markdown Scraper

A Node.js tool that converts website content into markdown files by crawling URLs from a sitemap. Perfect for creating AI knowledge bases from existing documentation.

## Features

- 🗺️ Extracts URLs from sitemap.xml
- 🕷️ Crawls website content efficiently
- 📝 Converts pages to clean markdown format
- ⏩ Skips already processed URLs
- 🧠 Optimized for memory usage with batch processing
- ✅ Preserves URL structure in filenames

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Rex-Arnab/sitemap-to-markdown.git
cd sitemap-to-markdown
```

2. Install dependencies:
```bash
npm install
```

### Note
`You will need a Crew API key to run this tool. You can get one from [Crew](https://crew.dev).`
3. Set up your environment:
```bash
export CREW_API_URL="Your Crew API URL"
export AUTH_HEADER="Bearer YOUR_API_KEY"
```

## Usage

Run the scraper:
```bash
node main.js
```

When prompted, enter either:
- A website URL (e.g., `https://nextjs.org`)
- A direct sitemap URL (e.g., `https://nextjs.org/sitemap.xml`)

The tool will:
1. Find all URLs in the sitemap
2. Crawl each page
3. Save markdown files to the `markdown/` directory

## Output

Markdown files are saved with URL-safe names, for example:
```
markdown/https___nextjs_org_docs_api_reference.md
markdown/https___nextjs_org_blog.md
```

## Configuration

Edit `main.js` to customize:
- `CREW_API_URL`: Change the crawling service endpoint
- `AUTH_HEADER`: Set API authentication
- `OUTPUT_DIR`: Change output directory
- `BATCH_SIZE`: Adjust memory usage vs speed

## Use Cases

- Create AI training datasets from documentation
- Build local knowledge bases
- Migrate content to static site generators
- Archive website content

## Problems
[ ] The Longer it runs, the more memory it consumes. This is because the `urls` array keeps growing as it crawls more pages. To fix this, we can use a batch processing approach to limit the number of URLs stored in memory at any given time.

[ ] The script may not handle all edge cases, such as redirects or non-HTML content types. You may need to add additional error handling and content type checks based on your specific use case.

## License

MIT
