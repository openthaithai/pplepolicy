import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://election69.peoplesparty.or.th/data/policy';
const DATA_DIR = path.resolve('public/data/policy');

const INITIAL_NODES = [
    { slug: 'A', level: 1 },
    { slug: 'B', level: 1 },
    { slug: 'C', level: 1 },
    { slug: 'D', level: 1 },
];

async function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
    }
}

async function fetchAndSave(level, slug) {
    const url = `${BASE_URL}/${level}/${slug}.json`;
    const outputPath = path.join(DATA_DIR, level.toString(), `${slug}.json`);

    try {
        console.log(`Fetching ${url}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const data = await response.json();

        await ensureDir(path.dirname(outputPath));
        await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
        console.log(`Saved to ${outputPath}`);

        if (data.policy && data.policy.children && Array.isArray(data.policy.children)) {
            for (const child of data.policy.children) {
                if (child.slug) { // Recursively fetch if it has a slug
                    // Assuming next level is level + 1, or we can check child.level if available.
                    // The service seems to use level from parent + 1 or explicit property.
                    // Let's rely on constructing the next level URL.
                    // Based on usePolicy in services/policy.ts, it calls with `level` and `slug`.
                    // The CustomNode component increments level for children: `level: (node.data.level || 1) + 1`.
                    const nextLevel = level + 1;
                    await fetchAndSave(nextLevel, child.slug);
                }
            }
        }

    } catch (error) {
        console.error(`Error processing ${slug} (Level ${level}):`, error.message);
    }
}

async function main() {
    await ensureDir(DATA_DIR);

    for (const node of INITIAL_NODES) {
        await fetchAndSave(node.level, node.slug);
    }

    console.log('Done!');
}

main();
