'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FixStockPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      updated: number;
      inStock: number;
      outOfStock: number;
    };
  } | null>(null);

  const fixStock = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/fix-stock', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (_error) {
      setResult({
        success: false,
        message: 'Failed to connect to server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Fix Product Stock Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>This will update all products with stock = 0 to have stock = 10.</p>
            <p className="mt-2 font-medium">This action is only available to superadmins.</p>
          </div>

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </AlertDescription>
              </div>
              {result.stats && (
                <div className="mt-2 text-sm">
                  <p>• Updated: {result.stats.updated} products</p>
                  <p>• In Stock: {result.stats.inStock} products</p>
                  <p>• Out of Stock: {result.stats.outOfStock} products</p>
                </div>
              )}
            </Alert>
          )}

          <Button 
            onClick={fixStock} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Stock...
              </>
            ) : (
              'Fix Stock Values'
            )}
          </Button>

          <div className="text-xs text-gray-500">
            <p>After running this fix:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>All products will show as &quot;In Stock&quot; on the frontend</li>
              <li>You can then manually adjust stock values in the Product Store Editor</li>
              <li>New products will use the correct stock values from the form</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
