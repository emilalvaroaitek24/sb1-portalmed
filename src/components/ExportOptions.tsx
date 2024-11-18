import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Download, Mail, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptionsProps {
  content: string;
  fileName: string;
}

export function ExportOptions({ content, fileName }: ExportOptionsProps) {
  const [email, setEmail] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const exportAsPDF = async () => {
    const pdf = new jsPDF();
    pdf.text(content, 10, 10);
    pdf.save(`${fileName}.pdf`);
  };

  const exportAsWord = () => {
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendEmail = async () => {
    // In a real app, you'd integrate with an email service
    console.log(`Sending email to: ${email}`);
    alert('Email sent successfully!');
    setShowEmailDialog(false);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportAsPDF} variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        PDF
      </Button>
      
      <Button onClick={exportAsWord} variant="outline" size="sm">
        <FileText className="mr-2 h-4 w-4" />
        Word
      </Button>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="Enter recipient's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={sendEmail} className="w-full">
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}