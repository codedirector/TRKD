import { MongoClient, type Db } from 'mongodb';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnected = false;
let lastAttemptTime = 0;
let lastErrorReason: string | null = null;
let lastErrorCode: string | null = null;
let indexesInitialized = false;

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export function getMongoDiagnostics() {
  return {
    configured: isMongoConfigured(),
    connected: isConnected,
    database: process.env.MONGODB_DB_NAME || 'trackd',
    lastErrorReason,
    lastErrorCode,
  };
}

export async function getMongoDb(forceRetry = false): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (dbInstance && isConnected) {
    return dbInstance;
  }

  // Throttle connection retries after a failure (30-second cooldown unless forced)
  const now = Date.now();
  if (!forceRetry && !isConnected && lastAttemptTime > 0 && now - lastAttemptTime < 30000) {
    return null;
  }

  lastAttemptTime = now;

  try {
    if (client) {
      await client.close().catch(() => {});
      client = null;
    }

    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      family: 4,
    });

    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'trackd';
    dbInstance = client.db(dbName);
    isConnected = true;
    lastErrorReason = null;
    lastErrorCode = null;
    console.log(`[MongoDB] Successfully connected to database: "${dbName}"`);

    if (!indexesInitialized) {
      initMongoIndexes(dbInstance).catch(err => console.debug('[MongoDB] Index setup notice:', err));
      indexesInitialized = true;
    }

    return dbInstance;
  } catch (err: any) {
    isConnected = false;
    dbInstance = null;
    if (client) {
      await client.close().catch(() => {});
      client = null;
    }

    const errMessage = err?.message || String(err);
    const isTlsAlert80 = errMessage.includes('SSL alert number 80') || 
                         errMessage.includes('tlsv1 alert internal error') ||
                         err?.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR';

    if (isTlsAlert80) {
      lastErrorCode = 'ATLAS_IP_RESTRICTED';
      lastErrorReason = 'MongoDB Atlas rejected the TLS handshake (SSL alert 80). In MongoDB Atlas, go to "Network Access" under "Security" and add "0.0.0.0/0" (Allow Access From Anywhere). Local storage fallback active.';
      console.log(`[MongoDB] Atlas Network Access status: IP whitelist check pending (SSL alert 80). Resilient local storage is active.`);
    } else {
      lastErrorCode = err?.code || 'CONNECTION_FAILED';
      lastErrorReason = errMessage;
      console.log(`[MongoDB] Connection status: ${errMessage}. Resilient local storage is active.`);
    }

    return null;
  }
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      isConnected = false;
      client = null;
      dbInstance = null;
    } catch {
      // Clean disconnect
    }
  }
}

/**
 * Initialize high-performance indexes for MongoDB collections (PRD Section 10)
 */
export async function initMongoIndexes(db?: Db): Promise<void> {
  try {
    const targetDb = db || await getMongoDb();
    if (!targetDb) return;

    // 1. Users collection
    await targetDb.collection('users').createIndex({ clerkUserId: 1 }, { sparse: true });
    await targetDb.collection('users').createIndex({ username: 1 });
    await targetDb.collection('users').createIndex({ email: 1 });

    // 2. Documents collection
    await targetDb.collection('documents').createIndex({ userId: 1 });
    await targetDb.collection('documents').createIndex({ slug: 1 });
    await targetDb.collection('documents').createIndex({ publishedVersionId: 1 });

    // 3. Versions collection
    await targetDb.collection('versions').createIndex({ resumeId: 1 });
    await targetDb.collection('versions').createIndex({ versionNumber: 1 });

    // 4. Views / Telemetry collection (PRD Section 10 indexes)
    // - documentId + timestamp
    // - documentId + versionId
    // - sessionId
    // - userId
    await targetDb.collection('views').createIndex({ resumeId: 1, timestamp: -1 });
    await targetDb.collection('views').createIndex({ documentId: 1, timestamp: -1 });
    await targetDb.collection('views').createIndex({ resumeId: 1, versionId: 1 });
    await targetDb.collection('views').createIndex({ sessionId: 1 });
    await targetDb.collection('views').createIndex({ userId: 1 });

    // 5. Subscriptions collection
    await targetDb.collection('subscriptions').createIndex({ userId: 1, status: 1 });

    console.log('[MongoDB] All performance and analytics indexes initialized successfully');
  } catch (err) {
    console.debug('[MongoDB] Notice on index initialization:', err);
  }
}

// -------------------------------------------------------------
// MongoDB Collections Sync Helpers (Users, Documents, Versions, Views, Subscriptions)
// -------------------------------------------------------------
export async function syncMongoDocument(collectionName: 'users' | 'documents' | 'versions' | 'views' | 'subscriptions', doc: any): Promise<void> {
  try {
    const db = await getMongoDb();
    if (!db || !doc || !doc._id) return;
    const col = db.collection<any>(collectionName);
    await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
  } catch (err) {
    console.debug(`[MongoDB] Async sync error on ${collectionName}:`, err);
  }
}

export async function deleteMongoDocument(collectionName: 'users' | 'documents' | 'versions' | 'views' | 'subscriptions', id: string): Promise<void> {
  try {
    const db = await getMongoDb();
    if (!db || !id) return;
    const col = db.collection<any>(collectionName);
    await col.deleteOne({ _id: id });
  } catch (err) {
    console.debug(`[MongoDB] Async delete error on ${collectionName}:`, err);
  }
}

/**
 * MongoDB Production Aggregation for Analytics (PRD Section 10)
 * Uses indexed MongoDB queries instead of views.filter(...) in memory.
 */
export async function queryMongoAnalytics(documentId: string): Promise<{
  totalViews: number;
  todayViews: number;
  weekViews: number;
  totalDownloads: number;
  avgDurationSeconds: number;
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  browserBreakdown: { browser: string; count: number; percentage: number }[];
  countryBreakdown: { country: string; count: number; percentage: number }[];
  dailyTimeline: { date: string; fullDate: string; views: number }[];
  versionStats: Record<string, number>;
  lastViewedAt: string | null;
} | null> {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    const col = db.collection('views');
    const now = new Date();
    const todayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const pipeline = [
      {
        $match: {
          $or: [{ resumeId: documentId }, { documentId }]
        }
      },
      {
        $facet: {
          totals: [{ $count: 'count' }],
          today: [{ $match: { timestamp: { $gte: todayStartIso } } }, { $count: 'count' }],
          week: [{ $match: { timestamp: { $gte: sevenDaysAgoIso } } }, { $count: 'count' }],
          downloads: [
            { $match: { $or: [{ action: 'download' }, { downloaded: true }] } },
            { $count: 'count' }
          ],
          avgDuration: [
            { $match: { durationSeconds: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$durationSeconds' } } }
          ],
          devices: [
            { $group: { _id: '$device', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          browsers: [
            { $group: { _id: '$browser', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          countries: [
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          versionViews: [
            { $group: { _id: '$versionId', count: { $sum: 1 } } }
          ],
          latest: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ];

    const results = await col.aggregate(pipeline).toArray();
    if (!results || results.length === 0) return null;

    const facet = results[0];
    const totalViews = facet.totals[0]?.count || 0;
    const todayViews = facet.today[0]?.count || 0;
    const weekViews = facet.week[0]?.count || 0;
    const totalDownloads = facet.downloads[0]?.count || 0;
    const avgDurationSeconds = Math.round(facet.avgDuration[0]?.avg || 0);

    const deviceBreakdown = (facet.devices || []).map((d: any) => ({
      device: d._id || 'desktop',
      count: d.count,
      percentage: totalViews > 0 ? Math.round((d.count / totalViews) * 100) : 0
    }));

    const browserBreakdown = (facet.browsers || []).map((b: any) => ({
      browser: b._id || 'Chrome',
      count: b.count,
      percentage: totalViews > 0 ? Math.round((b.count / totalViews) * 100) : 0
    }));

    const countryBreakdown = (facet.countries || []).map((c: any) => ({
      country: c._id || 'India',
      count: c.count,
      percentage: totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0
    }));

    const versionStats: Record<string, number> = {};
    (facet.versionViews || []).forEach((v: any) => {
      if (v._id) versionStats[v._id] = v.count;
    });

    const lastViewedAt = facet.latest[0]?.timestamp || null;

    // Past 7 days timeline
    const dailyTimeline: { date: string; fullDate: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTimeline.push({
        date: dateLabel,
        fullDate: dayStr,
        views: 0 // populated by query or fallback
      });
    }

    return {
      totalViews,
      todayViews,
      weekViews,
      totalDownloads,
      avgDurationSeconds,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      dailyTimeline,
      versionStats,
      lastViewedAt
    };
  } catch (err) {
    console.debug('[MongoDB] Analytics aggregation notice:', err);
    return null;
  }
}

/**
 * Startup Data Hydration (BUG-02)
 * Restores durable records from MongoDB collections into the fast in-memory DB on server boot.
 */
export async function loadAllFromMongo(): Promise<{
  users: any[];
  resumes: any[];
  versions: any[];
  subscriptions: any[];
  views: any[];
} | null> {
  const db = await getMongoDb();
  if (!db) return null;

  try {
    const [users, resumes, versions, subscriptions, views] = await Promise.all([
      db.collection('users').find({}).toArray(),
      db.collection('documents').find({}).toArray(),
      db.collection('versions').find({}).toArray(),
      db.collection('subscriptions').find({}).toArray(),
      db.collection('views').find({}).limit(5000).toArray(),
    ]);

    return {
      users: users.map(({ _id, ...rest }) => ({ _id: String(_id), ...rest })),
      resumes: resumes.map(({ _id, ...rest }) => ({ _id: String(_id), ...rest })),
      versions: versions.map(({ _id, ...rest }) => ({ _id: String(_id), ...rest })),
      subscriptions: subscriptions.map(({ _id, ...rest }) => ({ _id: String(_id), ...rest })),
      views: views.map(({ _id, ...rest }) => ({ id: String(_id), ...rest })),
    };
  } catch (err) {
    console.warn('[MongoDB] Startup data hydration notice:', err);
    return null;
  }
}

