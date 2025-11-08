import Certificate from '../../Model/CertificateModel.js';
import ExamAttempt from '../../Model/ExamAttemptModel.js';
import { Course } from '../../Model/CourseModel.js';
import User from '../../Model/usermodel.js';
import Tutor from '../../Model/TutorModel.js';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadToCloudinary } from '../../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate certificate
export const generateCertificate = async (req, res) => {
  try {
    const { examAttemptId } = req.body;
    const userId = req.user._id;

    // Get exam attempt
    const examAttempt = await ExamAttempt.findOne({ _id: examAttemptId, userId })
      .populate('examId', 'title')
      .populate('courseId');

    if (!examAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    if (!examAttempt.passed) {
      return res.status(400).json({
        success: false,
        message: 'Certificate can only be generated for passed exams'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      userId,
      examAttemptId,
      isValid: true
    });

    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists',
        certificate: existingCertificate
      });
    }

    // Get user and tutor details
    const user = await User.findById(userId);
    const course = examAttempt.courseId;
    const tutor = await Tutor.findById(course.tutor);

    // Create certificate record
    const certificate = new Certificate({
      userId,
      courseId: course._id,
      examAttemptId,
      studentName: user.full_name,
      courseName: course.title,
      tutorName: tutor.full_name,
      completionDate: examAttempt.completedAt,
      score: examAttempt.score,
      metadata: {
        examTitle: examAttempt.examId.title,
        totalQuestions: examAttempt.answers.length,
        timeSpent: examAttempt.timeSpent,
        generatedBy: 'system',
        template: 'default'
      }
    });

    await certificate.save();

    // Generate PDF certificate
    const certificateResult = await generateCertificatePDF(certificate);

    // Update certificate with Cloudinary URL and public ID
    certificate.certificateUrl = certificateResult.url;
    certificate.cloudinaryPublicId = certificateResult.publicId;
    await certificate.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: {
        _id: certificate._id,
        certificateId: certificate.certificateId,
        verificationCode: certificate.verificationCode,
        certificateUrl: certificate.certificateUrl,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        score: certificate.score,
        verificationUrl: certificate.verificationUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
};

// Generate certificate PDF using Puppeteer and upload to Cloudinary
const generateCertificatePDF = async (certificate) => {
  try {
    if (!puppeteer) {
      throw new Error('Puppeteer is not available');
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Create certificate HTML
    const certificateHTML = createCertificateHTML(certificate);

    await page.setContent(certificateHTML, { waitUntil: 'networkidle0' });

    // Generate PDF - optimized for single page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px'
      },
      scale: 0.85,
      width: '11.7in',
      height: '8.3in'
    });

    await browser.close();

    // Upload PDF to Cloudinary
    const uploadResult = await uploadToCloudinary(pdfBuffer, {
      public_id: `certificate_${certificate.certificateId}`,
      resource_type: 'raw',
      format: 'pdf'
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  } catch (error) {
    console.error('PDF generation failed, falling back to HTML:', error);
    return await generateHTMLCertificate(certificate);
  }
};

// HTML certificate generator (fallback when Puppeteer fails)
const generateHTMLCertificate = async (certificate) => {
  try {
    const htmlContent = createCertificateHTML(certificate);
    const htmlBuffer = Buffer.from(htmlContent, 'utf8');

    // Upload HTML to Cloudinary
    const uploadResult = await uploadToCloudinary(htmlBuffer, {
      public_id: `certificate_${certificate.certificateId}`,
      resource_type: 'raw',
      format: 'html'
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  } catch (error) {
    throw error;
  }
};

// Create modern certificate HTML template
const createCertificateHTML = (certificate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .certificate {
          background: white;
          width: 100%;
          max-width: 800px;
          height: 600px;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 60px 40px;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        
        .certificate::after {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 2px solid #f0f0f0;
          border-radius: 15px;
          pointer-events: none;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          z-index: 1;
        }
        
        .title {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          z-index: 1;
        }
        
        .subtitle {
          font-size: 16px;
          color: #666;
          font-weight: 400;
          margin-bottom: 40px;
          z-index: 1;
        }
        
        .recipient-section {
          margin-bottom: 35px;
          z-index: 1;
        }
        
        .recipient-label {
          font-size: 14px;
          color: #888;
          font-weight: 400;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .recipient-name {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
          position: relative;
        }
        
        .recipient-name::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
        
        .course-section {
          margin-bottom: 35px;
          z-index: 1;
        }
        
        .course-label {
          font-size: 14px;
          color: #888;
          font-weight: 400;
          margin-bottom: 8px;
        }
        
        .course-name {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 20px;
        }
        
        .details {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          z-index: 1;
        }
        
        .detail-item {
          text-align: center;
        }
        
        .detail-label {
          font-size: 12px;
          color: #888;
          font-weight: 400;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .score-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .verification {
          font-size: 10px;
          color: #aaa;
          line-height: 1.4;
          z-index: 1;
        }
        
        .verification-code {
          font-weight: 600;
          color: #666;
        }
        
        .decorative-element {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
        }
        
        .decorative-element:nth-child(1) {
          top: -50px;
          right: -50px;
        }
        
        .decorative-element:nth-child(2) {
          bottom: -50px;
          left: -50px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="decorative-element"></div>
        <div class="decorative-element"></div>
        
        <div class="logo">S</div>
        
        <div class="title">Certificate of Achievement</div>
        <div class="subtitle">This certifies that</div>
        
        <div class="recipient-section">
          <div class="recipient-name">${certificate.studentName}</div>
        </div>
        
        <div class="course-section">
          <div class="course-label">has successfully completed</div>
          <div class="course-name">${certificate.courseName}</div>
        </div>
        
        <div class="details">
          <div class="detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${new Date(certificate.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Score</div>
            <div class="detail-value">
              <span class="score-badge">${certificate.score}%</span>
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Instructor</div>
            <div class="detail-value">${certificate.tutorName}</div>
          </div>
        </div>
        
        <div class="verification">
          Certificate ID: <span class="verification-code">${certificate.certificateId}</span><br>
          Verification: <span class="verification-code">${certificate.verificationCode}</span><br>
          Verify at: ${process.env.FRONTEND_URL || 'https://scholaro.com'}/verify-certificate/${certificate.verificationCode}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Get user certificates
export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const certificates = await Certificate.find({ userId, isValid: true })
      .populate('courseId', 'title course_thumbnail')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCertificates = await Certificate.countDocuments({ userId, isValid: true });

    res.status(200).json({
      success: true,
      certificates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCertificates / limit),
        totalCertificates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
};

// Download certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findOne({
      _id: certificateId,
      userId,
      isValid: true
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Record download
    await certificate.recordDownload();

    // For Cloudinary URLs, redirect to the direct download URL
    if (certificate.certificateUrl && certificate.certificateUrl.includes('cloudinary.com')) {
      // Add download parameters to Cloudinary URL
      const downloadUrl = certificate.certificateUrl.replace('/upload/', '/upload/fl_attachment/');
      
      return res.status(200).json({
        success: true,
        message: 'Certificate download URL',
        downloadUrl: downloadUrl,
        fileName: `certificate_${certificate.studentName.replace(/\s+/g, '_')}.pdf`
      });
    }

    // Fallback for local files (legacy support)
    const filePath = path.join(__dirname, '../../', certificate.certificateUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Certificate file not found'
      });
    }

    // Determine file type and set appropriate headers
    const fileExtension = path.extname(filePath).toLowerCase();
    let contentType = 'application/pdf';
    let fileName = `certificate_${certificate.studentName.replace(/\s+/g, '_')}.pdf`;

    if (fileExtension === '.html') {
      contentType = 'text/html';
      fileName = `certificate_${certificate.studentName.replace(/\s+/g, '_')}.html`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('Error reading certificate file:', error);
      res.status(500).json({
        success: false,
        message: 'Error reading certificate file'
      });
    });

    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message
    });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findByVerificationCode(verificationCode)
      .populate('courseId', 'title')
      .populate('userId', 'full_name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid'
      });
    }

    if (certificate.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Certificate has expired'
      });
    }

    res.status(200).json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        tutorName: certificate.tutorName,
        completionDate: certificate.completionDate,
        score: certificate.score,
        isValid: certificate.isValid,
        verificationCode: certificate.verificationCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message
    });
  }
};