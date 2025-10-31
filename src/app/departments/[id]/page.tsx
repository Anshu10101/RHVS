import Image from 'next/image';
import { headers } from 'next/headers';

async function getHierarchy(id: string) {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/public/departments/${id}/hierarchy`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export default async function DepartmentHierarchyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getHierarchy(id);

  const department = data?.department ?? { name_en: 'Department', name_hi: 'विभाग' };
  const posts = (data?.posts ?? []).sort((a: any, b: any) => a.position_order - b.position_order);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-orange-50 via-white to-orange-50/30 py-8 border-b border-orange-100/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto overflow-visible">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Department</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300"></div>
            </div>
            <div className="overflow-visible">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 mb-2 tracking-tight leading-[1.3] py-1 overflow-visible" style={{ textRendering: 'optimizeLegibility', fontFeatureSettings: '"kern" 1', lineHeight: '1.3' }}>
                {department.name_hi}
              </h1>
            </div>
            <p className="text-base md:text-lg text-slate-600 font-medium">{department.name_en}</p>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          {/* All posts in hierarchy order - each in centered format */}
          <div className="max-w-5xl mx-auto space-y-8">
            {posts.map((p: any, idx: number) => {
              const members = p.members && p.members.length > 0 ? p.members : [];
              const hasMembers = members.length > 0;
              
              return (
                <div key={`${p.id}-${idx}`} className="space-y-4">
                  {/* Post heading */}
                  <div className="text-center mb-4 overflow-visible">
                    <div className="overflow-visible">
                      <h3 className="text-2xl font-extrabold text-orange-900 leading-[1.4] py-0.5 overflow-visible" style={{ textRendering: 'optimizeLegibility', fontFeatureSettings: '"kern" 1', lineHeight: '1.4' }}>{p.name_hi}</h3>
                    </div>
                    <p className="text-sm text-orange-700/80">{p.name_en}</p>
                  </div>

                  {/* All members in same layout - grid with max 6 per row, centered */}
                  {hasMembers ? (
                    <div className="flex flex-wrap justify-center gap-4">
                      {members.map((m: any, mi: number) => (
                        <div key={mi} className="text-center w-[160px] flex-shrink-0">
                          <div className="relative mx-auto h-40 w-40 rounded-full overflow-hidden ring-2 ring-orange-200 shadow mb-2">
                            {m?.photo_path ? (
                              <Image 
                                src={m.photo_path.startsWith('/') ? m.photo_path : `/${m.photo_path}`} 
                                alt={m.name} 
                                fill 
                                className="object-cover" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 text-orange-800">
                                <span className="text-4xl font-bold">{(department.name_en || 'RHVS').split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-slate-900">{m.name}</h2>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="relative mx-auto h-40 w-40 rounded-full overflow-hidden ring-2 ring-orange-200 shadow mb-2">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 text-orange-800">
                          <span className="text-4xl font-bold">{(department.name_en || 'RHVS').split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase()}</span>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Position Vacant</h2>
                    </div>
                  )}

                  {/* Divider between posts (except last) */}
                  {idx < posts.length - 1 && (
                    <div className="flex items-center justify-center gap-2 text-orange-300 pt-2">
                      <div className="h-px w-12 bg-orange-200" />
                      <span className="text-xs">●</span>
                      <div className="h-px w-12 bg-orange-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}


