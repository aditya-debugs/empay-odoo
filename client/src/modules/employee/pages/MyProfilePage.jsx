import { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../../features/ui';
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
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/me');
        setProfile(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
          dob: data.user.dob || '',
          bankName: data.user.bankName || '',
          bankAccountNo: data.user.bankAccountNo || '',
          bankIfsc: data.user.bankIfsc || ''
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
        dob: formData.dob
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
        bankAccountNo: formData.bankAccountNo,
        bankIfsc: formData.bankIfsc
      });
      setSuccess('Bank details updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to save bank details');
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
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
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

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <Card className="mt-6 p-6">
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Bank Name"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
            />
            <Input
              label="Account Number"
              name="bankAccountNo"
              value={formData.bankAccountNo}
              onChange={handleInputChange}
            />
            <Input
              label="IFSC Code"
              name="bankIfsc"
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
        <Card className="mt-6 p-6">
          <p className="text-sm text-ink-muted mb-4">Security features coming soon</p>
          <Button disabled>Change Password</Button>
        </Card>
      )}
    </div>
  );
}
