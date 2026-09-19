import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { TOOLS_REGISTRY } from '@/lib/tools-registry';
import { PDF_TOOLS_REGISTRY } from '@/lib/pdf-tools-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const settings = await db.getToolSettings();

    const studentTools = TOOLS_REGISTRY.map((t) => {
      const s = settings.get(t.slug);
      return {
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        icon: t.icon,
        route: `/tools/${t.slug}`,
        isEnabled: s ? s.isEnabled : true,
        isFeatured: s ? s.isFeatured : Boolean(t.isPopular),
        usageCount: s ? s.usageCount : 0,
        isPdfTool: false,
      };
    });

    const pdfTools = PDF_TOOLS_REGISTRY.map((t) => {
      const s = settings.get(t.slug);
      return {
        slug: t.slug,
        name: t.name,
        category: `pdf-${t.category}`,
        description: t.description,
        icon: t.icon,
        route: `/pdf-tools/${t.slug}`,
        isEnabled: s ? s.isEnabled : true,
        isFeatured: s ? s.isFeatured : Boolean(t.isPopular),
        usageCount: s ? s.usageCount : 0,
        isPdfTool: true,
        status: t.status,
      };
    });

    const tools = [...studentTools, ...pdfTools];

    return NextResponse.json({ tools }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load tools' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, isEnabled, isFeatured } = body || {};

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Tool slug is required' }, { status: 400 });
    }

    await db.updateToolSetting(
      slug,
      typeof isEnabled === 'boolean' ? isEnabled : undefined,
      typeof isFeatured === 'boolean' ? isFeatured : undefined
    );

    await db.auditAdminAction('TOOL_TOGGLED', {
      slug,
      isEnabled: typeof isEnabled === 'boolean' ? isEnabled : undefined,
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : undefined,
    });

    return NextResponse.json({ success: true, slug }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}
