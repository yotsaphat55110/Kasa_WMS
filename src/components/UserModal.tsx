import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { X, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit
}) => {
  const { saveUser, t } = useApp();

  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [status, setStatus] = useState<0 | 1>(1);
  const [role, setRole] = useState<User['role']>('Warehouse Officer');

  useEffect(() => {
    if (userToEdit) {
      setEmployeeCode(userToEdit.employeeCode);
      setUsername(userToEdit.username || userToEdit.employeeCode.toLowerCase().replace('-', ''));
      setPassword(userToEdit.password || '123456');
      setFirstName(userToEdit.firstName);
      setLastName(userToEdit.lastName);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setStatus(userToEdit.status);
      setRole(userToEdit.role);
    } else {
      const code = `EMP-${Math.floor(100 + Math.random() * 900)}`;
      setEmployeeCode(code);
      setUsername(code.toLowerCase().replace('-', ''));
      setPassword('123456');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setStatus(1);
      setRole('Warehouse Officer');
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    saveUser({
      id: userToEdit?.id,
      employeeCode,
      username,
      password,
      firstName,
      lastName,
      email,
      phone,
      status,
      role
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">{userToEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มข้อมูลพนักงานใหม่ (Add User)'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5.2 รหัสพนักงาน (Employee Code) *
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-blue-900 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตำแหน่ง / สิทธิ์ (Role)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as User['role'])}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              >
                <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                <option value="Stock Manager">Stock Manager (ผู้จัดการสต๊อก)</option>
                <option value="Warehouse Officer">Warehouse Officer (เจ้าหน้าที่คลัง)</option>
                <option value="Inspector">Inspector (เจ้าหน้าที่ตรวจสอบ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (Username สำหรับเข้าระบบ)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin, somchai"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>รหัสผ่าน (Password)</span>
                </label>
                <span className="text-[10px] text-blue-600 font-medium">
                  {userToEdit ? 'แก้ไขเปลี่ยนรหัสได้ที่นี่' : 'ค่าเริ่มต้น: 123456'}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ป้อนรหัสผ่านใหม่"
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5.3 ชื่อ (First Name) *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5.3 นามสกุล (Last Name) *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5.4 อีเมล (E-Mail) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@kasa.co.th"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5.5 เบอร์โทรศัพท์ (Phone Number) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-551-3997"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5.6 สถานะการใช้งาน (Status) *
            </label>
            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  checked={status === 1}
                  onChange={() => setStatus(1)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">1 = ใช้งาน (Active)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  checked={status === 0}
                  onChange={() => setStatus(0)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold">0 = ไม่ใช้งาน (Inactive)</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-medium text-slate-700"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-2xs"
            >
              {t.common.save}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
