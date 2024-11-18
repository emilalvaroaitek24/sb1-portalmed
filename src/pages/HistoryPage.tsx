import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ExportOptions } from '@/components/ExportOptions';
import { getScribes } from '@/lib/db';
import type { Scribe } from '@/types/scribe';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const [scribes, setScribes] = useState<Scribe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchScribes() {
      try {
        const fetchedScribes = await getScribes();
        setScribes(fetchedScribes);
      } catch (error) {
        console.error('Error fetching scribes:', error);
        toast({
          title: "Error",
          description: "Failed to load history. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchScribes();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">
              Scribe History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scribes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No records found. Start by creating a new scribe.
              </div>
            ) : (
              <ScrollArea className="h-[600px] rounded-md border p-4">
                {scribes.map((scribe, index) => (
                  <div key={scribe.id}>
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {scribe.patientName || 'Unnamed Patient'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(scribe.timestamp, 'PPpp')}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Template: {scribe.templateType}
                          </p>
                        </div>
                        <ExportOptions
                          content={scribe.generatedTemplate}
                          fileName={`${scribe.patientName}_${scribe.templateType}_${format(scribe.timestamp, 'yyyy-MM-dd')}`}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Transcription</h4>
                          <p className="text-sm bg-gray-50 p-3 rounded-md">
                            {scribe.transcription}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Generated Template</h4>
                          <pre className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                            {scribe.generatedTemplate}
                          </pre>
                        </div>
                      </div>
                    </div>
                    {index < scribes.length - 1 && (
                      <Separator className="my-6" />
                    )}
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}