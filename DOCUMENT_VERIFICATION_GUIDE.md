# Document Verification Feature Guide

## Overview

Document verification has been added to the contestant application process to enhance security and authenticity. Users must now upload a verification document (government-issued ID or similar) when applying to become a contestant.

## User Perspective (Contestant Application)

### Application Form Requirements

When users navigate to **Vote** → **Apply as Contestant**, they will see:

1. **Name** (auto-filled, read-only)
2. **Email** (auto-filled, read-only)
3. **Statement/Reason** (optional text field)
4. **Verification Document** (required) - NEW!
   - Accepted formats: JPG, PNG, PDF
   - Maximum file size: 5MB
   - Upload field with file picker

### Document Upload Process

1. Click "Choose File" to select a document from your device
2. Document is validated for:
   - File type (must be JPG, PNG, or PDF)
   - File size (must be under 5MB)
3. Preview is displayed after successful upload:
   - **For images**: Visual preview of the uploaded image
   - **For PDFs**: Document icon with filename
4. Can re-upload to replace the document

### Validation

The application **cannot be submitted** without a document. Error messages will appear if:

- No document is uploaded when clicking Submit
- File size exceeds 5MB
- File type is not JPG, PNG, or PDF

### Viewing Your Application

After submitting, users can see:

- Application status (Pending/Approved/Rejected)
- Statement submitted
- Document name with "✓ Uploaded" indicator
- Applied date
- Rejection reason (if rejected)

## Admin Perspective (Application Review)

### Reviewing Applications

In **Admin Panel** → **Contestant Requests**, admins can:

1. **View All Applications** with filtering:
   - All, Pending, Approved, Rejected
   - Search by name, email, or contest

2. **For Each Application**, admins see:
   - Applicant name and email
   - Contest name
   - Application status
   - Applied date
   - Statement (if provided)
   - **Verification Document** (NEW!)

### Document Viewing Options

#### For Image Documents (JPG/PNG):

- Full image preview displayed inline
- Click to view full size
- Filename shown below image
- Clear visibility for verification

#### For PDF Documents:

- Document icon with filename
- **Download button** to view the full PDF
- Click "Download" to save and open the document

### Approval Process

1. Review applicant information
2. **Verify the uploaded document** for authenticity
3. Check statement/reason
4. Click **Approve** or **Reject**
   - Rejection requires a reason to be provided

## Technical Implementation

### Data Storage

Documents are stored in localStorage as base64-encoded strings with metadata:

```javascript
{
  name: "drivers_license.jpg",
  type: "image/jpeg",
  data: "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### File Size Limits

- Maximum upload size: **5MB**
- This prevents localStorage overflow and performance issues
- Users are notified if file exceeds limit

### Security Considerations

1. **Client-side validation**: File type and size checked before upload
2. **Required field**: Application cannot proceed without document
3. **Persistent storage**: Documents stored with application until approved/rejected
4. **Admin verification**: Manual review ensures document authenticity

## Workflow

### User Workflow

1. Navigate to Vote page
2. Select contest
3. Click "Apply as Contestant"
4. Fill in statement (optional)
5. **Upload verification document** (required)
6. Preview document
7. Submit application
8. Wait for admin review

### Admin Workflow

1. Navigate to Contestant Requests
2. Review pending applications
3. **View and verify uploaded documents**
4. Check applicant details and statement
5. Approve or reject application
6. Approved applicants become contestants

## Benefits

### For Users

- Transparent verification process
- Clear requirements upfront
- Visual confirmation of upload
- Status tracking

### For Administrators

- Enhanced security and authenticity
- Visual verification before approval
- Ability to download/save documents
- Reduced fraudulent applications

### For System

- Improved trust in election process
- Better contestant verification
- Audit trail with documents
- Professional application process

## Notes

- Documents are stored locally in browser storage
- Clearing browser data will remove documents
- For production systems, consider server-side storage
- Ensure users have valid identification documents ready before applying
