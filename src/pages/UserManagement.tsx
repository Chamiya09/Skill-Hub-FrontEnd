import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, type UserDto } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  SparkleIcon,
  SearchIcon,
  UsersIcon,
  CheckIcon,
  BuildingIcon,
  ShieldCheckIcon,
} from '../components/common/Icons';

// Trash / Direct Delete Icon
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // State for direct deletion confirmation modal
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users for the current authenticated company
  const loadUsers = useCallback(async () => {
    if (!currentUser || !currentUser.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await usersApi.getUsersByCompany(currentUser.companyId);
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMessage(err.message || 'Failed to fetch company team members.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated) {
      loadUsers();
    }
  }, [authLoading, isAuthenticated, loadUsers, navigate]);

  // Direct physical deletion handler
  const handleConfirmDirectDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUserDirectly(userToDelete.id);
      
      // Update local state by removing deleted user
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setActionSuccess(`User "${userToDelete.fullName}" was directly and permanently removed.`);
      setUserToDelete(null);

      setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'All' || u.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  return (
    <div className="usermgmt-container">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="auth-alert-success" style={{ marginBottom: '24px' }}>
          <CheckIcon />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert-error" style={{ marginBottom: '24px' }}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="usermgmt-header">
        <div>
          <div className="badge-tag">
            <SparkleIcon />
            <span>ORGANIZATION PORTAL</span>
          </div>
          <h1 className="usermgmt-title">Corporate User Management</h1>
          <p className="usermgmt-subtitle">
            Manage your recruitment team members, HR administrators, and team roles for{' '}
            <strong>{currentUser?.companyName || 'Your Enterprise'}</strong>.
          </p>
        </div>

        <div className="usermgmt-stat-box">
          <div className="stat-label-sm">Active Team Members</div>
          <div className="stat-value-lg">{users.length}</div>
        </div>
      </div>

      {/* Standardized Filter & Search Bar */}
      <div className="filter-card-wrapper" style={{ marginBottom: '24px' }}>
        <div className="filter-grid-bar" style={{ gridTemplateColumns: '2fr 1.2fr auto' }}>
          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search users by name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <span style={{ color: '#94a3b8' }}>
              <UsersIcon />
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="HR_Admin">HR Admin</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Hiring_Manager">Hiring Manager</option>
            </select>
          </div>

          {(searchTerm || selectedRole !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('All');
              }}
              className="btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* User Data Table */}
      <div className="table-card-container">
        <div className="table-responsive-wrapper">
          <table className="enterprise-data-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role & Access</th>
                <th>Organization</th>
                <th>Date Joined</th>
                <th style={{ textAlign: 'right' }}>Direct Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading corporate user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>
                      No team members found
                    </div>
                    <p style={{ fontSize: '13.5px' }}>
                      {searchTerm || selectedRole !== 'All'
                        ? 'Try adjusting your search query or role filter.'
                        : 'No team members are currently registered under this enterprise company account.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initials = user.fullName
                    ? user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'U';

                  return (
                    <tr key={user.id}>
                      {/* User Avatar + Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="table-avatar-circle">
                            {initials}
                          </div>
                          <div>
                            <div className="table-user-name">{user.fullName}</div>
                            <div className="table-user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span
                          className={`table-role-badge ${
                            user.role === 'HR_Admin'
                              ? 'badge-admin'
                              : user.role === 'Recruiter'
                              ? 'badge-recruiter'
                              : 'badge-manager'
                          }`}
                        >
                          {user.role === 'HR_Admin'
                            ? 'HR Admin'
                            : user.role === 'Hiring_Manager'
                            ? 'Hiring Manager'
                            : user.role}
                        </span>
                      </td>

                      {/* Company Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13.5px' }}>
                          <BuildingIcon />
                          <span>{user.companyName || currentUser?.companyName || 'Skill Hub Enterprise'}</span>
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td>
                        <span style={{ color: '#64748b', fontSize: '13.5px' }}>
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Action: Direct Delete */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="table-delete-btn"
                          title="Directly delete this user from the database"
                          onClick={() => setUserToDelete(user)}
                        >
                          <TrashIcon />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="table-footer-bar">
          <span style={{ color: '#64748b', fontSize: '13.5px' }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered users
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00b074', fontSize: '13px', fontWeight: 600 }}>
            <ShieldCheckIcon />
            <span>Direct Database Deletion Active</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Direct Delete */}
      {userToDelete && (
        <div className="modal-backdrop">
          <div className="modal-dialog-card">
            <div className="modal-icon-danger">
              <TrashIcon />
            </div>
            <h3 className="modal-title">Delete User Directly?</h3>
            <p className="modal-desc">
              Are you sure you want to permanently remove <strong>{userToDelete.fullName}</strong> (
              {userToDelete.email}) from the database?
            </p>
            <p className="modal-notice">
              ⚠️ Note: This performs an immediate direct physical delete from PostgreSQL. No disable or block status is applied.
            </p>

            <div className="modal-action-row">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger-btn"
                disabled={isDeleting}
                onClick={handleConfirmDirectDelete}
              >
                {isDeleting ? 'Deleting User...' : 'Yes, Delete Directly'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
