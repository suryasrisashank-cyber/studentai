import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin/auth';
import { TOOLS_REGISTRY } from '@/lib/tools-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAdmin = checkAdminAuth(req);

    const [maintenance, announcement, aiWelcome, aiSettings, toolSettings] = await Promise.all([
      db.getSiteSetting('maintenance_mode', {
        enabled: false,
        message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
      }),
      db.getSiteSetting('announcement', {
        enabled: false,
        text: '',
        type: 'info',
      }),
      db.getSiteSetting('ai_welcome', {
        greeting: 'Ask. Learn. Understand.',
        subtitle: 'Your free educational assistant for conceptual clarity and exam prep.',
      }),
      db.getSiteSetting('ai_settings', {
        enabled: true,
      }),
      db.getToolSettings(),
    ]);

    const disabledTools: string[] = [];
    const featuredTools: string[] = [];

    for (const tool of TOOLS_REGISTRY) {
      const s = toolSettings.get(tool.slug);
      if (s && !s.isEnabled) {
        disabledTools.push(tool.slug);
      }
      if (s?.isFeatured || (!s && tool.isPopular)) {
        featuredTools.push(tool.slug);
      }
    }

    return NextResponse.json(
      {
        maintenance: {
          enabled: Boolean(maintenance.enabled),
          message:
            typeof maintenance.message === 'string'
              ? maintenance.message
              : 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
        },
        announcement: {
          enabled: Boolean(announcement.enabled),
          text: typeof announcement.text === 'string' ? announcement.text : '',
          type: ['info', 'warning', 'success'].includes(announcement.type) ? announcement.type : 'info',
        },
        ai: {
          enabled: Boolean(aiSettings.enabled),
          greeting: typeof aiWelcome.greeting === 'string' ? aiWelcome.greeting : 'Ask. Learn. Understand.',
          subtitle:
            typeof aiWelcome.subtitle === 'string'
              ? aiWelcome.subtitle
              : 'Your free educational assistant for conceptual clarity and exam prep.',
        },
        disabledTools,
        featuredTools,
        isAdmin,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        maintenance: { enabled: false, message: '' },
        announcement: { enabled: false, text: '', type: 'info' },
        ai: { enabled: true, greeting: 'Ask. Learn. Understand.', subtitle: '' },
        disabledTools: [],
        featuredTools: [],
        isAdmin: false,
      },
      { status: 200 }
    );
  }
}
