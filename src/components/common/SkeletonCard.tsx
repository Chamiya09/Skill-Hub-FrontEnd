import React from 'react'

interface SkeletonCardProps {
  count?: number
  variant?: 'grid' | 'rich-grid' | 'list' | 'metric'
  className?: string
}

export const JobCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '220px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Top Header Row */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Company Logo box placeholder */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#e2e8f0',
                flexShrink: 0,
              }}
            />
            {/* Company name & date placeholders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '110px', height: '14px', borderRadius: '6px', background: '#e2e8f0' }} />
              <div style={{ width: '70px', height: '11px', borderRadius: '4px', background: '#f1f5f9' }} />
            </div>
          </div>
          {/* Match badge placeholder */}
          <div style={{ width: '88px', height: '24px', borderRadius: '9999px', background: '#e6f9f2' }} />
        </div>

        {/* Title placeholder */}
        <div style={{ width: '78%', height: '18px', borderRadius: '6px', background: '#cbd5e1', marginBottom: '14px' }} />

        {/* Meta badges placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '90px', height: '13px', borderRadius: '4px', background: '#e2e8f0' }} />
          <div style={{ width: '70px', height: '13px', borderRadius: '4px', background: '#e2e8f0' }} />
          <div style={{ width: '80px', height: '13px', borderRadius: '4px', background: '#f1f5f9' }} />
        </div>

        {/* Department tag placeholder */}
        <div style={{ width: '80px', height: '22px', borderRadius: '6px', background: '#f1f5f9', marginBottom: '12px' }} />
      </div>

      {/* Footer Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #f8fafc',
          marginTop: 'auto',
        }}
      >
        <div style={{ width: '130px', height: '16px', borderRadius: '6px', background: '#e2e8f0' }} />
        <div style={{ width: '90px', height: '28px', borderRadius: '8px', background: '#e2e8f0' }} />
      </div>
    </div>
  )
}

export const TableRowSkeleton: React.FC<{ cols?: number; rows?: number; hasAvatar?: boolean }> = ({
  cols = 5,
  rows = 1,
  hasAvatar = false,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse" style={{ borderBottom: '1px solid #f1f5f9' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <td key={i} style={{ padding: '16px 20px' }}>
              {i === 0 && hasAvatar ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#cbd5e1',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ width: '70%', height: '14px', borderRadius: '4px', background: '#cbd5e1' }} />
                    <div style={{ width: '45%', height: '11px', borderRadius: '4px', background: '#e2e8f0' }} />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: '14px',
                    borderRadius: '6px',
                    background: i === 0 ? '#cbd5e1' : '#e2e8f0',
                    width: i === 0 ? '70%' : i === cols - 1 ? '40%' : '55%',
                  }}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export const SkeletonStatValue: React.FC<{ width?: string | number; height?: string | number }> = ({
  width = '64px',
  height = '24px',
}) => (
  <span
    className="animate-pulse"
    style={{
      display: 'inline-block',
      width,
      height,
      borderRadius: '6px',
      background: '#cbd5e1',
      verticalAlign: 'middle',
    }}
  />
)

export const SkeletonStatLabel: React.FC<{ width?: string | number }> = ({ width = '110px' }) => (
  <span
    className="animate-pulse"
    style={{
      display: 'inline-block',
      width,
      height: '12px',
      borderRadius: '4px',
      background: '#e2e8f0',
      verticalAlign: 'middle',
      marginTop: '4px',
    }}
  />
)

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div
      className="animate-pulse"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ width: '100px', height: '13px', borderRadius: '4px', background: '#e2e8f0' }} />
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9' }} />
      </div>
      <div style={{ width: '60px', height: '28px', borderRadius: '6px', background: '#cbd5e1', marginBottom: '8px' }} />
      <div style={{ width: '120px', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
    </div>
  )
}

export const SleekSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string; text?: string }> = ({
  size = 'md',
  color = '#00b074',
  text,
}) => {
  const pixelSize = size === 'sm' ? 20 : size === 'lg' ? 38 : 28
  const strokeWidth = size === 'sm' ? 2.5 : 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px' }}>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {text && (
        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#64748b' }}>
          {text}
        </span>
      )}
    </div>
  )
}

export const SkeletonGrid: React.FC<SkeletonCardProps> = ({ count = 6, variant = 'rich-grid', className = '' }) => {
  const gridClass = variant === 'rich-grid' ? 'rich-jobs-grid' : 'jobs-grid'

  return (
    <div className={`${gridClass} ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <JobCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export const CalendarSkeleton: React.FC = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return (
    <div className="creative-calendar-grid animate-pulse" style={{ opacity: 0.9 }}>
      {days.map((day) => (
        <div
          key={day}
          className="creative-weekday-cell"
          style={{ height: '38px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ width: '34px', height: '12px', background: '#cbd5e1', borderRadius: '4px', display: 'inline-block' }} />
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="creative-date-cell"
          style={{
            minHeight: '115px',
            background: '#ffffff',
            border: '1px solid #f1f5f9',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', display: 'inline-block' }} />
            {i % 4 === 0 && <span style={{ width: '38px', height: '10px', borderRadius: '4px', background: '#f1f5f9' }} />}
          </div>
          {i % 2 === 0 && (
            <div style={{ width: '88%', height: '22px', borderRadius: '6px', background: '#e2e8f0', marginTop: '4px' }} />
          )}
          {i % 3 === 0 && (
            <div style={{ width: '70%', height: '20px', borderRadius: '6px', background: '#f1f5f9' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default SkeletonGrid
