import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { Users, UserPlus, Search, Phone, Mail, CheckCircle2, XCircle, Edit2, KeyRound, Eye, EyeOff, X } from 'lucide-react';

interface UserManagementViewProps {
  onOpenModal: (user?: User) => void;
  searchTerm: string;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  onOpenModal,
  searchTerm
}) => {
  const { users, toggleUserStatus, saveUser, t } = useApp();
  const [localSearch, setLocalSearch] = useState('');

  // Change Password state
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleOpenChangePassword = (user: User) => {
    setChangePasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setPassError('');
    setPassSuccess('');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser) return;

    if (!newPassword.trim()) {
      setPassError('กรุณาระบุรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 4) {
      setPassError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    saveUser({
      ...changePasswordUser,
      password: newPassword.trim()
    });

    setPassSuccess(`เปลี่ยนรหัสผ่านสำหรับ ${changePasswordUser.firstName} สำเร็จแล้ว`);
    setTimeout(() => {
      setChangePasswordUser(null);
      setPassSuccess('');
      setPassError('');
    }, 1000);
  };

  const query = (searchTerm || localSearch).toLowerCase();

  const filteredUsers = users.filter(u => {
    return (
      !query ||
      u.employeeCode.toLowerCase().includes(query) ||
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{t.users.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.users.desc}</p>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs shadow-2xs transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.users.btnNew}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหารหัสพนักงาน, ชื่อ, อีเมล, เบอร์โทร..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          รวม <strong className="text-slate-900 font-bold">{filteredUsers.length}</strong> คน
        </span>
      </div>

      {/* Users Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            className={`bg-white rounded-xl border p-4 shadow-2xs transition-all relative flex flex-col justify-between ${
              user.status === 1 ? 'border-slate-200 hover:border-slate-300' : 'border-rose-200 bg-rose-50/20'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-[11px] font-mono text-blue-700 font-bold">
                      {user.employeeCode} • {user.role}
                    </p>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => onOpenModal(user)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  title="แก้ไขข้อมูล"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contact & Account Info */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                {/* Account row: Shows username and edit password button without revealing plain text password */}
                <div className="flex items-center justify-between text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400 font-sans text-[11px]">User:</span>
                    <strong className="text-slate-800 truncate">{user.username || user.employeeCode.toLowerCase()}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenChangePassword(user)}
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-md shadow-2xs transition-all shrink-0 ml-2"
                    title="แก้ไขรหัสผ่านพนักงาน"
                  >
                    <KeyRound className="w-3 h-3 text-blue-500" />
                    <span>แก้ไขรหัสผ่าน</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Footer Toggle */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {user.status === 1 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    1 = Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                    <XCircle className="w-3 h-3" />
                    0 = Inactive
                  </span>
                )}
              </div>

              <button
                onClick={() => toggleUserStatus(user.id)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
                  user.status === 1
                    ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                    : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                {user.status === 1 ? 'สลับเป็นไม่ใช้งาน' : 'สลับเป็นใช้งาน'}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Change Password Modal */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">แก้ไขรหัสผ่านพนักงาน</h3>
              </div>
              <button
                onClick={() => setChangePasswordUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              {/* Target User Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <img
                  src={changePasswordUser.avatarUrl}
                  alt={changePasswordUser.firstName}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">
                    {changePasswordUser.firstName} {changePasswordUser.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    รหัส: <span className="font-semibold text-blue-700">{changePasswordUser.employeeCode}</span> | User: <span className="font-semibold text-slate-700">{changePasswordUser.username || changePasswordUser.employeeCode.toLowerCase()}</span>
                  </p>
                </div>
              </div>

              {/* Status Alerts */}
              {passError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่ (New Password) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPassError('');
                    }}
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                    className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่ (Confirm Password) *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPassError('');
                  }}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Quick Preset */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>รหัสผ่านมาตรฐาน:</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword('123456');
                    setConfirmPassword('123456');
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ใช้รหัสเริ่มต้น (123456)
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกรหัสผ่าน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
