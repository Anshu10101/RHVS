'use client';

import { Button } from '@/components/ui/button';
import { notifications } from '@/lib/notifications';

export function NotificationDemo() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Notification System Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Success Notifications</h3>
          <Button onClick={() => notifications.eventCreated()}>
            Event Created
          </Button>
          <Button onClick={() => notifications.eventUpdated()}>
            Event Updated
          </Button>
          <Button onClick={() => notifications.photoUploaded(5)}>
            Photos Uploaded
          </Button>
          <Button onClick={() => notifications.memberRegistered()}>
            Member Registered
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Error Notifications</h3>
          <Button 
            variant="destructive" 
            onClick={() => notifications.error('Test Error', 'This is a test error message')}
          >
            Test Error
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => notifications.networkError()}
          >
            Network Error
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => notifications.unauthorized()}
          >
            Unauthorized
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Warning Notifications</h3>
          <Button 
            variant="outline" 
            onClick={() => notifications.warning('Test Warning', 'This is a test warning message')}
          >
            Test Warning
          </Button>
          <Button 
            variant="outline" 
            onClick={() => notifications.unsavedChanges()}
          >
            Unsaved Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => notifications.confirmDelete('event')}
          >
            Confirm Delete
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Info Notifications</h3>
          <Button 
            variant="secondary" 
            onClick={() => notifications.info('Test Info', 'This is a test info message')}
          >
            Test Info
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => notifications.loading('process your request')}
          >
            Loading
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => notifications.comingSoon('Advanced Analytics')}
          >
            Coming Soon
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Examples</h3>
        <pre className="text-sm text-gray-700">
{`// Success notifications
notifications.eventCreated();
notifications.photoUploaded(5);
notifications.memberRegistered();

// Error notifications
notifications.error('Error Title', 'Error description');
notifications.networkError();
notifications.unauthorized();

// Warning notifications
notifications.warning('Warning Title', 'Warning description');
notifications.unsavedChanges();

// Info notifications
notifications.info('Info Title', 'Info description');
notifications.loading('saving your changes');`}
        </pre>
      </div>
    </div>
  );
}
