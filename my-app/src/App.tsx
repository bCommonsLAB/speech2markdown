import React, { useState, useEffect } from 'react';
import DropArea from './components/DropArea';
import MicrophoneRecorder from './components/Microphone';
import AudioPlayer from './components/AudioPlayer';
import TranscriptionOutput from './components/TranscriptionOutput';
import MarkdownViewer from './components/MarkdownViewer';
import LoadingOverlay from './components/LoadingOverlay';
import { fetchTemplates, transcribeAudio } from './api/api';

const App: React.FC = () => {
    const [templates, setTemplates] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [audioFile, setAudioFile] = useState<Blob | File | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [markdown, setMarkdown] = useState<string>('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const templates = await fetchTemplates();
        setTemplates(templates);
    };

    const handleFileChange = async (file: Blob) => {
        const audioFile = file instanceof File ? file : convertBlobToFile(file, 'audio.mp3', 'audio/mp3');
        setAudioFile(audioFile);

        if (audioFile && selectedTemplate) {
            setLoading(true);
            const response = await transcribeAudio(audioFile, selectedTemplate);
            setLoading(false);
            if (response.error) {
                setTranscription(`Fehler bei der Transkription: ${response.error}`);
            } else {
                setTranscription('Transkription erfolgreich');
                setMarkdown(response.filled_template);
            }
        }
    };

    const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTemplate(event.target.value);
    };

    return (
        <div className="container">
            <header>
                <h1>Audio Transkription</h1>
            </header>
            <div className='action-wraper'>
                <MicrophoneRecorder onFileChange={handleFileChange} />
                <DropArea onFileChange={handleFileChange} />
            </div>
            <div>
                <label htmlFor="template-select" className='templateDescribt'>Wählen Sie ein Template:</label>
                <select id="template-select" className='templateselector' value={selectedTemplate} onChange={handleTemplateChange}>
                    <option value="">--Bitte wählen--</option>
                    {templates.map(template => (
                        <option key={template} value={template}>{template}</option>
                    ))}
                </select>
            </div>
            {audioFile && <AudioPlayer file={audioFile} />}
            {transcription && <TranscriptionOutput transcription={transcription} />}
            {markdown && <MarkdownViewer markdown={markdown} />}
            {markdown && (
                <button onClick={() => downloadMarkdown(markdown)}>Markdown herunterladen</button>
            )}
            {loading && <LoadingOverlay />}
        </div>
    );
};

const convertBlobToFile = (blob: Blob, filename: string, mimeType: string): File => {
    return new File([blob], filename, { type: mimeType });
};

const downloadMarkdown = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.md';
    a.click();
};

export default App;
