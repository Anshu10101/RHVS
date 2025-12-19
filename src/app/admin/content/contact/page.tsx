'use client';

import { ContactPageEditor } from '@/components/Admin';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ContactPageEditorPage() {
  const { hasPermission } = useAdmin();
  const canEdit =
    hasPermission('all') ||
    hasPermission('edit_offices') ||
    hasPermission('edit_contact');

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You don&apos;t have permission to edit contact and office details.
              Please contact a superadmin to request the
              <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                edit_offices
              </code>
              permission.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ContactPageEditor />;
}
