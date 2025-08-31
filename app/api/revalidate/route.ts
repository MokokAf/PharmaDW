import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// POST /api/revalidate
// Body examples:
// { "path": "/medicaments/123" }
// { "slug": "123" }  // will revalidate /medicaments/123
// Security: set env NEXT_REVALIDATE_TOKEN and send Authorization: Bearer <token>
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = process.env.NEXT_REVALIDATE_TOKEN;
    if (token && authHeader !== `Bearer ${token}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let targetPath: string | undefined = body?.path;
    const slug: string | undefined = body?.slug;
    if (!targetPath && slug) targetPath = `/medicaments/${slug}`;

    if (!targetPath || typeof targetPath !== 'string') {
      return NextResponse.json({ ok: false, error: 'Missing path or slug' }, { status: 400 });
    }

    revalidatePath(targetPath);
    return NextResponse.json({ ok: true, revalidated: targetPath });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// Optional: lightweight GET for health checks
export async function GET() {
  return NextResponse.json({ ok: true, info: 'Use POST with { path } or { slug } to revalidate.' });
}
