import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST, before any imports
const rootEnvPath = path.resolve(__dirname, '../../.env.local');
const webEnvPath = path.resolve(__dirname, '../../apps/web/.env.local');
const dbEnvPath = path.resolve(__dirname, './.env.local');

// Check in order: packages/db, root, apps/web
if (fs.existsSync(dbEnvPath)) {
    console.log('📁 Loading environment from packages/db/.env.local');
    dotenv.config({ path: dbEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
    console.log('📁 Loading environment from root .env.local');
    dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(webEnvPath)) {
    console.log('📁 Loading environment from apps/web/.env.local');
    dotenv.config({ path: webEnvPath });
} else {
    console.error('❌ No .env.local file found!');
    console.error('Checked:');
    console.error('  -', dbEnvPath);
    console.error('  -', rootEnvPath);
    console.error('  -', webEnvPath);
    process.exit(1);
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local file!');
    process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // Dynamic import AFTER environment is loaded
        const { db, profiles, categories, assets } = await import('./index.js');

        // Create test builder profile
        console.log('Creating test builder profile...');
        const [testBuilder] = await db.insert(profiles).values({
            id: '00000000-0000-0000-0000-000000000001',
            role: 'builder',
            displayName: 'Test Builder',
            companyName: 'AI Innovations Pvt Ltd',
            city: 'Bangalore',
            isVerified: true,
        }).returning();
        console.log('✅ Test builder created:', testBuilder.displayName);

        // Create AI Agents category
        console.log('Creating categories...');
        const [aiAgentsCategory] = await db.insert(categories).values({
            name: 'AI Agents',
            slug: 'ai-agents',
            description: 'Autonomous AI agents for various business tasks',
            icon: '🤖',
            sortOrder: 1,
        }).returning();
        console.log('✅ Category created:', aiAgentsCategory.name);

        // Create test assets
        console.log('Creating test assets...');
        const testAssets = await db.insert(assets).values([
            {
                builderId: testBuilder.id,
                name: 'Lead Scoring AI Agent',
                slug: 'lead-scoring-ai-agent',
                tagline: 'Automatically score and prioritize sales leads using AI',
                description: `# Lead Scoring AI Agent

An intelligent system that automatically analyzes and scores your sales leads based on multiple factors including:

- Company size and industry
- Engagement history
- Budget indicators
- Decision-maker identification

## Features

- **Real-time Scoring**: Instant lead evaluation as they enter your system
- **Custom Models**: Train on your historical conversion data
- **Integration Ready**: Works with popular CRMs
- **Explainable AI**: Understand why each lead received its score

## Tech Stack

Built with Python, OpenAI GPT-4, and FastAPI for high-performance lead processing.`,
                categoryId: aiAgentsCategory.id,
                techStack: ['Python', 'OpenAI GPT-4', 'FastAPI', 'PostgreSQL'],
                deploymentType: 'download',
                priceUsage: '25000',
                priceSource: '75000',
                status: 'active',
                qualityTier: 'silver',
                scarcityUsageRemaining: 47,
                scarcitySourceRemaining: 3,
            },
            {
                builderId: testBuilder.id,
                name: 'Customer Support Chatbot',
                slug: 'customer-support-chatbot',
                tagline: '24/7 AI-powered customer support automation',
                description: `# Customer Support Chatbot

Reduce support costs by 60% with an AI chatbot that handles common customer queries automatically.

## Capabilities

- **Multi-language Support**: Supports 10+ languages
- **Context Awareness**: Remembers conversation history
- **Seamless Handoff**: Transfers to human agents when needed
- **Knowledge Base Integration**: Learns from your documentation

## Use Cases

- Product troubleshooting
- Order status inquiries
- FAQ automation
- Appointment scheduling

## Deployment

Hosted solution with easy embed code. No infrastructure needed.`,
                categoryId: aiAgentsCategory.id,
                techStack: ['Next.js', 'OpenAI', 'Vercel', 'Supabase'],
                deploymentType: 'hosted',
                demoUrl: 'https://demo.example.com/chatbot',
                priceUsage: '30000',
                priceSource: '90000',
                status: 'active',
                qualityTier: 'gold',
                scarcityUsageRemaining: 82,
                scarcitySourceRemaining: 5,
                avgRating: '4.5',
                reviewCount: 3,
            },
            {
                builderId: testBuilder.id,
                name: 'Content Generation Engine',
                slug: 'content-generation-engine',
                tagline: 'Generate SEO-optimized blog posts and social media content',
                description: `# Content Generation Engine

Create high-quality, SEO-optimized content at scale for your marketing needs.

## What It Does

- Blog post generation (1000-2000 words)
- Social media content (LinkedIn, Twitter, Instagram)
- Product descriptions
- Email newsletters

## Features

- **SEO Optimization**: Built-in keyword research and optimization
- **Brand Voice**: Maintains your unique tone and style
- **Fact-Checking**: Verifies claims against reliable sources
- **Multi-format**: Outputs in Markdown, HTML, or plain text

Perfect for agencies managing multiple clients.`,
                categoryId: aiAgentsCategory.id,
                techStack: ['Python', 'Claude API', 'Django', 'Redis'],
                deploymentType: 'hybrid',
                priceUsage: '20000',
                priceSource: '60000',
                status: 'active',
                qualityTier: 'bronze',
                scarcityUsageRemaining: 95,
                scarcitySourceRemaining: 4,
            },
        ]).returning();

        console.log(`✅ Created ${testAssets.length} test assets`);

        console.log('\n🎉 Seed completed successfully!');
        console.log('\nSummary:');
        console.log(`- 1 test builder profile`);
        console.log(`- 1 category (AI Agents)`);
        console.log(`- ${testAssets.length} active assets`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
