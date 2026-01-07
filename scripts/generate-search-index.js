const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'public/data/policy');
const OUTPUT_FILE = path.join(process.cwd(), 'public/search-index.json');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.json')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

try {
    console.log('Scanning for policy files...');
    const allFiles = getAllFiles(DATA_DIR);
    console.log(`Found ${allFiles.length} files.`);

    const index = [];

    allFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const json = JSON.parse(content);
            const policy = json.policy;

            if (policy) {
                let fullText = policy.title || '';
                if (policy.summary) fullText += ' ' + policy.summary;
                if (policy.content) fullText += ' ' + policy.content;
                if (policy.contentBlocks) {
                    policy.contentBlocks.forEach(block => {
                        if (block.title) fullText += ' ' + block.title;
                        if (block.content) fullText += ' ' + block.content;
                    });
                }

                // Simple HTML tag stripping and normalization
                const strippedText = fullText
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();

                if (policy.type === 'File') {
                    index.push({
                        slug: policy.slug,
                        title: policy.title,
                        summary: policy.summary || '',
                        type: policy.type,
                        level: json.level,
                        image: policy.image,
                        searchText: strippedText
                    });
                }
            }
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
        }
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    console.log(`Successfully generated index with ${index.length} items at ${OUTPUT_FILE}`);

} catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
}
