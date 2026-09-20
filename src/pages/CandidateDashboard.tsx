import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function CandidateDashboard() {
  const { currentUser } = useAuth()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser?.firstName || 'Candidate'}
          </h1>
          <p className="mt-2 text-slate-600">
            Track your applications and explore new opportunities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Find Jobs</h3>
          <p className="text-slate-600 mb-6 flex-grow">
            Browse our latest job openings and find your next role.
          </p>
          <Link
            to="/jobs"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Explore Jobs
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <BriefcaseBusiness className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">My Applications</h3>
          <p className="text-slate-600 mb-6 flex-grow">
            Track the status of jobs you've applied for.
          </p>
          <Link
            to="/candidate/applications"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
          >
            View Applications
          </Link>
        </div>
      </div>
    </div>
  )
}
