import { pgTable, uuid, text, timestamp, numeric, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// USER PROFILES (extends Supabase Auth)
// ============================================================
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
    role: text('role').notNull().default('buyer'), // 'buyer' | 'builder' | 'admin' | 'both'
    displayName: text('display_name').notNull(),
    companyName: text('company_name'),
    companySize: text('company_size'), // '1-10', '11-50', '51-200', '200+'
    city: text('city'),
    linkedinUrl: text('linkedin_url'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================
// CATEGORIES
// ============================================================
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    parentId: uuid('parent_id').references(() => categories.id),
    description: text('description'),
    icon: text('icon'), // emoji or icon name
    sortOrder: integer('sort_order').default(0),
    assetCount: integer('asset_count').default(0), // denormalized for performance
    avgPriceUsage: numeric('avg_price_usage'),
    avgPriceSource: numeric('avg_price_source'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// ASSETS (The core entity - a listed AI tool)
// ============================================================
export const assets = pgTable('assets', {
    id: uuid('id').primaryKey().defaultRandom(),
    builderId: uuid('builder_id').notNull().references(() => profiles.id),

    // Basic Info
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    tagline: text('tagline').notNull(), // one-liner (max 120 chars)
    description: text('description').notNull(), // markdown
    categoryId: uuid('category_id').notNull().references(() => categories.id),

    // Technical
    techStack: text('tech_stack').array().notNull().default(sql`'{}'`),
    deploymentType: text('deployment_type').notNull(), // 'download' | 'hosted' | 'hybrid'
    demoUrl: text('demo_url'),
    documentationUrl: text('documentation_url'),
    repositoryUrl: text('repository_url'), // private, only shown to source buyers

    // Pricing (set by platform based on survey or admin override)
    priceUsage: numeric('price_usage'), // current price for usage license
    priceSource: numeric('price_source'), // current price for source license
    priceBandUsage: jsonb('price_band_usage'), // {"floor": 15000, "optimal": 25000, "ceiling": 40000}
    priceBandSource: jsonb('price_band_source'),

    // Scarcity
    scarcityUsageTotal: integer('scarcity_usage_total').default(100),
    scarcityUsageRemaining: integer('scarcity_usage_remaining').default(100),
    scarcitySourceTotal: integer('scarcity_source_total').default(5),
    scarcitySourceRemaining: integer('scarcity_source_remaining').default(5),

    // Quality
    qualityTier: text('quality_tier').default('bronze'), // 'bronze' | 'silver' | 'gold' | 'platinum'
    qualityScore: numeric('quality_score'),
    avgRating: numeric('avg_rating').default('0'),
    reviewCount: integer('review_count').default(0),

    // Status
    status: text('status').notNull().default('draft'), // 'draft' | 'pending_review' | 'approved' | 'active' | 'paused' | 'delisted'

    // Files (S3 keys)
    sourceFileKey: text('source_file_key'), // encrypted ZIP in S3
    demoFileKey: text('demo_file_key'),

    // Metadata
    viewsCount: integer('views_count').default(0),
    salesCount: integer('sales_count').default(0),
    featured: boolean('featured').default(false),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    publishedAt: timestamp('published_at'),
});

// ============================================================
// LICENSES (A purchased right to use an asset)
// ============================================================
export const licenses = pgTable('licenses', {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').notNull().references(() => assets.id),
    buyerId: uuid('buyer_id').notNull().references(() => profiles.id),
    transactionId: uuid('transaction_id'), // linked after payment

    // License Details
    licenseType: text('license_type').notNull(), // 'usage' | 'source'
    pricePaid: numeric('price_paid').notNull(),
    currency: text('currency').notNull().default('INR'),

    // Rights (JSONB for flexibility)
    rights: jsonb('rights').notNull().default(sql`'{}'`),
    // Usage: {"deploy": true, "modify": false, "redistribute": false}
    // Source: {"deploy": true, "modify": true, "redistribute": false, "source_access": true}

    // Timelines
    supportUntil: timestamp('support_until'), // 90 days for usage, 180 for source
    updatesUntil: timestamp('updates_until'),

    // Status
    status: text('status').notNull().default('active'), // 'pending' | 'active' | 'expired' | 'revoked' | 'transferred'

    // Delivery
    downloadCount: integer('download_count').default(0),
    maxDownloads: integer('max_downloads').default(5), // source licenses
    lastDownloadedAt: timestamp('last_downloaded_at'),

    // Contract
    contractPdfUrl: text('contract_pdf_url'), // S3 URL to generated license PDF

    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// TRANSACTIONS (Payment records)
// ============================================================
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    licenseId: uuid('license_id').references(() => licenses.id),
    buyerId: uuid('buyer_id').notNull().references(() => profiles.id),
    builderId: uuid('builder_id').notNull().references(() => profiles.id),
    assetId: uuid('asset_id').notNull().references(() => assets.id),

    // Amounts
    grossAmount: numeric('gross_amount').notNull(), // what buyer paid
    platformFee: numeric('platform_fee').notNull(), // our cut (16%)
    gstAmount: numeric('gst_amount').notNull(), // 18% GST on platform fee
    builderPayout: numeric('builder_payout').notNull(), // gross - platform_fee
    currency: text('currency').notNull().default('INR'),

    // Payment Provider
    paymentProvider: text('payment_provider').notNull().default('razorpay'),
    paymentOrderId: text('payment_order_id'), // Razorpay order ID
    paymentId: text('payment_id'), // Razorpay payment ID

    // Status
    status: text('status').notNull().default('initiated'), // 'initiated' | 'paid' | 'failed' | 'refunded' | 'disputed'

    // Payout to builder
    payoutStatus: text('payout_status').default('pending'), // 'pending' | 'scheduled' | 'completed' | 'failed'
    payoutReference: text('payout_reference'), // Razorpay Route transfer ID
    payoutCompletedAt: timestamp('payout_completed_at'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================
// SURVEYS (Demand discovery for pricing)
// ============================================================
export const surveys = pgTable('surveys', {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').notNull().references(() => assets.id),
    status: text('status').notNull().default('active'), // 'draft' | 'active' | 'closed'
    targetResponses: integer('target_responses').default(100),
    createdAt: timestamp('created_at').defaultNow(),
    closedAt: timestamp('closed_at'),
});

export const surveyResponses = pgTable('survey_responses', {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id').notNull().references(() => surveys.id),
    respondentEmail: text('respondent_email').notNull(),

    // Van Westendorp
    priceTooExpensive: numeric('price_too_expensive'), // "At what price is this too expensive?"
    priceExpensiveButOk: numeric('price_expensive_but_ok'), // "Getting expensive but still worth it?"
    priceBargain: numeric('price_bargain'), // "At what price is this a bargain?"
    priceTooChea: numeric('price_too_cheap'), // "At what price is it too cheap to trust?"

    // Preferences
    preferredLicense: text('preferred_license'), // 'usage' | 'source'
    urgency: text('urgency'), // 'immediate' | 'this_quarter' | 'this_year' | 'exploring'

    // Open feedback
    mustHaveFeatures: text('must_have_features'),
    concerns: text('concerns'),

    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// REVIEWS
// ============================================================
export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').notNull().references(() => assets.id),
    buyerId: uuid('buyer_id').notNull().references(() => profiles.id),
    licenseId: uuid('license_id').notNull().references(() => licenses.id),

    rating: integer('rating').notNull(), // 1-5
    title: text('title'),
    body: text('body'),

    // Moderation
    status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'

    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================
// MARKET DATA (Daily snapshots for intelligence layer)
// ============================================================
export const marketData = pgTable('market_data', {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').notNull().references(() => assets.id),
    snapshotDate: timestamp('snapshot_date').notNull().defaultNow(),

    priceUsage: numeric('price_usage'),
    priceSource: numeric('price_source'),
    licensesSoldToday: integer('licenses_sold_today').default(0),
    viewsToday: integer('views_today').default(0),
    waitlistCount: integer('waitlist_count').default(0),
    categoryRank: integer('category_rank'),
});

// ============================================================
// ADMIN AUDIT LOG
// ============================================================
export const adminActions = pgTable('admin_actions', {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: uuid('admin_id').notNull().references(() => profiles.id),
    action: text('action').notNull(), // 'approve_asset', 'reject_asset', 'override_price', etc.
    targetType: text('target_type').notNull(), // 'asset', 'user', 'transaction'
    targetId: uuid('target_id').notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow(),
});
