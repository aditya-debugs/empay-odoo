import { useEffect, useState } from 'react';
import { Card, Button, Input, DateInput } from '../../../features/ui';
import { Save } from 'lucide-react';
import api from '../../../services/api';

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', dob: '',
    pan: '', aadhaar: '',
    bankName: '', bankBranch: '', bankAccountNo: '', bankIfsc: '',
    aboutMe: '', skills: '', certificates: '', resumeUrl: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/me');
        setProfile(data.user);
        const emp = data.user.employee || {};
        setFormData({
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          phone: emp.phone || '',
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
          pan: emp.pan || '',
          aadhaar: emp.aadhaar || '',
          bankName: emp.bankName || '',
          bankBranch: emp.bankBranch || '',
          bankAccountNo: emp.bankAccountNo || '',
          bankIfsc: emp.bankIfsc || '',
          aboutMe: emp.aboutMe || '',
          skills: (emp.skills || []).join(', '),
          certificates: (emp.certificates || []).join(', '),
          resumeUrl: emp.resumeUrl || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/employees/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        dob: formData.dob,
        pan: formData.pan,
        aadhaar: formData.aadhaar,
      });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/employees/bank-details', {
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        bankAccountNo: formData.bankAccountNo,
        bankIfsc: formData.bankIfsc,
      });
      setSuccess('Bank details updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('New passwords do not match');
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">Manage your personal information and preferences</p>

      {error && <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mt-4 p-3 bg-success-50 text-success-700 rounded-lg text-sm">{success}</div>}

      {/* Tabs */}
      <div className="mt-8 border-b border-ink-200 flex gap-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-2 font-medium text-sm transition-colors ${
            activeTab === 'personal' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'
          }`}
        >
          Personal Info
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`pb-3 px-2 font-medium text-sm transition-colors ${
            activeTab === 'bank' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'
          }`}
        >
          Bank Details
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`pb-3 px-2 font-medium text-sm transition-colors ${
            activeTab === 'career' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'
          }`}
        >
          Career & Resume
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-2 font-medium text-sm transition-colors ${
            activeTab === 'security' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'
          }`}
        >
          Security
        </button>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <Card className="mt-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <DateInput
              label="Date of Birth"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
            />
            <Input
              label="PAN Number"
              name="pan"
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={handleInputChange}
            />
            <Input
              label="Aadhaar Number"
              name="aadhaar"
              placeholder="1234 5678 9012"
              value={formData.aadhaar}
              onChange={handleInputChange}
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            loading={saving}
            className="mt-6"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </Card>
      )}

      {/* Career Info Tab */}
      {activeTab === 'career' && (
        <Card className="mt-6 p-6">
          <div className="space-y-6">
            <Input
              label="Professional Summary (About Me)"
              name="aboutMe"
              multiline="true"
              placeholder="Tell us about yourself and why you love your job..."
              value={formData.aboutMe}
              onChange={handleInputChange}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Skills (comma separated)"
                name="skills"
                placeholder="JavaScript, React, Node.js..."
                value={formData.skills}
                onChange={handleInputChange}
              />
              <Input
                label="Certificates (comma separated)"
                name="certificates"
                placeholder="AWS Certified, Google Cloud..."
                value={formData.certificates}
                onChange={handleInputChange}
              />
            </div>
            <Input
              label="Resume Link / Portfolio URL"
              name="resumeUrl"
              placeholder="https://drive.google.com/..."
              value={formData.resumeUrl}
              onChange={handleInputChange}
            />
          </div>
          <Button
            onClick={async () => {
              setSaving(true);
              setError('');
              setSuccess('');
              try {
                await api.patch('/employees/profile', {
                  aboutMe: formData.aboutMe,
                  skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                  certificates: formData.certificates.split(',').map(c => c.trim()).filter(Boolean),
                  resumeUrl: formData.resumeUrl
                });
                setSuccess('Career information updated successfully');
              } catch (err) {
                setError(err.message || 'Failed to save career info');
              } finally {
                setSaving(false);
              }
            }}
            loading={saving}
            className="mt-6"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Career Info
          </Button>
        </Card>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <Card className="mt-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Bank Name"
              name="bankName"
              placeholder="HDFC Bank"
              value={formData.bankName}
              onChange={handleInputChange}
            />
            <Input
              label="Branch Name"
              name="bankBranch"
              placeholder="Andheri West"
              value={formData.bankBranch}
              onChange={handleInputChange}
            />
            <Input
              label="Account Number"
              name="bankAccountNo"
              placeholder="XXXXXXXXXXXX"
              value={formData.bankAccountNo}
              onChange={handleInputChange}
            />
            <Input
              label="IFSC Code"
              name="bankIfsc"
              placeholder="HDFC0001234"
              value={formData.bankIfsc}
              onChange={handleInputChange}
            />
          </div>
          <Button
            onClick={handleSaveBankDetails}
            loading={saving}
            className="mt-6"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Bank Details
          </Button>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="mt-6 p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={formData.currentPassword || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={formData.newPassword || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            loading={saving}
            className="mt-6 w-full"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Update Password
          </Button>
        </Card>
      )}
    </div>
  );
}



