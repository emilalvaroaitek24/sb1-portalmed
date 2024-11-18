import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, CircleStopIcon as Stop, Send } from 'lucide-react';
import { ExportOptions } from '@/components/ExportOptions';
import { saveScribe } from '@/lib/db';
import type { Scribe } from '@/types/scribe';
import { useToast } from '@/hooks/use-toast';

const DEEPGRAM_API_KEY = "f4ffb2f5e3ebb6fa73a3cb4bf6021d34928e07fa";
const deepgramSTTUrl = "https://api.deepgram.com/v1/listen";
const togetherApiKey = "ef59ffaa887ba258b4945004a613beb671bf6bf4a3e3a18e2966e3064694581a";

export default function RecordPage() {
  const [patientName, setPatientName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("SOAP Note");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Inactive");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState("");
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!(await checkApiConnection())) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setRecordingStatus('Recording stopped. Ready to submit for transcription.');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingStatus('Recording...');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Microphone access is required. Please enable it in your browser settings.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitForTranscription = async () => {
    if (!audioBlob) {
      toast({
        title: "Error",
        description: "No recording available. Please record audio first.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');

    try {
      setRecordingStatus('Transcribing...');

      const response = await fetch(deepgramSTTUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !data.results.channels || data.results.channels.length === 0) {
        throw new Error('Invalid response from Deepgram API');
      }

      const transcript = data.results.channels[0].alternatives[0].transcript;
      setTranscription(transcript);
      setRecordingStatus('Transcription complete. Generating template...');
      
      await generateTemplate(transcript);
    } catch (error) {
      console.error('Error during transcription:', error);
      setRecordingStatus('Error during transcription. Please try again.');
      toast({
        title: "Transcription Failed",
        description: `${error instanceof Error ? error.message : 'Unknown error'}. Please try recording again or check your internet connection.`,
        variant: "destructive"
      });
    }
  };

  const generateTemplate = async (transcript: string) => {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
          messages: [
            {
              role: 'system',
              content: `You are a medical scribe assistant. Generate a ${selectedTemplate} based on the following transcript. Use the exact format for the template type.`
            },
            {
              role: 'user',
              content: `Patient Name: ${patientName}\n\nTranscript: ${transcript}\n\nPlease generate a ${selectedTemplate} based on this information.`
            }
          ]
        })
      });

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      setGeneratedTemplate(generatedContent);
      setRecordingStatus('Template generated successfully.');

      // Save to Firebase
      const newScribe: Scribe = {
        id: Date.now().toString(),
        patientName,
        templateType: selectedTemplate,
        transcription: transcript,
        generatedTemplate: generatedContent,
        timestamp: Date.now()
      };

      await saveScribe(newScribe);
      toast({
        title: "Success",
        description: "Template generated and saved successfully.",
      });

    } catch (error) {
      console.error('Error generating template:', error);
      setRecordingStatus('Error generating template. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const checkApiConnection = async () => {
    try {
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error connecting to Deepgram API:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to the transcription service. Please check your internet connection and try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-600">Let&apos;s simulate a patient visit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">Press &quot;Start Recording&quot; and Scribe will start recording your conversation.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <Input
                  type="text"
                  placeholder="Enter Patient Name (Optional)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOAP Note">SOAP Note</SelectItem>
                    <SelectItem value="Progress Note">Progress Note</SelectItem>
                    <SelectItem value="Consultation Note">Consultation Note</SelectItem>
                    <SelectItem value="Procedure Note">Procedure Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isRecording ? (
                <Button onClick={startRecording} className="w-full">
                  <Mic className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full">
                  <Stop className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )}

              {audioBlob && (
                <Button onClick={submitForTranscription} className="w-full bg-blue-500 hover:bg-blue-600">
                  <Send className="mr-2 h-4 w-4" /> Submit for Transcription
                </Button>
              )}

              <div className="text-gray-500">{recordingStatus}</div>
              {audioBlob && (
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[100px]">{transcription}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Generated Template</span>
              {generatedTemplate && (
                <ExportOptions
                  content={generatedTemplate}
                  fileName={`${patientName}_${selectedTemplate}_${new Date().toISOString().split('T')[0]}`}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap">{generatedTemplate}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}