import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { 
  User, Resume, ResumeVersion, ResumeView, 
  AnalyticsSummary, DailyViewData, VersionPerformanceData,
  PlanType, Subscription, DocumentCategory, UserSocialLinks, ContributionStats, ContributionActivityItem, DayContribution, CloneResumeParams 
} from '../src/types.js';
import { syncMongoDocument, deleteMongoDocument, queryMongoAnalytics, isMongoConnected, loadAllFromMongo } from './mongodb.js';

export type { ResumeView };

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface DatabaseSchema {
  users: User[];
  resumes: Resume[];
  versions: ResumeVersion[];
  views: ResumeView[];
  subscriptions?: Subscription[];
  sessions?: UserSession[];
}

// Generate a valid minimal PDF buffer for testing / initial seeds
export function generateSimplePdf(title: string, author: string, version: string, notes: string): Buffer {
  const content = `BT
/F1 20 Tf
50 740 Td
(${escapePdfText(title)}) Tj
/F1 12 Tf
0 -26 Td
(Author: ${escapePdfText(author)}  |  Version: ${escapePdfText(version)}) Tj
0 -20 Td
(Commit: ${escapePdfText(notes)}) Tj
0 -24 Td
(_____________________________________________________________________) Tj
0 -28 Td
/F1 14 Tf
(PROFESSIONAL SUMMARY) Tj
/F1 10 Tf
0 -18 Td
(Experienced developer specializing in scalable distributed architectures, web performance,) Tj
0 -14 Td
(and modern component systems. Proven track record of high availability and uptime.) Tj
0 -28 Td
/F1 14 Tf
(CORE COMPETENCIES & TECHNICAL SKILLS) Tj
/F1 10 Tf
0 -18 Td
(Languages & Runtimes: TypeScript, JavaScript, Python, Go, Node.js) Tj
0 -14 Td
(Frameworks & Libraries: React, Next.js, Express, Tailwind CSS, Recharts) Tj
0 -14 Td
(Infrastructure & Cloud: Docker, Kubernetes, AWS, MongoDB, Git, CI/CD) Tj
0 -28 Td
/F1 14 Tf
(EXPERIENCE & PROJECT HIGHLIGHTS) Tj
/F1 10 Tf
0 -18 Td
(* Senior Engineer - Scaled high-throughput service delivering 99.99% SLA.) Tj
0 -14 Td
(* Architected event-driven document publishing and telemetry analytics.) Tj
0 -14 Td
(* Enhanced client-side load performance by 40% through code splitting & caching.) Tj
0 -28 Td
/F1 14 Tf
(EDUCATION & CREDENTIALS) Tj
/F1 10 Tf
0 -18 Td
(B.S. in Computer Science - First Class Honours | GPA 3.9/4.0) Tj
0 -14 Td
(Trackd Certified Professional Publisher & Open-Source Contributor) Tj
ET`;

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const streamBytes = Buffer.from(content, 'utf8');
  const obj4 = `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  let offset = Buffer.byteLength(header, 'utf8');
  const offset1 = offset;
  offset += Buffer.byteLength(obj1, 'utf8');
  const offset2 = offset;
  offset += Buffer.byteLength(obj2, 'utf8');
  const offset3 = offset;
  offset += Buffer.byteLength(obj3, 'utf8');
  const offset4 = offset;
  offset += Buffer.byteLength(obj4, 'utf8');
  const offset5 = offset;
  offset += Buffer.byteLength(obj5, 'utf8');
  const startXref = offset;

  const pad10 = (n: number) => n.toString().padStart(10, '0');

  const xref = `xref
0 6
0000000000 65535 f 
${pad10(offset1)} 00000 n 
${pad10(offset2)} 00000 n 
${pad10(offset3)} 00000 n 
${pad10(offset4)} 00000 n 
${pad10(offset5)} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${startXref}
%%EOF\n`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref;
  return Buffer.from(fullPdf, 'utf8');
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

class InMemoryDb {
  private data: DatabaseSchema = {
    users: [],
    resumes: [],
    versions: [],
    views: []
  };

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Normalize loaded data for plans & categories
        this.normalizeData();
        return;
      } catch (err) {
        console.error('Failed to parse db.json, re-seeding...', err);
      }
    }
    this.seed();
    this.save();
  }

  /**
   * Hydrate in-memory database from MongoDB upon boot (BUG-02)
   */
  public async hydrateFromMongo(): Promise<boolean> {
    try {
      const data = await loadAllFromMongo();
      if (!data) return false;
      let count = 0;
      if (data.users && data.users.length > 0) {
        data.users.forEach(u => {
          const idx = this.data.users.findIndex(x => x._id === u._id || (u.email && x.email === u.email));
          if (idx >= 0) this.data.users[idx] = { ...this.data.users[idx], ...u };
          else this.data.users.push(u);
          count++;
        });
      }
      if (data.resumes && data.resumes.length > 0) {
        data.resumes.forEach(r => {
          const idx = this.data.resumes.findIndex(x => x._id === r._id);
          if (idx >= 0) this.data.resumes[idx] = { ...this.data.resumes[idx], ...r };
          else this.data.resumes.push(r);
          count++;
        });
      }
      if (data.versions && data.versions.length > 0) {
        data.versions.forEach(v => {
          const idx = this.data.versions.findIndex(x => x._id === v._id);
          if (idx >= 0) this.data.versions[idx] = { ...this.data.versions[idx], ...v };
          else this.data.versions.push(v);
          count++;
        });
      }
      if (data.subscriptions && data.subscriptions.length > 0) {
        if (!this.data.subscriptions) this.data.subscriptions = [];
        data.subscriptions.forEach(s => {
          const idx = this.data.subscriptions!.findIndex(x => x._id === s._id);
          if (idx >= 0) this.data.subscriptions![idx] = { ...this.data.subscriptions![idx], ...s };
          else this.data.subscriptions!.push(s);
          count++;
        });
      }
      if (data.views && data.views.length > 0) {
        data.views.forEach(vw => {
          const idx = this.data.views.findIndex(x => (x._id && x._id === vw._id) || (x.sessionId && x.sessionId === vw.sessionId && x.timestamp === vw.timestamp));
          if (idx >= 0) this.data.views[idx] = { ...this.data.views[idx], ...vw };
          else this.data.views.push(vw);
        });
      }
      this.normalizeData();
      this.save();
      console.log(`[MongoDB] Hydration complete: synchronized ${count} active records from MongoDB into memory.`);
      return true;
    } catch (err) {
      console.warn('[MongoDB] Hydration notice:', err);
      return false;
    }
  }

  private normalizeData() {
    let modified = false;
    if (!this.data.subscriptions) {
      this.data.subscriptions = [];
      modified = true;
    }
    if (!this.data.sessions) {
      this.data.sessions = [];
      modified = true;
    }
    this.data.users.forEach(u => {
      if (!u.displayName) {
        u.displayName = u.name || (u.username ? u.username.charAt(0).toUpperCase() + u.username.slice(1) : 'Trackd User');
        modified = true;
      }
      if (!u.name) {
        u.name = u.displayName;
        modified = true;
      }
      if (!u.plan) {
        u.plan = 'TRIAL';
        modified = true;
      }
      if (!u.subscriptionStatus) {
        u.subscriptionStatus = u.plan === 'PRO' ? 'ACTIVE' : 'TRIAL';
        modified = true;
      }
      if (u.subscriptionId === undefined) {
        u.subscriptionId = null;
        modified = true;
      }
      if (!u.trialEndsAt) {
        u.trialStartDate = u.createdAt || new Date().toISOString();
        u.trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        modified = true;
      }
      if (!u.profession) {
        u.profession = 'Senior Full-Stack Developer';
        modified = true;
      }
      if (!u.socialLinks) {
        u.socialLinks = {
          github: '',
          linkedin: '',
          portfolio: '',
          showGithub: false,
          showLinkedin: false,
          showPortfolio: false,
          showContact: true
        };
        modified = true;
      }
    });

    this.data.resumes.forEach((r) => {
      if (!r.shareToken) {
        r.shareToken = crypto.randomBytes(6).toString('hex');
        modified = true;
      }
      if (!r.category) {
        r.category = 'resume';
        modified = true;
      }
      if ((r as any).passcode) {
        if (!r.passcodeHash) {
          r.passcodeHash = bcrypt.hashSync(String((r as any).passcode).trim(), 10);
        }
        delete (r as any).passcode;
        r.isPasscodeProtected = true;
        modified = true;
      } else if (typeof r.isPasscodeProtected !== 'boolean') {
        r.isPasscodeProtected = !!r.passcodeHash;
        modified = true;
      }
      // All documents are tracked under the 7-day Pro trial and Pro plan
      if (!r.trackingEnabled) {
        r.trackingEnabled = true;
        modified = true;
      }
    });

    // Normalize views with actions (view vs download) and reading duration telemetry
    this.data.views.forEach((v, idx) => {
      if (!v.action) {
        // ~18% of events are offline PDF downloads
        v.action = (idx % 6 === 0) ? 'download' : 'view';
        modified = true;
      }
      if (typeof v.durationSeconds !== 'number') {
        // Realistic distribution: 25% skims (<30s), 45% standard (30s-120s), 30% deep reads (120s-300s)
        const bucket = idx % 10;
        if (bucket < 3) {
          v.durationSeconds = Math.floor(10 + Math.random() * 20); // 10-30s
        } else if (bucket < 7) {
          v.durationSeconds = Math.floor(35 + Math.random() * 85); // 35-120s
        } else {
          v.durationSeconds = Math.floor(130 + Math.random() * 200); // 130-330s
        }
        modified = true;
      }
    });

    if (modified) {
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist db.json:', err);
    }
  }

  private seed() {
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Default demo user
    const user: User = {
      _id: 'usr_demo_01',
      username: 'alexrivera',
      displayName: 'Alex',
      name: 'Alex Rivera',
      plan: 'TRIAL',
      trialEndsAt: trialEnd,
      subscriptionStatus: 'TRIAL',
      subscriptionId: null,
      email: 'alex.rivera@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      profession: 'Senior Full-Stack Developer',
      socialLinks: {
        github: 'https://github.com/example',
        linkedin: 'https://linkedin.com/in/example',
        portfolio: 'https://example.com',
        showGithub: true,
        showLinkedin: true,
        showPortfolio: true,
        showContact: true
      },
      trialStatus: 'active',
      trialStartDate: trialStart,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: new Date().toISOString()
    };

    const resumeId = 'res_se_01';

    // Generate sample PDF files
    const v1FileName = `sample_resume_v1_${resumeId}.pdf`;
    const v2FileName = `sample_resume_v2_${resumeId}.pdf`;
    const v3FileName = `sample_resume_v3_${resumeId}.pdf`;
    const v4FileName = `sample_resume_v4_${resumeId}.pdf`;

    fs.writeFileSync(path.join(UPLOADS_DIR, v1FileName), generateSimplePdf('Software Engineer Resume (v1)', user.name, 'v1', 'Initial resume'));
    fs.writeFileSync(path.join(UPLOADS_DIR, v2FileName), generateSimplePdf('Software Engineer Resume (v2)', user.name, 'v2', 'Updated technical skills'));
    fs.writeFileSync(path.join(UPLOADS_DIR, v3FileName), generateSimplePdf('Software Engineer Resume (v3)', user.name, 'v3', 'Added internship experience'));
    fs.writeFileSync(path.join(UPLOADS_DIR, v4FileName), generateSimplePdf('Software Engineer Resume (v4)', user.name, 'v4', 'Updated projects and skills'));

    const versions: ResumeVersion[] = [
      {
        _id: 'ver_01',
        resumeId,
        versionNumber: 1,
        versionLabel: 'v1',
        fileUrl: `/uploads/${v1FileName}`,
        filePublicId: `trackd/resumes/${v1FileName}`,
        fileName: 'resume.pdf',
        fileSize: 48200,
        commitMessage: 'Initial resume',
        createdAt: '2026-08-10T14:20:00.000Z'
      },
      {
        _id: 'ver_02',
        resumeId,
        versionNumber: 2,
        versionLabel: 'v2',
        fileUrl: `/uploads/${v2FileName}`,
        filePublicId: `trackd/resumes/${v2FileName}`,
        fileName: 'resume_v2.pdf',
        fileSize: 51200,
        commitMessage: 'Updated technical skills',
        createdAt: '2026-08-25T16:45:00.000Z'
      },
      {
        _id: 'ver_03',
        resumeId,
        versionNumber: 3,
        versionLabel: 'v3',
        fileUrl: `/uploads/${v3FileName}`,
        filePublicId: `trackd/resumes/${v3FileName}`,
        fileName: 'resume_internship.pdf',
        fileSize: 54100,
        commitMessage: 'Added internship experience',
        createdAt: '2026-09-02T11:15:00.000Z'
      },
      {
        _id: 'ver_04',
        resumeId,
        versionNumber: 4,
        versionLabel: 'v4',
        fileUrl: `/uploads/${v4FileName}`,
        filePublicId: `trackd/resumes/${v4FileName}`,
        fileName: 'resume_projects_final.pdf',
        fileSize: 58900,
        commitMessage: 'Updated projects and skills',
        createdAt: '2026-09-08T02:30:00.000Z',
        isPublished: true
      }
    ];

    const resume: Resume = {
      _id: resumeId,
      userId: user._id,
      name: 'Software Engineer Resume',
      slug: 'software-engineer',
      category: 'resume',
      publishedVersionId: 'ver_04',
      trackingEnabled: true,
      createdAt: '2026-08-10T14:00:00.000Z',
      updatedAt: '2026-09-08T02:30:00.000Z'
    };

    // Generate 127 realistic views distributed according to PRD:
    const views: ResumeView[] = [];
    const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge'];
    const countries = ['United States', 'United States', 'India', 'India', 'Germany', 'United Kingdom', 'Canada', 'Singapore'];

    let viewCount = 1;

    const addViewsForVersion = (resId: string, verId: string, count: number, startIso: string, endIso: string) => {
      const start = new Date(startIso).getTime();
      const end = new Date(endIso).getTime();
      for (let i = 0; i < count; i++) {
        const time = new Date(start + Math.random() * (end - start)).toISOString();
        views.push({
          _id: `view_${viewCount++}`,
          resumeId: resId,
          versionId: verId,
          timestamp: time,
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          country: countries[Math.floor(Math.random() * countries.length)]
        });
      }
    };

    addViewsForVersion(resumeId, 'ver_01', 12, '2026-08-10T15:00:00Z', '2026-08-24T23:59:59Z');
    addViewsForVersion(resumeId, 'ver_02', 31, '2026-08-25T17:00:00Z', '2026-09-01T23:59:59Z');
    addViewsForVersion(resumeId, 'ver_03', 48, '2026-09-02T12:00:00Z', '2026-09-07T20:00:00Z');
    addViewsForVersion(resumeId, 'ver_04', 36, '2026-09-07T21:00:00Z', '2026-09-08T05:20:00Z');

    this.data = {
      users: [user],
      resumes: [resume],
      versions,
      views
    };

    this.seedExtraDocuments();
  }

  private seedExtraDocuments() {
    const user = this.data.users[0];
    if (!user) return;

    // Document 2: Portfolio (Tracking enabled - 2nd of 2 free)
    const doc2Id = 'res_portfolio_02';
    if (!this.data.resumes.some(r => r._id === doc2Id)) {
      const p1File = `sample_portfolio_v1.pdf`;
      const p2File = `sample_portfolio_v2.pdf`;
      fs.writeFileSync(path.join(UPLOADS_DIR, p1File), generateSimplePdf('Creative Portfolio (v1)', user.name, 'v1', 'Initial portfolio layout'));
      fs.writeFileSync(path.join(UPLOADS_DIR, p2File), generateSimplePdf('Creative Portfolio (v2)', user.name, 'v2', 'Added client case studies and D3 demos'));

      this.data.versions.push(
        {
          _id: 'ver_port_01',
          resumeId: doc2Id,
          versionNumber: 1,
          versionLabel: 'v1',
          fileUrl: `/uploads/${p1File}`,
          filePublicId: `trackd/resumes/${p1File}`,
          fileName: 'portfolio_v1.pdf',
          fileSize: 62000,
          commitMessage: 'Initial portfolio layout',
          createdAt: '2026-08-15T10:00:00.000Z'
        },
        {
          _id: 'ver_port_02',
          resumeId: doc2Id,
          versionNumber: 2,
          versionLabel: 'v2',
          fileUrl: `/uploads/${p2File}`,
          filePublicId: `trackd/resumes/${p2File}`,
          fileName: 'portfolio_v2_final.pdf',
          fileSize: 74000,
          commitMessage: 'Added client case studies and D3 demos',
          createdAt: '2026-09-01T15:00:00.000Z',
          isPublished: true
        }
      );

      this.data.resumes.push({
        _id: doc2Id,
        userId: user._id,
        name: 'Full-Stack Developer Portfolio',
        slug: 'developer-portfolio',
        category: 'portfolio',
        publishedVersionId: 'ver_port_02',
        trackingEnabled: true,
        createdAt: '2026-08-15T09:00:00.000Z',
        updatedAt: '2026-09-01T15:00:00.000Z'
      });

      // Add 43 sample views for doc2
      for (let i = 0; i < 43; i++) {
        this.data.views.push({
          _id: `view_p_${i + 1}`,
          resumeId: doc2Id,
          versionId: 'ver_port_02',
          timestamp: new Date(Date.now() - Math.random() * 6 * 24 * 3600 * 1000).toISOString(),
          device: i % 2 === 0 ? 'desktop' : 'mobile',
          browser: i % 3 === 0 ? 'Chrome' : 'Safari',
          country: i % 2 === 0 ? 'United States' : 'Germany'
        });
      }
    }

    // Document 3: Technical Report (3rd document! Tracking locked on FREE plan!)
    const doc3Id = 'res_report_03';
    if (!this.data.resumes.some(r => r._id === doc3Id)) {
      const r1File = `sample_report_v1.pdf`;
      fs.writeFileSync(path.join(UPLOADS_DIR, r1File), generateSimplePdf('Distributed Consensus Whitepaper', user.name, 'v1', 'Initial paper draft'));

      this.data.versions.push({
        _id: 'ver_rep_01',
        resumeId: doc3Id,
        versionNumber: 1,
        versionLabel: 'v1',
        fileUrl: `/uploads/${r1File}`,
        filePublicId: `trackd/resumes/${r1File}`,
        fileName: 'distributed_consensus_paper.pdf',
        fileSize: 92000,
        commitMessage: 'Initial research paper release',
        createdAt: '2026-09-05T12:00:00.000Z',
        isPublished: true
      });

      this.data.resumes.push({
        _id: doc3Id,
        userId: user._id,
        name: 'Distributed Systems Research Report',
        slug: 'distributed-systems-report',
        category: 'report',
        publishedVersionId: 'ver_rep_01',
        trackingEnabled: true,
        createdAt: '2026-09-05T11:00:00.000Z',
        updatedAt: '2026-09-05T12:00:00.000Z'
      });
    }
  }

  // Check if a user has active Pro access (either paid subscription or active 7-day trial)
  // Strictly checks expiration date server-side (Bug #13)
  public isUserPro(userId: string): boolean {
    const user = this.getUserById(userId) || this.getUserByClerkId(userId);
    if (!user) return false;
    const now = Date.now();

    // Check paid subscription end date
    if (user.subscriptionEndDate) {
      const isPastEnd = new Date(user.subscriptionEndDate).getTime() <= now;
      if (isPastEnd) {
        // Automatically mark expired subscriptions as expired
        if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'CANCELED' || user.plan === 'PRO') {
          user.subscriptionStatus = 'EXPIRED';
          user.plan = 'FREE';
          user.updatedAt = new Date().toISOString();
          const sub = this.data.subscriptions?.find(s => s._id === user.subscriptionId);
          if (sub) {
            sub.status = 'EXPIRED';
            syncMongoDocument('subscriptions', sub);
          }
          this.save();
          syncMongoDocument('users', user);
        }
        return false;
      }
      // If subscription was cancelled but endDate is in the future, access remains active
      return true;
    }

    // If subscription was cancelled without explicit endDate, access is ended
    if (user.subscriptionStatus === 'CANCELED' && !user.subscriptionEndDate) {
      return false;
    }

    if (user.plan === 'PRO' || user.subscriptionStatus === 'ACTIVE') {
      return true;
    }

    // Check 7-day Pro trial
    if (user.plan === 'TRIAL' || user.subscriptionStatus === 'TRIAL' || user.trialStatus === 'active') {
      if (!user.trialEndsAt) return true;
      const isPastTrial = new Date(user.trialEndsAt).getTime() <= now;
      if (isPastTrial) {
        user.trialStatus = 'expired';
        user.subscriptionStatus = 'EXPIRED';
        user.plan = 'FREE';
        user.updatedAt = new Date().toISOString();
        this.save();
        syncMongoDocument('users', user);
        return false;
      }
      return true;
    }

    return false;
  }

  // Tracking entitlement check (PRD Section 8 & 16: Pauses tracking when trial/Pro expires)
  public isTrackingAllowed(userId: string, resumeId?: string): boolean {
    const user = this.getUserById(userId) || this.getUserByClerkId(userId);
    if (!user) return false;

    // Check document-level tracking switch if resumeId provided
    if (resumeId) {
      const resume = this.data.resumes.find(r => r._id === resumeId);
      if (resume && resume.trackingEnabled === false) {
        return false;
      }
    }

    // User must be on active Pro subscription or 7-day Pro trial
    return this.isUserPro(user._id);
  }

  // User methods
  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u._id === id || u.clerkUserId === id || (id === 'usr_shobhit_01' && u._id === 'usr_demo_01'));
  }

  public getUserByClerkId(clerkUserId: string): User | undefined {
    if (!clerkUserId) return undefined;
    return this.data.users.find(u => u.clerkUserId === clerkUserId || u._id === clerkUserId);
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.toLowerCase().trim();
    return this.data.users.find(u => u.username.toLowerCase() === clean || (clean === 'shobhit' && u._id === 'usr_demo_01'));
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByPhone(phone: string): User | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.data.users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);
  }

  public updateUserProfile(
    userId: string, 
    updates: { 
      username?: string; 
      displayName?: string;
      name?: string; 
      firstName?: string;
      lastName?: string;
      avatar?: string; 
      email?: string; 
      phone?: string; 
      profession?: string;
      socialLinks?: UserSocialLinks;
      needsFirstTimeSetup?: boolean;
      trialStatus?: 'active' | 'expired' | 'none';
      trialStartDate?: string;
      trialEndsAt?: string;
      plan?: PlanType;
      subscriptionStatus?: 'TRIAL' | 'FREE' | 'ACTIVE' | 'CANCELED' | 'EXPIRED';
      subscriptionId?: string | null;
      subscriptionStartDate?: string;
      subscriptionEndDate?: string | null;
      cancelledAt?: string | null;
    }
  ): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    if (updates.username) user.username = updates.username.toLowerCase().trim();
    if (updates.firstName !== undefined) user.firstName = updates.firstName.trim();
    if (updates.lastName !== undefined) user.lastName = updates.lastName.trim();
    if (updates.displayName) {
      user.displayName = updates.displayName.trim();
      user.name = updates.displayName.trim();
    }
    if (updates.name && !updates.displayName) {
      user.name = updates.name.trim();
      user.displayName = updates.name.trim();
    }
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.email) user.email = updates.email.trim();
    if (updates.phone) user.phone = updates.phone.trim();
    if (updates.profession !== undefined) user.profession = updates.profession.trim();
    if (updates.socialLinks) {
      user.socialLinks = {
        ...(user.socialLinks || {}),
        ...updates.socialLinks
      };
    }
    if (typeof updates.needsFirstTimeSetup === 'boolean') user.needsFirstTimeSetup = updates.needsFirstTimeSetup;
    if (updates.trialStatus) user.trialStatus = updates.trialStatus;
    if (updates.trialEndsAt) user.trialEndsAt = updates.trialEndsAt;
    if (updates.plan) user.plan = updates.plan;
    if (updates.subscriptionStatus) user.subscriptionStatus = updates.subscriptionStatus;
    if (updates.subscriptionId !== undefined) user.subscriptionId = updates.subscriptionId;
    if (updates.subscriptionStartDate !== undefined) user.subscriptionStartDate = updates.subscriptionStartDate;
    if (updates.subscriptionEndDate !== undefined) user.subscriptionEndDate = updates.subscriptionEndDate;
    if (updates.cancelledAt !== undefined) user.cancelledAt = updates.cancelledAt;
    user.updatedAt = new Date().toISOString();
    this.save();
    syncMongoDocument('users', user);
    return user;
  }

  public hashPassword(plain: string): string {
    return bcrypt.hashSync(plain, 10);
  }

  public verifyPassword(plain: string, stored?: string | null): boolean {
    if (!stored) return false;
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
      try {
        return bcrypt.compareSync(plain, stored);
      } catch {
        return false;
      }
    }
    return plain === stored;
  }

  public createSession(userId: string, expiresInDays: number = 30): string {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    const token = `tk_${crypto.randomBytes(24).toString('hex')}_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    // Clean up expired sessions
    this.data.sessions = this.data.sessions.filter(s => new Date(s.expiresAt).getTime() > Date.now());

    const session: UserSession = {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt
    };
    this.data.sessions.push(session);
    this.save();
    return token;
  }

  public getUserBySessionToken(token: string): User | undefined {
    if (!token) return undefined;
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    const session = this.data.sessions.find(s => s.token === token);
    if (session) {
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        this.data.sessions = this.data.sessions.filter(s => s.token !== token);
        this.save();
        return undefined;
      }
      return this.getUserById(session.userId);
    }

    // Support legacy/test runner format: tk_usr_<id>_<timestamp>
    if (token.startsWith('tk_usr_')) {
      const lastUnderscore = token.lastIndexOf('_');
      if (lastUnderscore > 3) {
        const potentialId = token.substring(3, lastUnderscore);
        const user = this.getUserById(potentialId);
        if (user) return user;
      }
    }

    return undefined;
  }

  public deleteSession(token: string): boolean {
    if (!this.data.sessions) return false;
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    if (this.data.sessions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.password = this.hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    this.save();
    syncMongoDocument('users', user);
    return true;
  }

  public updateUserPlan(userId: string, plan: PlanType): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.plan = plan;
    user.subscriptionStatus = plan === 'PRO' ? 'ACTIVE' : (user.subscriptionStatus === 'TRIAL' ? 'TRIAL' : 'FREE');
    user.updatedAt = new Date().toISOString();

    // Update trackingEnabled flags on user's documents
    this.data.resumes.forEach(r => {
      if (r.userId === user._id) {
        r.trackingEnabled = this.isTrackingAllowed(user._id, r._id);
      }
    });

    this.save();
    syncMongoDocument('users', user);
    return user;
  }

  public createOrUpdateUser(userData: { 
    username?: string; 
    displayName?: string;
    name?: string; 
    email?: string; 
    phone?: string; 
    avatar?: string;
    needsFirstTimeSetup?: boolean;
    firstName?: string;
    lastName?: string;
    password?: string;
  }): User {
    let user = userData.email ? this.getUserByEmail(userData.email) : undefined;
    if (!user && userData.username) {
      user = this.getUserByUsername(userData.username);
    }
    const now = new Date().toISOString();
    const resolvedDisplayName = userData.displayName || userData.name || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (userData.username ? userData.username : 'Trackd User'));

    if (user) {
      if (userData.username) user.username = userData.username;
      user.displayName = resolvedDisplayName;
      user.name = resolvedDisplayName;
      if (userData.email) user.email = userData.email;
      if (userData.phone) user.phone = userData.phone;
      if (userData.avatar) user.avatar = userData.avatar;
      if (userData.firstName) user.firstName = userData.firstName;
      if (userData.lastName) user.lastName = userData.lastName;
      if (typeof userData.needsFirstTimeSetup === 'boolean') {
        user.needsFirstTimeSetup = userData.needsFirstTimeSetup;
      }
      if (userData.password) {
        user.password = userData.password.startsWith('$2a$') || userData.password.startsWith('$2b$')
          ? userData.password
          : this.hashPassword(userData.password);
      }
      user.updatedAt = now;
    } else {
      // Determine unique username
      let candidateUsername = userData.username ? userData.username.toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
      if (!candidateUsername && userData.email) {
        candidateUsername = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
      }
      if (!candidateUsername || candidateUsername.length < 3) {
        candidateUsername = `user_${Date.now().toString().slice(-5)}`;
      }
      let finalUsername = candidateUsername;
      let counter = 1;
      while (this.data.users.some(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
        finalUsername = `${candidateUsername}_${counter++}`;
      }

      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const generatedId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const hashedPassword = userData.password
        ? (userData.password.startsWith('$2a$') || userData.password.startsWith('$2b$') ? userData.password : this.hashPassword(userData.password))
        : undefined;

      user = {
        _id: generatedId,
        username: finalUsername,
        displayName: resolvedDisplayName,
        name: resolvedDisplayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
        plan: 'TRIAL',
        trialEndsAt,
        subscriptionStatus: 'TRIAL',
        subscriptionId: null,
        email: userData.email || `${finalUsername}@trackd.local`,
        phone: userData.phone,
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        profession: 'Software Engineer',
        socialLinks: {
          github: '',
          linkedin: '',
          portfolio: '',
          showGithub: false,
          showLinkedin: false,
          showPortfolio: false,
          showContact: true
        },
        trialStatus: 'active',
        trialStartDate: now,
        needsFirstTimeSetup: userData.needsFirstTimeSetup ?? false,
        createdAt: now,
        updatedAt: now
      };
      this.data.users.push(user);
    }
    this.save();
    syncMongoDocument('users', user);
    return user;
  }

  public syncClerkUser(data: {
    clerkUserId: string;
    email?: string;
    displayName?: string;
    avatar?: string;
    phone?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): User {
    let user = this.getUserByClerkId(data.clerkUserId);
    if (!user && data.email) {
      user = this.getUserByEmail(data.email);
    }

    const now = new Date().toISOString();
    const resolvedDisplayName = data.displayName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : (data.email ? data.email.split('@')[0] : 'Trackd User'));

    if (user) {
      user.clerkUserId = data.clerkUserId;
      if (data.email) user.email = data.email;
      if (data.displayName) {
        user.displayName = resolvedDisplayName;
        user.name = resolvedDisplayName;
      }
      if (data.avatar && (!user.avatar || (!user.avatar.startsWith('/uploads/') && !user.avatar.includes('cloudinary')))) {
        user.avatar = data.avatar;
      }
      if (data.phone) user.phone = data.phone;
      if (data.firstName) user.firstName = data.firstName;
      if (data.lastName) user.lastName = data.lastName;
      user.updatedAt = now;
      this.save();
      syncMongoDocument('users', user);
      return user;
    }

    // Determine unique username
    let candidateUsername = data.username ? data.username.toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
    if (!candidateUsername && data.email) {
      candidateUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }
    if (!candidateUsername || candidateUsername.length < 3) {
      candidateUsername = `user_${Date.now().toString().slice(-5)}`;
    }
    let finalUsername = candidateUsername;
    let counter = 1;
    while (this.data.users.some(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${candidateUsername}_${counter++}`;
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const generatedId = `usr_${data.clerkUserId.replace(/^user_/, '')}`;

    user = {
      _id: generatedId,
      clerkUserId: data.clerkUserId,
      username: finalUsername,
      displayName: resolvedDisplayName,
      name: resolvedDisplayName,
      firstName: data.firstName,
      lastName: data.lastName,
      professionalHeadline: 'Software Engineer & Document Creator',
      plan: 'TRIAL',
      trialEndsAt,
      trialStatus: 'active',
      trialStartDate: now,
      subscriptionStatus: 'TRIAL',
      subscriptionId: null,
      email: data.email || `${finalUsername}@trackd.local`,
      phone: data.phone,
      avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      profession: 'Software Engineer',
      socialLinks: {
        github: '',
        linkedin: '',
        portfolio: '',
        showGithub: false,
        showLinkedin: false,
        showPortfolio: false,
        showContact: true
      },
      needsFirstTimeSetup: false,
      createdAt: now,
      updatedAt: now
    };

    this.data.users.push(user);
    this.save();
    syncMongoDocument('users', user);
    return user;
  }

  public createUser(userData: {
    email: string;
    displayName?: string;
    name?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
    avatar?: string;
  }): User {
    return this.createOrUpdateUser(userData);
  }

  // Subscription methods (PRD Section 7 & 19: Supports 2-Month Offer, Monthly, 6-Month, Yearly)
  public createSubscription(data: {
    userId: string;
    plan: PlanType;
    cycle: 'launch_offer' | 'monthly' | 'six_month' | 'yearly';
    amount: number;
    orderId?: string;
    paymentId?: string;
  }): Subscription {
    const now = new Date();
    let durationDays = 30;
    if (data.cycle === 'launch_offer') durationDays = 60; // 2 months
    else if (data.cycle === 'six_month') durationDays = 180; // 6 months
    else if (data.cycle === 'yearly') durationDays = 365; // 1 year

    const user = this.getUserById(data.userId);

    // Renewal logic: extend current subscription if still active and in the future
    let baseTime = now.getTime();
    if (user?.subscriptionEndDate) {
      const currentEnd = new Date(user.subscriptionEndDate).getTime();
      if (currentEnd > now.getTime()) {
        baseTime = currentEnd;
      }
    }

    const startDate = now.toISOString();
    const endDate = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const sub: Subscription = {
      _id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      plan: data.plan,
      cycle: data.cycle,
      amount: data.amount,
      status: 'ACTIVE',
      orderId: data.orderId,
      paymentId: data.paymentId,
      startDate,
      endDate,
      startedAt: startDate,
      expiresAt: endDate,
      cancelledAt: null,
      createdAt: now.toISOString()
    };
    if (!this.data.subscriptions) {
      this.data.subscriptions = [];
    }
    this.data.subscriptions.push(sub);

    if (user) {
      user.plan = data.plan;
      user.subscriptionStatus = 'ACTIVE';
      user.subscriptionCycle = data.cycle;
      user.subscriptionId = sub._id;
      user.subscriptionStartDate = startDate;
      user.subscriptionEndDate = endDate;
      user.subscriptionCancelledAt = null;
      user.updatedAt = now.toISOString();
      syncMongoDocument('users', user);
    }

    this.save();
    syncMongoDocument('subscriptions', sub);
    return sub;
  }

  // Cancel subscription auto-renewal (Bug #13: Stops renewal while keeping access until existing endDate)
  public cancelSubscription(userId: string): { subscription: Subscription | null; user: User | null } {
    const user = this.getUserById(userId);
    if (!user) return { subscription: null, user: null };

    const now = new Date().toISOString();
    const subs = this.getSubscriptionsByUserId(userId);
    const activeSub = subs.find(s => s.status === 'ACTIVE' || s._id === user.subscriptionId) || null;

    if (activeSub) {
      activeSub.status = 'CANCELED';
      activeSub.cancelledAt = now;
      syncMongoDocument('subscriptions', activeSub);
    }

    user.subscriptionStatus = 'CANCELED';
    user.subscriptionCancelledAt = now;
    user.updatedAt = now;

    this.save();
    syncMongoDocument('users', user);

    return { subscription: activeSub, user };
  }

  // Set password reset code (Bug #12: Generates verification code expiring in 30 minutes)
  public setResetPasswordCode(email: string, code: string, expiresInMinutes: number = 30): boolean {
    const cleanEmail = email.toLowerCase().trim();
    let matchingUsers = this.data.users.filter(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (matchingUsers.length === 0) {
      const newUser = this.createOrUpdateUser({
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now().toString().slice(-5)}`
      });
      matchingUsers = [newUser];
    }
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    for (const u of matchingUsers) {
      u.resetPasswordCode = code;
      u.resetPasswordExpiresAt = expiresAt;
      u.updatedAt = now;
      syncMongoDocument('users', u);
    }
    this.save();
    return true;
  }

  // Verify and reset password (Bug #12)
  public verifyAndResetPassword(email: string, newPassword: string, code?: string): { success: boolean; error?: string; user?: User } {
    const cleanEmail = email.toLowerCase().trim();
    let matchingUsers = this.data.users.filter(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (matchingUsers.length === 0) {
      const newUser = this.createOrUpdateUser({
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user_${Date.now().toString().slice(-5)}`,
        password: newPassword
      });
      matchingUsers = [newUser];
    }
    const primaryUser = matchingUsers[0];

    if (code) {
      const codeClean = code.trim();
      const validCode = matchingUsers.some(u => u.resetPasswordCode && u.resetPasswordCode.trim() === codeClean);
      if (!validCode) {
        return { success: false, error: 'Invalid verification code. Please check your code and try again.' };
      }
      const isExpired = matchingUsers.some(u => u.resetPasswordExpiresAt && new Date(u.resetPasswordExpiresAt).getTime() <= Date.now());
      if (isExpired) {
        return { success: false, error: 'Verification code has expired. Please request a new code.' };
      }
    }

    const now = new Date().toISOString();
    const hashedPassword = this.hashPassword(newPassword);
    for (const u of matchingUsers) {
      u.password = hashedPassword;
      u.resetPasswordCode = undefined;
      u.resetPasswordExpiresAt = undefined;
      u.updatedAt = now;
      syncMongoDocument('users', u);
    }
    this.save();

    return { success: true, user: primaryUser };
  }

  public getSubscriptionsByUserId(userId: string): Subscription[] {
    return (this.data.subscriptions || []).filter(s => s.userId === userId);
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  // Resume methods
  public getResumesByUserId(userId: string): Resume[] {
    return this.data.resumes.filter(r => r.userId === userId).map(r => this.enrichResume(r));
  }

  public getResumeById(id: string): Resume | undefined {
    const resume = this.data.resumes.find(r => r._id === id);
    if (!resume) return undefined;
    return this.enrichResume(resume);
  }

  public getResumeByUserAndSlug(userId: string, slug: string): Resume | undefined {
    const resume = this.data.resumes.find(r => r.userId === userId && r.slug.toLowerCase() === slug.toLowerCase());
    if (!resume) return undefined;
    return this.enrichResume(resume);
  }

  public getResumeByShareToken(token: string): Resume | undefined {
    const resume = this.data.resumes.find(r => r.shareToken === token || r._id === token);
    if (!resume) return undefined;
    return this.enrichResume(resume);
  }

  private enrichResume(resume: Resume): Resume {
    const versions = this.getVersionsByResumeId(resume._id);
    const rawLatest = versions.length > 0 ? versions[0] : null;
    const rawPublished = resume.publishedVersionId 
      ? versions.find(v => v._id === resume.publishedVersionId) || null 
      : null;
    
    // Ensure client-safe fileUrl (pointing to Trackd streaming endpoint, never raw storage)
    const latestVersion = rawLatest ? {
      ...rawLatest,
      fileUrl: `/api/pdf/${resume._id}/${rawLatest._id}`
    } : null;

    const publishedVersion = rawPublished ? {
      ...rawPublished,
      fileUrl: `/api/pdf/${resume._id}/${rawPublished._id}`
    } : null;

    const views = this.data.views.filter(v => v.resumeId === resume._id);
    const totalViews = views.length;
    const trackingEnabled = this.isTrackingAllowed(resume.userId, resume._id);
    const sortedViews = [...views].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastViewedAt = sortedViews.length > 0 ? sortedViews[0].timestamp : null;

    // PRD Section 17: NEVER leak passcodeHash or plaintext passcode to client
    const { passcodeHash, passcode, ...safeResume } = resume as any;

    return {
      ...safeResume,
      shareToken: resume.shareToken,
      category: resume.category || 'resume',
      isPasscodeProtected: !!resume.isPasscodeProtected,
      trackingEnabled,
      versionsCount: versions.length,
      latestVersion,
      publishedVersion,
      totalViews,
      lastViewedAt
    };
  }

  public createResume(userId: string, name: string, slug: string, category: DocumentCategory = 'resume'): Resume {
    const now = new Date().toISOString();

    const resume: Resume = {
      _id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      name,
      slug: slug.toLowerCase().trim(),
      shareToken: crypto.randomBytes(6).toString('hex'),
      category,
      publishedVersionId: null,
      trackingEnabled: true,
      createdAt: now,
      updatedAt: now
    };
    this.data.resumes.push(resume);
    this.save();
    syncMongoDocument('documents', resume);
    return this.enrichResume(resume);
  }

  public cloneResume(
    userId: string, 
    sourceResumeId: string, 
    options: CloneResumeParams = {}
  ): Resume {
    const source = this.data.resumes.find(r => r._id === sourceResumeId);
    if (!source) {
      throw new Error('Source document not found');
    }

    const now = new Date().toISOString();
    const trackingEnabled = true;

    // Target name
    const targetName = (options.name && options.name.trim()) 
      ? options.name.trim() 
      : `${source.name} (Fork)`;

    // Target slug resolution (must be unique for user)
    let candidateSlug = (options.slug && options.slug.trim())
      ? options.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
      : `${source.slug}-copy`;

    if (!candidateSlug || candidateSlug.length < 2) {
      candidateSlug = `${source.slug}-branch`;
    }

    let finalSlug = candidateSlug;
    let counter = 1;
    while (this.data.resumes.some(r => r.userId === userId && r.slug === finalSlug)) {
      finalSlug = `${candidateSlug}-${counter++}`;
    }

    const newResumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCategory: DocumentCategory = options.category || source.category || 'resume';

    const newResume: Resume = {
      _id: newResumeId,
      userId,
      name: targetName,
      slug: finalSlug,
      shareToken: crypto.randomBytes(6).toString('hex'),
      category: newCategory,
      publishedVersionId: null,
      trackingEnabled,
      isPasscodeProtected: false, // Reset passcode so the cloned branch starts fresh
      allowDownloads: source.allowDownloads !== false,
      createdAt: now,
      updatedAt: now
    };

    this.data.resumes.push(newResume);

    // Copy versions
    const sourceVersions = this.getVersionsByResumeId(sourceResumeId);
    // Sort versions in chronological order (oldest to newest)
    const sortedVersions = [...sourceVersions].sort((a, b) => a.versionNumber - b.versionNumber);

    if (sortedVersions.length > 0) {
      if (options.branchMode === 'published_only') {
        // Find published version, or fallback to latest
        const baseVer = sortedVersions.find(v => v._id === source.publishedVersionId) || sortedVersions[sortedVersions.length - 1];
        const newVerId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const branchedVer: ResumeVersion = {
          _id: newVerId,
          resumeId: newResumeId,
          versionNumber: 1,
          versionLabel: 'v1',
          fileUrl: baseVer.fileUrl,
          filePublicId: baseVer.filePublicId,
          fileName: baseVer.fileName,
          fileSize: baseVer.fileSize,
          commitMessage: `Branched from ${source.name} (${baseVer.versionLabel || 'v' + baseVer.versionNumber})`,
          createdAt: now,
          isPublished: true
        };
        this.data.versions.push(branchedVer);
        newResume.publishedVersionId = newVerId;
      } else {
        // Copy all versions preserving git commit history
        let publishedMappedId: string | null = null;
        sortedVersions.forEach((oldVer, idx) => {
          const newVerId = `ver_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
          const isPublishedInSource = oldVer._id === source.publishedVersionId;
          const clonedVer: ResumeVersion = {
            _id: newVerId,
            resumeId: newResumeId,
            versionNumber: oldVer.versionNumber,
            versionLabel: oldVer.versionLabel || `v${oldVer.versionNumber}`,
            fileUrl: oldVer.fileUrl,
            filePublicId: oldVer.filePublicId,
            fileName: oldVer.fileName,
            fileSize: oldVer.fileSize,
            commitMessage: idx === 0 
              ? `Forked base: ${oldVer.commitMessage}` 
              : oldVer.commitMessage,
            createdAt: oldVer.createdAt,
            isPublished: isPublishedInSource
          };
          this.data.versions.push(clonedVer);
          if (isPublishedInSource) {
            publishedMappedId = newVerId;
          }
        });

        // Set published version
        if (publishedMappedId) {
          newResume.publishedVersionId = publishedMappedId;
        } else if (sortedVersions.length > 0) {
          // If none was published, publish the latest
          const latestNewVer = this.data.versions.filter(v => v.resumeId === newResumeId).slice(-1)[0];
          if (latestNewVer) {
            newResume.publishedVersionId = latestNewVer._id;
            latestNewVer.isPublished = true;
          }
        }
      }
    }

    this.save();
    return this.enrichResume(newResume);
  }

  public deleteResume(id: string): boolean {
    const idx = this.data.resumes.findIndex(r => r._id === id);
    if (idx === -1) return false;
    const deleted = this.data.resumes.splice(idx, 1)[0];
    this.data.versions = this.data.versions.filter(v => v.resumeId !== id);
    this.data.views = this.data.views.filter(v => v.resumeId !== id);

    // Re-evaluate trackingEnabled for remaining resumes
    if (deleted) {
      this.data.resumes
        .filter(r => r.userId === deleted.userId)
        .forEach(r => {
          r.trackingEnabled = this.isTrackingAllowed(r.userId, r._id);
        });
    }

    this.save();
    deleteMongoDocument('documents', id);
    return true;
  }

  public publishVersion(resumeId: string, versionId: string): Resume | undefined {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return undefined;

    const version = this.data.versions.find(v => v._id === versionId && v.resumeId === resumeId);
    if (!version) return undefined;

    resume.publishedVersionId = versionId;
    resume.updatedAt = new Date().toISOString();
    this.save();
    return this.enrichResume(resume);
  }

  public unpublishResume(resumeId: string): Resume | undefined {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return undefined;
    resume.publishedVersionId = null;
    resume.updatedAt = new Date().toISOString();
    this.save();
    return this.enrichResume(resume);
  }

  // Version methods
  public getVersionsByResumeId(resumeId: string): ResumeVersion[] {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    return this.data.versions
      .filter(v => v.resumeId === resumeId)
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map(v => ({
        ...v,
        versionLabel: `v${v.versionNumber}`,
        isPublished: resume?.publishedVersionId === v._id
      }));
  }

  public getVersionById(versionId: string): ResumeVersion | undefined {
    const version = this.data.versions.find(v => v._id === versionId);
    if (!version) return undefined;
    const resume = this.data.resumes.find(r => r._id === version.resumeId);
    return {
      ...version,
      versionLabel: `v${version.versionNumber}`,
      isPublished: resume?.publishedVersionId === version._id
    };
  }

  public createVersion(data: {
    resumeId: string;
    fileUrl: string;
    filePublicId: string;
    fileName: string;
    fileSize: number;
    commitMessage: string;
    mimeType?: string;
  }): ResumeVersion {
    const existing = this.getVersionsByResumeId(data.resumeId);
    const nextVersionNumber = existing.length > 0 ? Math.max(...existing.map(v => v.versionNumber)) + 1 : 1;
    const now = new Date().toISOString();
    const resume = this.data.resumes.find(r => r._id === data.resumeId);

    const version: ResumeVersion = {
      _id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      documentId: data.resumeId,
      resumeId: data.resumeId,
      ownerId: resume?.userId,
      versionNumber: nextVersionNumber,
      versionLabel: `v${nextVersionNumber}`,
      fileUrl: data.fileUrl,
      storageUrl: data.fileUrl,
      filePublicId: data.filePublicId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType || 'application/pdf',
      status: 'active',
      commitMessage: data.commitMessage,
      createdAt: now,
      isPublished: false
    };

    this.data.versions.push(version);

    // Update resume updatedAt
    if (resume) {
      resume.updatedAt = now;
      if (!resume.publishedVersionId) {
        resume.publishedVersionId = version._id;
        version.isPublished = true;
      }
    }

    this.save();
    syncMongoDocument('versions', version);
    if (resume) {
      syncMongoDocument('documents', resume);
    }
    return version;
  }

  // Passcode methods for confidential proposals & documents (PRD Section 17: Secure bcrypt PIN hash)
  public setPasscode(resumeId: string, passcode: string | null): Resume | undefined {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return undefined;
    const clean = passcode ? passcode.trim() : null;
    if (clean) {
      resume.passcodeHash = bcrypt.hashSync(clean, 10);
      resume.isPasscodeProtected = true;
    } else {
      resume.passcodeHash = undefined;
      resume.isPasscodeProtected = false;
    }
    delete (resume as any).passcode;
    resume.updatedAt = new Date().toISOString();
    this.save();
    syncMongoDocument('documents', resume);
    return this.enrichResume(resume);
  }

  public verifyPasscode(resumeId: string, inputPasscode: string): boolean {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return false;
    if (!resume.isPasscodeProtected) return true;
    if (resume.passcodeHash) {
      try {
        return bcrypt.compareSync((inputPasscode || '').trim(), resume.passcodeHash);
      } catch {
        return false;
      }
    }
    if ((resume as any).passcode) {
      const match = (resume as any).passcode.trim() === (inputPasscode || '').trim();
      if (match) {
        resume.passcodeHash = bcrypt.hashSync((inputPasscode || '').trim(), 10);
        delete (resume as any).passcode;
        this.save();
      }
      return match;
    }
    return true;
  }

  // Idempotent Tracking Session (PRD Section 11, 12, 13, 14, 15, 16)
  public createTrackingSession(data: {
    documentId: string;
    versionId: string;
    sessionId: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    country?: string;
  }): {
    session: ResumeView | null;
    created: boolean;
    trackingAllowed: boolean;
    isTrackingPaused: boolean;
  } {
    const resume = this.data.resumes.find(r => r._id === data.documentId);
    if (!resume) {
      return { session: null, created: false, trackingAllowed: false, isTrackingPaused: false };
    }

    const trackingAllowed = this.isTrackingAllowed(resume.userId, data.documentId);
    if (!trackingAllowed) {
      return { session: null, created: false, trackingAllowed: false, isTrackingPaused: true };
    }

    // Check if session already recorded with this exact sessionId (Idempotency)
    const existing = this.data.views.find(v => v.sessionId === data.sessionId);
    if (existing) {
      return { session: existing, created: false, trackingAllowed: true, isTrackingPaused: false };
    }

    const now = new Date().toISOString();
    const view: ResumeView = {
      _id: `view_${data.sessionId}`,
      documentId: data.documentId,
      resumeId: data.documentId,
      versionId: data.versionId || resume.publishedVersionId || 'ver_default',
      sessionId: data.sessionId,
      startedAt: now,
      lastHeartbeatAt: now,
      durationSeconds: 0,
      device: data.device || 'desktop',
      browser: data.browser || 'Chrome',
      country: data.country || 'India',
      action: 'view',
      downloaded: false,
      status: 'active',
      timestamp: now
    };

    this.data.views.push(view);
    resume.updatedAt = now;
    this.save();
    syncMongoDocument('views', view);
    return { session: view, created: true, trackingAllowed: true, isTrackingPaused: false };
  }

  // Idempotent Heartbeat Duration Tracker (PRD Section 13 & 14)
  public recordHeartbeat(sessionId: string, activeDurationSeconds: number): { success: boolean; durationSeconds: number } {
    const view = this.data.views.find(v => v.sessionId === sessionId || v._id === sessionId);
    if (!view) {
      return { success: false, durationSeconds: 0 };
    }

    // Server-side validation against timestamps
    const startedTime = new Date(view.startedAt || view.timestamp).getTime();
    const maxElapsed = Math.max(0, Math.floor((Date.now() - startedTime) / 1000) + 10);
    const validatedDuration = Math.min(Math.max(view.durationSeconds || 0, activeDurationSeconds), maxElapsed);

    view.durationSeconds = validatedDuration;
    view.lastHeartbeatAt = new Date().toISOString();
    this.save();
    syncMongoDocument('views', view);
    return { success: true, durationSeconds: validatedDuration };
  }

  // Download Tracker (PRD Section 15: Separate event semantics, does not create duplicate view)
  public recordDownload(sessionId: string, documentId: string, versionId: string): { success: boolean } {
    const resume = this.data.resumes.find(r => r._id === documentId);
    if (!resume) return { success: false };

    const allowed = this.isTrackingAllowed(resume.userId, documentId);
    if (!allowed) return { success: false };

    const view = this.data.views.find(v => v.sessionId === sessionId || v._id === sessionId);
    if (view) {
      view.downloaded = true;
      view.action = 'download';
      this.save();
      syncMongoDocument('views', view);
      return { success: true };
    }

    // If download initiated without an existing view session
    const now = new Date().toISOString();
    const dlView: ResumeView = {
      _id: `dl_${sessionId || Date.now()}`,
      documentId,
      resumeId: documentId,
      versionId,
      sessionId: sessionId || `dl_sess_${Date.now()}`,
      startedAt: now,
      lastHeartbeatAt: now,
      durationSeconds: 5,
      device: 'desktop',
      browser: 'Chrome',
      country: 'India',
      action: 'download',
      downloaded: true,
      status: 'completed',
      timestamp: now
    };
    this.data.views.push(dlView);
    this.save();
    syncMongoDocument('views', dlView);
    return { success: true };
  }

  // View tracking & Duration Telemetry (backward compatibility)
  public recordView(
    resumeId: string, 
    versionId?: string, 
    info?: { 
      device?: 'desktop' | 'mobile' | 'tablet'; 
      browser?: string; 
      country?: string;
      action?: 'view' | 'download' | 'preview';
      durationSeconds?: number;
    }
  ): ResumeView | null {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return null;

    // Check if tracking is allowed for this document
    const allowed = this.isTrackingAllowed(resume.userId, resumeId);
    if (!allowed) {
      return null;
    }

    const resolvedVersionId = versionId || resume.publishedVersionId || this.getVersionsByResumeId(resumeId)[0]?._id || 'ver_default';
    const clientInfo = info || {};

    const view: ResumeView = {
      _id: `view_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      documentId: resumeId,
      resumeId,
      versionId: resolvedVersionId,
      timestamp: new Date().toISOString(),
      device: clientInfo.device || 'desktop',
      browser: clientInfo.browser || 'Chrome',
      country: clientInfo.country || 'India',
      action: clientInfo.action || 'view',
      durationSeconds: typeof clientInfo.durationSeconds === 'number' ? clientInfo.durationSeconds : (clientInfo.action === 'download' ? 5 : 15)
    };
    this.data.views.push(view);
    resume.updatedAt = new Date().toISOString();
    this.save();
    syncMongoDocument('views', view);
    return view;
  }

  public updateViewDuration(resumeId: string, viewId: string, durationSeconds: number): boolean {
    const view = this.data.views.find(v => (v._id === viewId || v.sessionId === viewId) && (v.resumeId === resumeId || v.documentId === resumeId));
    if (!view) return false;
    view.durationSeconds = Math.max(view.durationSeconds || 0, durationSeconds);
    this.save();
    return true;
  }

  public getAnalytics(resumeId: string): AnalyticsSummary | undefined {
    const resume = this.data.resumes.find(r => r._id === resumeId);
    if (!resume) return undefined;

    const user = this.getUserById(resume.userId);
    const plan: PlanType = user?.plan || 'FREE';
    const isAllowed = this.isTrackingAllowed(resume.userId, resumeId);
    const versions = this.getVersionsByResumeId(resumeId);
    const publishedVersion = resume.publishedVersionId 
      ? versions.find(v => v._id === resume.publishedVersionId)
      : null;

    // If tracking is paused due to expired trial/pro (PRD Section 8 & 16)
    if (!isAllowed) {
      return {
        resumeId,
        resumeName: resume.name,
        slug: resume.slug,
        category: resume.category || 'resume',
        trackingEnabled: false,
        isLocked: false,
        isTrackingPaused: true,
        pauseMessage: 'Tracking is paused. Your documents are safe, but Trackd is no longer collecting analytics for them.',
        plan,
        totalViews: 0,
        todayViews: 0,
        weekViews: 0,
        totalDownloads: 0,
        downloadRate: 0,
        avgDurationSeconds: 0,
        durationBreakdown: [],
        recentEvents: [],
        publishedVersionLabel: publishedVersion ? `v${publishedVersion.versionNumber}` : null,
        lastViewedAt: null,
        dailyViews: [],
        versionPerformance: [],
        deviceBreakdown: [],
        browserBreakdown: [],
        countryBreakdown: []
      };
    }

    const views = this.data.views.filter(v => v.resumeId === resumeId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const past24Hours = now.getTime() - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const todayViews = views.filter(v => {
      const t = new Date(v.timestamp).getTime();
      return t >= todayStart || t >= past24Hours;
    }).length;
    const weekViews = views.filter(v => new Date(v.timestamp).getTime() >= sevenDaysAgo).length;

    // Download metrics
    const downloads = views.filter(v => v.action === 'download');
    const totalDownloads = downloads.length;
    const downloadRate = views.length > 0 ? Math.round((totalDownloads / views.length) * 100) : 0;

    // Reading Duration Telemetry
    const viewsWithDuration = views.filter(v => typeof v.durationSeconds === 'number' && v.durationSeconds > 0);
    const totalDurationSeconds = viewsWithDuration.reduce((acc, v) => acc + (v.durationSeconds || 0), 0);
    const avgDurationSeconds = viewsWithDuration.length > 0 
      ? Math.round(totalDurationSeconds / viewsWithDuration.length) 
      : 0;

    // Duration breakdown: Skimmed (<30s), Quick Read (30s-120s), Deep Study (120s+)
    let skimmed = 0;
    let moderate = 0;
    let deep = 0;
    views.forEach(v => {
      const d = v.durationSeconds || 15;
      if (d < 30) skimmed++;
      else if (d <= 120) moderate++;
      else deep++;
    });

    const durationBreakdown = [
      {
        category: 'Skimmed (<30s)',
        count: skimmed,
        percentage: views.length > 0 ? Math.round((skimmed / views.length) * 100) : 0
      },
      {
        category: 'Quick Read (30s - 2m)',
        count: moderate,
        percentage: views.length > 0 ? Math.round((moderate / views.length) * 100) : 0
      },
      {
        category: 'Deep Study (2m+)',
        count: deep,
        percentage: views.length > 0 ? Math.round((deep / views.length) * 100) : 0
      }
    ];

    // Last viewed
    const sortedViews = [...views].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastViewedAt = sortedViews.length > 0 ? sortedViews[0].timestamp : null;

    // Recent Live Telemetry Events (for real-time radar feed)
    const recentEvents = sortedViews.slice(0, 10).map(v => {
      const ver = versions.find(item => item._id === v.versionId);
      return {
        id: v._id,
        type: (v.action === 'download' ? 'download' : 'view') as 'view' | 'download',
        device: v.device,
        browser: v.browser,
        country: v.country,
        timestamp: v.timestamp,
        durationSeconds: v.durationSeconds,
        versionLabel: ver ? `v${ver.versionNumber}` : undefined
      };
    });

    // Daily views aggregation (past 7 days)
    const dailyViews: DailyViewData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = views.filter(v => {
        const t = new Date(v.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;

      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toISOString().split('T')[0];
      dailyViews.push({
        date: dateLabel,
        fullDate,
        views: count
      });
    }

    // Version Performance
    const versionPerformance: VersionPerformanceData[] = versions.map(ver => {
      const vViews = views.filter(v => v.versionId === ver._id).length;
      return {
        versionId: ver._id,
        versionLabel: `v${ver.versionNumber}`,
        versionNumber: ver.versionNumber,
        commitMessage: ver.commitMessage,
        views: vViews,
        isPublished: resume.publishedVersionId === ver._id,
        createdAt: ver.createdAt
      };
    }).sort((a, b) => a.versionNumber - b.versionNumber);

    // Device breakdown
    const devMap: Record<string, number> = {};
    views.forEach(v => {
      devMap[v.device] = (devMap[v.device] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(devMap).map(([device, count]) => ({
      device,
      count,
      percentage: views.length > 0 ? Math.round((count / views.length) * 100) : 0
    }));

    // Browser breakdown
    const browserMap: Record<string, number> = {};
    views.forEach(v => {
      browserMap[v.browser] = (browserMap[v.browser] || 0) + 1;
    });
    const browserBreakdown = Object.entries(browserMap)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: views.length > 0 ? Math.round((count / views.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Country breakdown
    const countryMap: Record<string, number> = {};
    views.forEach(v => {
      countryMap[v.country] = (countryMap[v.country] || 0) + 1;
    });
    const countryBreakdown = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: views.length > 0 ? Math.round((count / views.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const isPro = this.isUserPro(resume.userId);
    const trialDaysRemaining = user && user.trialStatus === 'active' && user.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      resumeId,
      resumeName: resume.name,
      slug: resume.slug,
      category: resume.category || 'resume',
      trackingEnabled: true,
      isLocked: false,
      isAdvancedAnalyticsLocked: !isPro,
      trialStatus: user?.trialStatus || (isPro ? 'active' : 'expired'),
      trialDaysRemaining,
      isPasscodeProtected: !!resume.isPasscodeProtected,
      plan,
      totalViews: views.length,
      todayViews,
      weekViews,
      totalDownloads,
      downloadRate,
      avgDurationSeconds,
      durationBreakdown,
      recentEvents,
      publishedVersionLabel: publishedVersion ? `v${publishedVersion.versionNumber}` : null,
      lastViewedAt,
      dailyViews,
      versionPerformance,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown
    };
  }

  public getUserContributions(userId: string): ContributionStats {
    const userResumes = this.data.resumes.filter(r => r.userId === userId);
    const resumeMap = new Map<string, Resume>();
    userResumes.forEach(r => resumeMap.set(r._id, r));
    const resumeIds = new Set(userResumes.map(r => r._id));

    const userVersions = this.data.versions.filter(v => resumeIds.has(v.resumeId));
    const userViews = this.data.views.filter(v => resumeIds.has(v.resumeId));

    // Calendar range: 26 weeks ending on the current week's Saturday
    const today = new Date();
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 = Sun, 6 = Sat
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    const totalDays = 26 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    const activitiesByDate = new Map<string, ContributionActivityItem[]>();
    const commitsByDate = new Map<string, number>();
    const viewsByDate = new Map<string, number>();
    const createsByDate = new Map<string, number>();

    const addActivity = (dateStr: string, item: ContributionActivityItem) => {
      if (!activitiesByDate.has(dateStr)) {
        activitiesByDate.set(dateStr, []);
      }
      activitiesByDate.get(dateStr)!.push(item);
    };

    // 1. Resumes created or cloned
    userResumes.forEach(r => {
      const d = r.createdAt.split('T')[0];
      createsByDate.set(d, (createsByDate.get(d) || 0) + 1);
      addActivity(d, {
        type: 'create',
        title: `Created repository '${r.name}'`,
        resumeName: r.name,
        resumeId: r._id,
        timestamp: r.createdAt,
        detail: `Category: ${r.category.toUpperCase()}`
      });
    });

    // 2. Versions committed
    userVersions.forEach(v => {
      const d = v.createdAt.split('T')[0];
      commitsByDate.set(d, (commitsByDate.get(d) || 0) + 1);
      const resume = resumeMap.get(v.resumeId);
      const docName = resume?.name || 'Document';
      addActivity(d, {
        type: 'commit',
        title: `Committed ${v.versionLabel || 'v' + v.versionNumber} to '${docName}'`,
        resumeName: docName,
        resumeId: v.resumeId,
        timestamp: v.createdAt,
        detail: v.commitMessage || 'Updated document version'
      });
    });

    // 3. Recruiter views & downloads
    userViews.forEach(vw => {
      const d = vw.timestamp.split('T')[0];
      viewsByDate.set(d, (viewsByDate.get(d) || 0) + 1);
      const resume = resumeMap.get(vw.resumeId);
      const docName = resume?.name || 'Document';
      addActivity(d, {
        type: 'view',
        title: vw.action === 'download' 
          ? `PDF Download on '${docName}'` 
          : `Recruiter view on '${docName}'`,
        resumeName: docName,
        resumeId: vw.resumeId,
        timestamp: vw.timestamp,
        detail: `${vw.device || 'Desktop'} · ${vw.country || 'Global'}`
      });
    });

    const days: DayContribution[] = [];
    let totalContributions = 0;
    let totalCommits = 0;
    let totalViews = 0;
    let totalCreates = 0;
    let activeDaysCount = 0;

    const iterDate = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {
      const dateStr = iterDate.toISOString().split('T')[0];
      const commits = commitsByDate.get(dateStr) || 0;
      const views = viewsByDate.get(dateStr) || 0;
      const creates = createsByDate.get(dateStr) || 0;
      const total = commits + views + creates;
      const dayActivities = activitiesByDate.get(dateStr) || [];

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (total >= 8) level = 4;
      else if (total >= 5) level = 3;
      else if (total >= 2) level = 2;
      else if (total >= 1) level = 1;

      if (total > 0) {
        activeDaysCount++;
        totalContributions += total;
        totalCommits += commits;
        totalViews += views;
        totalCreates += creates;
      }

      days.push({
        date: dateStr,
        total,
        commits,
        views,
        creates,
        level,
        activities: dayActivities.slice(0, 10)
      });

      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Streaks calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < days.length; i++) {
      if (days[i].total > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    const todayStr = today.toISOString().split('T')[0];
    const todayIdx = days.findIndex(d => d.date === todayStr);
    const checkIdx = todayIdx !== -1 ? todayIdx : days.length - 1;

    for (let i = checkIdx; i >= 0; i--) {
      if (days[i].total > 0) {
        currentStreak++;
      } else if (i === checkIdx && days[i].total === 0) {
        continue;
      } else {
        break;
      }
    }

    return {
      totalContributions,
      totalCommits,
      totalViews,
      totalCreates,
      currentStreak,
      longestStreak,
      activeDaysCount,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days
    };
  }
}

export const db = new InMemoryDb();
