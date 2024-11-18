export interface Scribe {
  id: string;
  patientName: string;
  templateType: string;
  transcription: string;
  generatedTemplate: string;
  timestamp: number;
}