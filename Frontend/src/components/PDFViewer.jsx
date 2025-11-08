import { useState } from 'react';
import { toast } from 'react-toastify';
import { downloadFile, viewPDF } from '../utils/fileUtils';

const PDFViewer = ({
    pdfUrl,
    title,
    filename,
    showDownload = true,
    showView = true,
    size = 'md'
}) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        toast.info('Preparing download...');

        await downloadFile(
            pdfUrl,
            filename,
            (filename) => {
                toast.success(`Downloaded: ${filename}`);
                setIsDownloading(false);
            },
            () => {
                toast.error('Download failed. Please try opening the PDF in a new tab and saving it manually.');
                setIsDownloading(false);
            }
        );
    };

    const handleView = () => {
        viewPDF(pdfUrl, title);
    };

    const buttonSize = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2';

    return (
        <div className="flex gap-2">
            {showView && (
                <button
                    onClick={handleView}
                    className={`inline-flex items-center gap-2 ${buttonSize} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                </button>
            )}

            {showDownload && (
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`inline-flex items-center gap-2 ${buttonSize} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                    {isDownloading ? 'Downloading...' : 'Download'}
                </button>
            )}
        </div>
    );
};

export default PDFViewer;